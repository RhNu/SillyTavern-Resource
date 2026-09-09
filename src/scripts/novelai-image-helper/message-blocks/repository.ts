import { ImageBlockSchema, type ImageBlock } from '../domain/block';

const VARIABLE_KEY = 'novelaiImageHelper';

type StoredPayload = {
  schemaVersion: 1;
  blocks: Record<string, ImageBlock>;
};

function option(messageId: number): VariableOption {
  return { type: 'message', message_id: messageId };
}

function normalizePayload(value: unknown): StoredPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { schemaVersion: 1, blocks: {} };
  }
  const source = value as Record<string, unknown>;
  const rawBlocks =
    source.blocks && typeof source.blocks === 'object' && !Array.isArray(source.blocks) ? source.blocks : {};
  const blocks: Record<string, ImageBlock> = {};
  Object.entries(rawBlocks).forEach(([id, block]) => {
    const parsed = ImageBlockSchema.safeParse(block);
    if (parsed.success && parsed.data.id === id) blocks[id] = parsed.data;
  });
  return { schemaVersion: 1, blocks };
}

export class MessageBlockRepository {
  read(messageId: number): StoredPayload {
    const variables = getVariables(option(messageId));
    return normalizePayload(variables?.[VARIABLE_KEY]);
  }

  find(messageId: number, blockId: string): ImageBlock | undefined {
    return this.read(messageId).blocks[blockId];
  }

  write(messageId: number, blocks: ImageBlock[]): void {
    updateVariablesWith(variables => {
      const next = variables && typeof variables === 'object' ? { ...variables } : {};
      next[VARIABLE_KEY] = {
        schemaVersion: 1,
        blocks: Object.fromEntries(blocks.map(block => [block.id, ImageBlockSchema.parse(block)])),
      } satisfies StoredPayload;
      return next;
    }, option(messageId));
  }

  update(messageId: number, blockId: string, updater: (block: ImageBlock) => ImageBlock): ImageBlock | undefined {
    let result: ImageBlock | undefined;
    updateVariablesWith(variables => {
      const next = variables && typeof variables === 'object' ? { ...variables } : {};
      const payload = normalizePayload(next[VARIABLE_KEY]);
      const current = payload.blocks[blockId];
      if (!current) return next;
      result = ImageBlockSchema.parse(updater(structuredClone(current)));
      payload.blocks[blockId] = result;
      next[VARIABLE_KEY] = payload;
      return next;
    }, option(messageId));
    return result;
  }

  remove(messageId: number, blockId: string): void {
    const payload = this.read(messageId);
    delete payload.blocks[blockId];
    this.write(messageId, Object.values(payload.blocks));
  }
}
