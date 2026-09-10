import { ImageBlockSchema, type ImageBlock } from '../domain/block';
import { createLogger } from '../app/logger';

const VARIABLE_KEY = 'novelaiImageHelper';
const logger = createLogger('message-blocks/repository');
const reportedInvalidPayloads = new Set<number>();

type StoredPayload = {
  schemaVersion: 1;
  blocks: Record<string, ImageBlock>;
};

function option(messageId: number): VariableOption {
  return { type: 'message', message_id: messageId };
}

function normalizePayload(value: unknown, messageId?: number): StoredPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { schemaVersion: 1, blocks: {} };
  }
  const source = value as Record<string, unknown>;
  const rawBlocks =
    source.blocks && typeof source.blocks === 'object' && !Array.isArray(source.blocks) ? source.blocks : {};
  const blocks: Record<string, ImageBlock> = {};
  let invalidBlockCount = 0;
  Object.entries(rawBlocks).forEach(([id, block]) => {
    const parsed = ImageBlockSchema.safeParse(block);
    if (parsed.success && parsed.data.id === id) blocks[id] = parsed.data;
    else invalidBlockCount += 1;
  });
  if (messageId !== undefined && invalidBlockCount > 0 && !reportedInvalidPayloads.has(messageId)) {
    reportedInvalidPayloads.add(messageId);
    logger.warn('读取到无效的消息图片块数据，已忽略损坏条目', { messageId, invalidBlockCount });
  }
  return { schemaVersion: 1, blocks };
}

export class MessageBlockRepository {
  read(messageId: number): StoredPayload {
    try {
      const variables = getVariables(option(messageId));
      return normalizePayload(variables?.[VARIABLE_KEY], messageId);
    } catch (error) {
      logger.error('读取消息图片块失败', error, { messageId });
      throw error;
    }
  }

  find(messageId: number, blockId: string): ImageBlock | undefined {
    return this.read(messageId).blocks[blockId];
  }

  write(messageId: number, blocks: ImageBlock[]): void {
    try {
      updateVariablesWith(variables => {
        const next = variables && typeof variables === 'object' ? { ...variables } : {};
        next[VARIABLE_KEY] = {
          schemaVersion: 1,
          blocks: Object.fromEntries(blocks.map(block => [block.id, ImageBlockSchema.parse(block)])),
        } satisfies StoredPayload;
        return next;
      }, option(messageId));
      logger.debug('消息图片块已写入', { messageId, blockCount: blocks.length });
    } catch (error) {
      logger.error('写入消息图片块失败', error, { messageId, blockCount: blocks.length });
      throw error;
    }
  }

  update(messageId: number, blockId: string, updater: (block: ImageBlock) => ImageBlock): ImageBlock | undefined {
    let result: ImageBlock | undefined;
    try {
      updateVariablesWith(variables => {
        const next = variables && typeof variables === 'object' ? { ...variables } : {};
        const payload = normalizePayload(next[VARIABLE_KEY], messageId);
        const current = payload.blocks[blockId];
        if (!current) return next;
        result = ImageBlockSchema.parse(updater(structuredClone(current)));
        payload.blocks[blockId] = result;
        next[VARIABLE_KEY] = payload;
        return next;
      }, option(messageId));
    } catch (error) {
      logger.error('更新消息图片块失败', error, { messageId, blockId });
      throw error;
    }
    if (result) logger.debug('消息图片块已更新', { messageId, blockId, status: result.status });
    return result;
  }

  remove(messageId: number, blockId: string): void {
    try {
      const payload = this.read(messageId);
      delete payload.blocks[blockId];
      this.write(messageId, Object.values(payload.blocks));
      logger.info('消息图片块已删除', { messageId, blockId });
    } catch (error) {
      logger.error('删除消息图片块失败', error, { messageId, blockId });
      throw error;
    }
  }
}
