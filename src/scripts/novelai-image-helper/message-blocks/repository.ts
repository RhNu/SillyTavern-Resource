import { captureMessageSnapshot } from '../platform/tavern/message-snapshot';
import { z } from 'zod';
import { ImageBlockSchema, type ImageBlock } from '../domain/block';
import { matchAnchors } from '../domain/anchor';

export const VARIABLE_KEY = 'novelaiImageHelper';
const StoredImageSchema = ImageBlockSchema.omit({ id: true, status: true, error: true }).extend({
  pending: z.boolean().optional(),
  error: ImageBlockSchema.shape.error.unwrap().omit({ attempts: true }).optional(),
});
type StoredImage = z.infer<typeof StoredImageSchema>;
type Payload = { schemaVersion: 2; images: Record<string, StoredImage> };

function normalize(value: unknown): Payload {
  if (value === undefined) return { schemaVersion: 2, images: {} };
  return z.object({ schemaVersion: z.literal(2), images: z.record(z.string(), StoredImageSchema) }).parse(value);
}

/** Chat-scoped records. Message text is the ownership index; message variables are never read. */
export class ChatImageRepository {
  private destroyed = false;
  private readonly chatId = SillyTavern.getCurrentChatId();
  private readonly runtime = new Map<string, Pick<ImageBlock, 'status' | 'error'>>();
  private assertChat(): void {
    if (this.destroyed || SillyTavern.getCurrentChatId() !== this.chatId)
      throw new Error('聊天已切换，已取消图片数据写入');
  }
  private payload(): Payload {
    this.assertChat();
    return normalize(getVariables({ type: 'chat' })[VARIABLE_KEY]);
  }
  private mutate(updater: (payload: Payload) => void): void {
    this.assertChat();
    // Synchronous updates read the latest store, never a snapshot from before an awaited request.
    updateVariablesWith(
      variables => {
        const payload = normalize(variables[VARIABLE_KEY]);
        updater(payload);
        return { ...variables, [VARIABLE_KEY]: payload };
      },
      { type: 'chat' },
    );
  }
  private inflate(id: string, stored: StoredImage): ImageBlock {
    const { pending, ...data } = stored;
    return ImageBlockSchema.parse({
      ...data,
      id,
      status: pending
        ? 'prepared'
        : stored.error || stored.pendingAssociation
          ? 'failed'
          : stored.outputs.length
            ? 'ready'
            : 'draft',
      ...(stored.pendingAssociation && !stored.error
        ? {
            error: {
              code: 'ASSOCIATION_PENDING',
              message: '图片已保存，等待完成背景登记',
              stage: 'associate',
              retryable: true,
            },
          }
        : {}),
      ...this.runtime.get(id),
    });
  }
  private deflate(block: ImageBlock): StoredImage {
    const { id: _id, status, error, ...data } = ImageBlockSchema.parse(block);
    const { attempts: _attempts, ...failure } = error ?? {};
    return StoredImageSchema.parse({
      ...data,
      ...(status === 'prepared' ? { pending: true } : {}),
      ...(status === 'failed' && error ? { error: { ...failure, message: error.message.slice(0, 500) } } : {}),
    });
  }
  read(messageId: number): { blocks: Record<string, ImageBlock> } {
    const payload = this.payload();
    const message = getChatMessages(messageId)[0];
    const ids = new Set(matchAnchors(message?.message ?? '').map(anchor => anchor.id));
    return {
      blocks: Object.fromEntries(
        [...ids].flatMap(id => (payload.images[id] ? [[id, this.inflate(id, payload.images[id])]] : [])),
      ),
    };
  }
  find(messageId: number, blockId: string): ImageBlock | undefined {
    return this.read(messageId).blocks[blockId];
  }
  /** Only an analysis transaction can create records before their text references exist. */
  prepare(blocks: ImageBlock[]): void {
    this.mutate(payload =>
      blocks.forEach(block => {
        if (payload.images[block.id]) throw new Error(`图片 ID 已存在：${block.id}`);
        payload.images[block.id] = this.deflate({ ...block, status: 'prepared' });
      }),
    );
  }
  finalize(ids: string[]): void {
    this.mutate(payload =>
      ids.forEach(id => {
        if (payload.images[id]) delete payload.images[id].pending;
        this.runtime.delete(id);
      }),
    );
  }
  update(messageId: number, blockId: string, updater: (block: ImageBlock) => ImageBlock): ImageBlock | undefined {
    const current = this.find(messageId, blockId);
    if (!current) return undefined;
    const result = ImageBlockSchema.parse(updater(structuredClone(current)));
    if (result.id !== blockId) throw new Error('不能修改图片 ID');
    const stored = this.deflate(result);
    if (JSON.stringify(this.payload().images[blockId]) !== JSON.stringify(stored)) {
      this.mutate(payload => {
        payload.images[blockId] = stored;
      });
    }
    this.runtime.set(blockId, { status: result.status, error: result.error });
    return result;
  }
  releaseRuntime(blockId: string): void {
    this.runtime.delete(blockId);
  }
  destroy(): void {
    this.destroyed = true;
    this.runtime.clear();
  }
  /** Guard every task against chat changes, swipe changes, edits and shifted floor numbers. */
  captureTask(messageId: number, blockId: string): () => void {
    const assertMessage = captureMessageSnapshot(messageId);
    const prompt = JSON.stringify(this.find(messageId, blockId)?.prompt);
    return () => {
      this.assertChat();
      assertMessage();
      if (JSON.stringify(this.find(messageId, blockId)?.prompt) !== prompt) {
        throw new Error('提示词已变化，已取消旧图片任务');
      }
    };
  }

  /** Reconcile incomplete commits and collect only records unreferenced by every swipe. */
  reconcile(onlyIds?: string[]): void {
    this.assertChat();
    const referenced = new Set(
      getChatMessages('0-{{lastMessageId}}', { include_swipes: true }).flatMap(message =>
        message.swipes.flatMap(text => matchAnchors(text).map(anchor => anchor.id)),
      ),
    );
    const payload = this.payload();
    const ids = onlyIds ?? Object.keys(payload.images);
    if (!ids.some(id => payload.images[id] && (!referenced.has(id) || payload.images[id].pending))) return;
    this.mutate(current =>
      ids.forEach(id => {
        if (!referenced.has(id)) delete current.images[id];
        else if (current.images[id]) delete current.images[id].pending;
        this.runtime.delete(id);
      }),
    );
  }
}
