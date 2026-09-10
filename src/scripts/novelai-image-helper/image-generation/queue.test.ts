import { afterEach, describe, expect, test, vi } from 'vitest';
import type { ImageBlock } from '../domain/block';
import { DEFAULT_SETTINGS } from '../settings/schema';
import type { SettingsStore } from '../settings/store';
import type { NovelAiClient } from '../platform/imggen-novelai/client';
import type { MessageBlockRepository } from '../message-blocks/repository';
import { uploadGeneratedImage } from '../platform/tavern/image-upload';
import { GenerationQueue, type GenerationQueueCompletionSummary } from './queue';

vi.mock('../platform/tavern/image-upload', () => ({
  uploadGeneratedImage: vi.fn(),
}));

type FakeRepository = {
  blocks: Map<string, ImageBlock>;
  find: (messageId: number, blockId: string) => ImageBlock | undefined;
  update: (messageId: number, blockId: string, updater: (block: ImageBlock) => ImageBlock) => ImageBlock | undefined;
};

function createBlock(messageId: number, blockId: string): ImageBlock {
  return {
    schemaVersion: 1,
    id: blockId,
    revision: 0,
    sourceMessageHash: `hash-${messageId}`,
    summary: '测试场景',
    prompt: {
      main: { positive: '1girl', negative: '' },
      characters: [],
    },
    status: 'draft',
    outputs: [],
  };
}

function createRepository(blocks: ImageBlock[]): FakeRepository {
  const values = new Map(blocks.map(block => [`${block.sourceMessageHash}:${block.id}`, block]));
  const key = (messageId: number, blockId: string) => `hash-${messageId}:${blockId}`;
  return {
    blocks: values,
    find(messageId, blockId) {
      return values.get(key(messageId, blockId));
    },
    update(messageId, blockId, updater) {
      const current = values.get(key(messageId, blockId));
      if (!current) return undefined;
      const next = updater(structuredClone(current));
      values.set(key(messageId, blockId), next);
      return next;
    },
  };
}

function createSettings(): SettingsStore {
  return { get: () => structuredClone(DEFAULT_SETTINGS) } as SettingsStore;
}

function createClient() {
  const capabilities = vi.fn().mockResolvedValue({
    configured: true,
    models: [{ id: DEFAULT_SETTINGS.generation.model, maxCharacters: 22 }],
  });
  const generate = vi.fn().mockResolvedValue({
    blob: new Blob(['png'], { type: 'image/png' }),
    seed: 123,
    model: DEFAULT_SETTINGS.generation.model,
  });
  return { capabilities, generate };
}

function createQueue(
  repository: FakeRepository,
  client: ReturnType<typeof createClient>,
  onQueueFinished: (summary: GenerationQueueCompletionSummary) => void,
): GenerationQueue {
  return new GenerationQueue(
    repository as unknown as MessageBlockRepository,
    createSettings(),
    client as unknown as NovelAiClient,
    { onQueueFinished },
  );
}

async function waitForSummary(callback: ReturnType<typeof vi.fn>): Promise<GenerationQueueCompletionSummary> {
  await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
  return callback.mock.calls[0]![0] as GenerationQueueCompletionSummary;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('GenerationQueue completion reporting', () => {
  test('aggregates tasks queued in the same drain into one completion summary', async () => {
    vi.stubGlobal(
      'eventEmit',
      vi.fn(() => Promise.resolve()),
    );
    vi.stubGlobal('toastr', { success: vi.fn(), error: vi.fn() });
    vi.mocked(uploadGeneratedImage).mockResolvedValue('/uploads/one.png');

    const repository = createRepository([createBlock(1, 'one'), createBlock(1, 'two')]);
    const client = createClient();
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished);

    expect(queue.enqueue(1, 'one')).toBe(true);
    expect(queue.enqueue(1, 'two')).toBe(true);
    const summary = await waitForSummary(onQueueFinished);

    expect(summary).toMatchObject({ succeededCount: 2, failedCount: 0, cancelledCount: 0 });
    expect(summary.requestId).toEqual(expect.any(String));
    expect(summary.failureMessages).toEqual([]);
    expect(repository.find(1, 'one')?.status).toBe('ready');
    expect(repository.find(1, 'two')?.status).toBe('ready');
  });

  test('includes failed task details while retaining successful tasks in the summary', async () => {
    vi.stubGlobal(
      'eventEmit',
      vi.fn(() => Promise.resolve()),
    );
    vi.stubGlobal('toastr', { success: vi.fn(), error: vi.fn() });
    vi.mocked(uploadGeneratedImage).mockResolvedValue('/uploads/one.png');

    const repository = createRepository([createBlock(2, 'failed'), createBlock(2, 'succeeded')]);
    const client = createClient();
    client.generate.mockRejectedValueOnce(new Error('服务端超时'));
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished);

    queue.enqueue(2, 'failed');
    queue.enqueue(2, 'succeeded');
    const summary = await waitForSummary(onQueueFinished);

    expect(summary).toMatchObject({ succeededCount: 1, failedCount: 1, cancelledCount: 0 });
    expect(summary.failureMessages).toEqual(['2:failed：服务端超时']);
    expect(repository.find(2, 'failed')?.status).toBe('failed');
    expect(repository.find(2, 'succeeded')?.status).toBe('ready');
  });

  test('does not report an interrupted queue after destroy', async () => {
    vi.stubGlobal(
      'eventEmit',
      vi.fn(() => Promise.resolve()),
    );
    vi.stubGlobal('toastr', { success: vi.fn(), error: vi.fn() });
    vi.mocked(uploadGeneratedImage).mockResolvedValue('/uploads/one.png');

    type CapabilitiesResponse = { configured: boolean; models: Array<{ id: string; maxCharacters: number }> };
    let resolveCapabilities: ((value: CapabilitiesResponse) => void) | undefined;
    const client = createClient();
    client.capabilities.mockImplementation(
      () =>
        new Promise<CapabilitiesResponse>(resolve => {
          resolveCapabilities = resolve;
        }),
    );
    const onQueueFinished = vi.fn();
    const queue = createQueue(createRepository([createBlock(3, 'one')]), client, onQueueFinished);

    queue.enqueue(3, 'one');
    queue.destroy();
    resolveCapabilities?.({
      configured: true,
      models: [{ id: DEFAULT_SETTINGS.generation.model, maxCharacters: 22 }],
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(onQueueFinished).not.toHaveBeenCalled();
  });
});
