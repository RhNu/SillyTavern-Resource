import type { ImageBlock } from '../domain/block';
import { NovelAiClient } from '../platform/imggen-novelai/client';
import { uploadGeneratedImage } from '../platform/tavern/image-upload';
import type { SettingsStore } from '../settings/store';
import type { MessageBlockRepository } from '../message-blocks/repository';

export const BLOCKS_CHANGED_EVENT = 'novelai_image_helper_blocks_changed';

type QueueTask = { messageId: number; blockId: string };

function taskKey(task: QueueTask): string {
  return `${task.messageId}:${task.blockId}`;
}

function retryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /429|5\d\d|timeout|network|fetch/i.test(message);
}

export class GenerationQueue {
  private readonly pending: QueueTask[] = [];
  private readonly known = new Set<string>();
  private active?: { task: QueueTask; controller: AbortController };
  private destroyed = false;

  constructor(
    private readonly repository: MessageBlockRepository,
    private readonly settings: SettingsStore,
    private readonly client: NovelAiClient,
  ) {}

  enqueue(messageId: number, blockId: string): boolean {
    const task = { messageId, blockId };
    const key = taskKey(task);
    if (this.destroyed || this.known.has(key)) return false;
    const block = this.repository.find(messageId, blockId);
    if (!block) return false;
    this.known.add(key);
    this.pending.push(task);
    this.setStatus(task, 'queued');
    void this.drain();
    return true;
  }

  cancel(messageId: number, blockId: string): void {
    const key = taskKey({ messageId, blockId });
    const index = this.pending.findIndex(task => taskKey(task) === key);
    if (index >= 0) {
      this.pending.splice(index, 1);
      this.known.delete(key);
      this.setStatus({ messageId, blockId }, 'draft');
    }
    if (this.active && taskKey(this.active.task) === key) this.active.controller.abort('cancelled');
  }

  isActive(messageId: number, blockId: string): boolean {
    return Boolean(this.active && taskKey(this.active.task) === taskKey({ messageId, blockId }));
  }

  destroy(): void {
    this.destroyed = true;
    this.pending.splice(0).forEach(task => this.setStatus(task, 'draft'));
    this.active?.controller.abort('destroyed');
    this.known.clear();
  }

  private setStatus(
    task: QueueTask,
    status: ImageBlock['status'],
    error?: ImageBlock['error'],
  ): ImageBlock | undefined {
    const result = this.repository.update(task.messageId, task.blockId, block => ({
      ...block,
      revision: block.revision + 1,
      status,
      error,
    }));
    void eventEmit(BLOCKS_CHANGED_EVENT, task.messageId);
    return result;
  }

  private async drain(): Promise<void> {
    if (this.active || this.destroyed) return;
    const task = this.pending.shift();
    if (!task) return;

    const controller = new AbortController();
    this.active = { task, controller };
    const key = taskKey(task);
    const settings = this.settings.get();
    const timeout = setTimeout(() => controller.abort('timeout'), settings.generation.timeoutMs);
    try {
      const block = this.setStatus(task, 'generating');
      if (!block) throw new Error('图片块已不存在');

      const capabilities = await this.client.capabilities(controller.signal);
      if (!capabilities.configured) throw new Error('TOKEN_NOT_CONFIGURED · 服务端未配置 NOVELAI_TOKEN');
      const model = capabilities.models.find(entry => entry.id === settings.generation.model);
      if (!model) throw new Error(`后端不支持模型 ${settings.generation.model}`);
      if (block.prompt.characters.length > model.maxCharacters) {
        throw new Error(`${settings.generation.model} 最多支持 ${model.maxCharacters} 个角色`);
      }

      const generated = await this.client.generate(block.prompt, settings.generation, controller.signal);
      this.setStatus(task, 'uploading');
      const url = await uploadGeneratedImage(generated.blob, controller.signal);
      this.repository.update(task.messageId, task.blockId, current => ({
        ...current,
        revision: current.revision + 1,
        status: 'ready',
        error: undefined,
        outputs: [
          ...current.outputs,
          { url, seed: generated.seed, model: generated.model, createdAt: new Date().toISOString() },
        ],
      }));
      toastr.success('图片已生成', 'NovelAI 图片助手');
    } catch (error) {
      const cancelled = controller.signal.aborted && controller.signal.reason !== 'timeout';
      this.setStatus(
        task,
        cancelled ? 'draft' : 'failed',
        cancelled
          ? undefined
          : {
              code: controller.signal.reason === 'timeout' ? 'TIMEOUT' : 'GENERATION_FAILED',
              message: error instanceof Error ? error.message : String(error),
              retryable: retryable(error),
            },
      );
      if (!cancelled) toastr.error(error instanceof Error ? error.message : String(error), 'NovelAI 图片助手');
    } finally {
      clearTimeout(timeout);
      this.known.delete(key);
      this.active = undefined;
      void eventEmit(BLOCKS_CHANGED_EVENT, task.messageId);
      void this.drain();
    }
  }
}
