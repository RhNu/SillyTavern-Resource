import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ImageBlock } from '../domain/block';
import type { MessageBlockRepository } from '../message-blocks/repository';
import type { NovelAiClient } from '../platform/imggen-novelai/client';
import { RequestError } from '../platform/request-error';
import { registerGeneratedChatBackground } from '../platform/tavern/chat-background-registry';
import { uploadGeneratedImage } from '../platform/tavern/image-upload';
import { DEFAULT_SETTINGS, type Settings } from '../settings/schema';
import type { SettingsStore } from '../settings/store';
import { GenerationQueue, type GenerationQueueCompletionSummary, type GenerationQueueOptions } from './queue';

vi.mock('../platform/tavern/image-upload', () => ({
  uploadGeneratedImage: vi.fn(),
}));

vi.mock('../platform/tavern/chat-background-registry', () => ({
  registerGeneratedChatBackground: vi.fn(),
}));

type FakeRepository = {
  blocks: Map<string, ImageBlock>;
  find: (messageId: number, blockId: string) => ImageBlock | undefined;
  update: (messageId: number, blockId: string, updater: (block: ImageBlock) => ImageBlock) => ImageBlock | undefined;
};

type CapabilitiesResponse = { configured: boolean; models: Array<{ id: string; maxCharacters: number }> };

const MODEL_ID = DEFAULT_SETTINGS.generation.model;
const CAPABILITIES: CapabilitiesResponse = { configured: true, models: [{ id: MODEL_ID, maxCharacters: 22 }] };

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

function createSettings(overrides: Partial<Settings['generation']> = {}): SettingsStore {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.generation = { ...settings.generation, ...overrides };
  return { get: () => structuredClone(settings) } as SettingsStore;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

/** 复刻真实 fetch：信号一旦中止就以 abort reason 拒绝。 */
function abortable<T>(signal: AbortSignal | undefined, promise: Promise<T>): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise<T>((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    promise.then(resolve, reject);
  });
}

function createClient(capabilities: Promise<CapabilitiesResponse> = Promise.resolve(CAPABILITIES)) {
  const capabilitiesMock = vi.fn((signal?: AbortSignal) => abortable(signal, capabilities));
  const generate = vi.fn((_bundle: unknown, _settings: unknown, signal?: AbortSignal) =>
    abortable(
      signal,
      Promise.resolve({
        blob: new Blob(['png'], { type: 'image/png' }),
        seed: 123,
        model: MODEL_ID,
      }),
    ),
  );
  return { capabilities: capabilitiesMock, generate };
}

function createQueue(
  repository: FakeRepository,
  client: ReturnType<typeof createClient>,
  onQueueFinished: (summary: GenerationQueueCompletionSummary) => void,
  options: Omit<GenerationQueueOptions, 'onQueueFinished'> = {},
  generation: Partial<Settings['generation']> = {},
): GenerationQueue {
  return new GenerationQueue(
    repository as unknown as MessageBlockRepository,
    createSettings(generation),
    client as unknown as NovelAiClient,
    { onQueueFinished, sleep: async () => {}, now: () => 0, random: () => 0.5, ...options },
  );
}

async function waitForSummary(callback: ReturnType<typeof vi.fn>): Promise<GenerationQueueCompletionSummary> {
  await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
  return callback.mock.calls[0]![0] as GenerationQueueCompletionSummary;
}

beforeEach(() => {
  vi.stubGlobal(
    'eventEmit',
    vi.fn(() => Promise.resolve()),
  );
  vi.stubGlobal('toastr', { success: vi.fn(), error: vi.fn(), info: vi.fn() });
  vi.mocked(uploadGeneratedImage).mockReset();
  vi.mocked(uploadGeneratedImage).mockResolvedValue('/uploads/one.png');
  vi.mocked(registerGeneratedChatBackground).mockReset();
  vi.mocked(registerGeneratedChatBackground).mockResolvedValue();
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('GenerationQueue completion reporting', () => {
  test('aggregates tasks queued in the same drain into one completion summary', async () => {
    const repository = createRepository([createBlock(1, 'one'), createBlock(1, 'two')]);
    const client = createClient();
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished);

    expect(queue.enqueue(1, 'one')).toEqual({ ok: true });
    expect(queue.enqueue(1, 'two')).toEqual({ ok: true });
    const summary = await waitForSummary(onQueueFinished);

    expect(summary).toMatchObject({ succeededCount: 2, failedCount: 0, cancelledCount: 0, retriedCount: 0 });
    expect(summary.requestId).toEqual(expect.any(String));
    expect(summary.failureMessages).toEqual([]);
    expect(repository.find(1, 'one')?.status).toBe('ready');
    expect(repository.find(1, 'two')?.status).toBe('ready');
  });

  test('includes failed task details while retaining successful tasks in the summary', async () => {
    const repository = createRepository([createBlock(2, 'failed'), createBlock(2, 'succeeded')]);
    const client = createClient();
    client.generate.mockRejectedValueOnce(new RequestError('内容审核拒绝', { statusCode: 400 }));
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished);

    queue.enqueue(2, 'failed');
    queue.enqueue(2, 'succeeded');
    const summary = await waitForSummary(onQueueFinished);

    expect(summary).toMatchObject({ succeededCount: 1, failedCount: 1, cancelledCount: 0 });
    expect(summary.failureMessages).toEqual(['2:failed：内容审核拒绝']);
    expect(repository.find(2, 'failed')?.status).toBe('failed');
    expect(repository.find(2, 'failed')?.error).toMatchObject({
      code: 'INVALID_REQUEST',
      retryable: false,
      stage: 'generate',
    });
    expect(repository.find(2, 'succeeded')?.status).toBe('ready');
  });

  test('does not report an interrupted queue after destroy', async () => {
    const pending = deferred<CapabilitiesResponse>();
    const client = createClient(pending.promise);
    const onQueueFinished = vi.fn();
    const queue = createQueue(createRepository([createBlock(3, 'one')]), client, onQueueFinished);

    queue.enqueue(3, 'one');
    queue.destroy();
    pending.resolve(CAPABILITIES);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(onQueueFinished).not.toHaveBeenCalled();
  });
});

describe('GenerationQueue throttling', () => {
  test('keeps the jittered throttle window between consecutive tasks', async () => {
    const sleeps: number[] = [];
    const repository = createRepository([createBlock(1, 'one'), createBlock(1, 'two')]);
    const client = createClient();
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished, {
      sleep: async ms => {
        sleeps.push(ms);
      },
      random: () => 0.5,
      now: () => 0,
    });

    queue.enqueue(1, 'one');
    queue.enqueue(1, 'two');
    await waitForSummary(onQueueFinished);

    // 基准 4000ms、抖动系数 1.0：第一个任务的首次生成不等待，
    // 第二个任务必须等满一个窗口才能再次请求 NovelAI。
    expect(sleeps).toEqual([4_000]);
  });

  test('throttles retries with the same window instead of retrying immediately', async () => {
    const sleeps: number[] = [];
    const repository = createRepository([createBlock(1, 'one')]);
    const client = createClient();
    client.generate.mockRejectedValueOnce(new RequestError('上游限流', { statusCode: 429 }));
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished, {
      sleep: async ms => {
        sleeps.push(ms);
      },
      random: () => 0.5,
    });

    queue.enqueue(1, 'one');
    await waitForSummary(onQueueFinished);

    expect(client.generate).toHaveBeenCalledTimes(2);
    expect(sleeps.length).toBeGreaterThan(0);
    expect(sleeps.every(ms => ms === 4_000)).toBe(true);
  });
});

describe('GenerationQueue retry policy', () => {
  test('retries retryable failures and succeeds within the budget', async () => {
    const repository = createRepository([createBlock(4, 'one')]);
    const client = createClient();
    client.generate
      .mockRejectedValueOnce(new RequestError('上游暂时不可用', { statusCode: 502 }))
      .mockRejectedValueOnce(new RequestError('上游暂时不可用', { statusCode: 503 }));
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished, {}, { retryCount: 2 });

    queue.enqueue(4, 'one');
    const summary = await waitForSummary(onQueueFinished);

    expect(client.generate).toHaveBeenCalledTimes(3);
    expect(summary).toMatchObject({ succeededCount: 1, failedCount: 0, retriedCount: 2 });
    expect(repository.find(4, 'one')?.status).toBe('ready');
    expect(repository.find(4, 'one')?.error).toBeUndefined();
  });

  test('gives up after the retry budget and keeps the failure retryable', async () => {
    const repository = createRepository([createBlock(5, 'one')]);
    const client = createClient();
    client.generate.mockRejectedValue(new RequestError('上游暂时不可用', { statusCode: 503 }));
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished, {}, { retryCount: 1 });

    queue.enqueue(5, 'one');
    const summary = await waitForSummary(onQueueFinished);

    expect(client.generate).toHaveBeenCalledTimes(2);
    expect(summary).toMatchObject({ succeededCount: 0, failedCount: 1, retriedCount: 1 });
    expect(repository.find(5, 'one')?.error).toMatchObject({
      code: 'UPSTREAM',
      retryable: true,
      stage: 'generate',
      attempts: 2,
    });
  });

  test('does not retry non-retryable failures', async () => {
    const repository = createRepository([createBlock(6, 'one')]);
    const client = createClient();
    client.generate.mockRejectedValue(new RequestError('内容审核拒绝', { statusCode: 400 }));
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished, {}, { retryCount: 3 });

    queue.enqueue(6, 'one');
    const summary = await waitForSummary(onQueueFinished);

    expect(client.generate).toHaveBeenCalledTimes(1);
    expect(summary.retriedCount).toBe(0);
    expect(repository.find(6, 'one')?.error).toMatchObject({ code: 'INVALID_REQUEST', retryable: false });
  });

  test('reuses the generated image when a retry only needs to upload again', async () => {
    const repository = createRepository([createBlock(7, 'one')]);
    const client = createClient();
    vi.mocked(uploadGeneratedImage)
      .mockRejectedValueOnce(new RequestError('上传服务不可用', { statusCode: 503 }))
      .mockResolvedValueOnce('/uploads/retried.png');
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished, {}, { retryCount: 1 });

    queue.enqueue(7, 'one');
    const summary = await waitForSummary(onQueueFinished);

    expect(client.generate).toHaveBeenCalledTimes(1);
    expect(uploadGeneratedImage).toHaveBeenCalledTimes(2);
    expect(summary.succeededCount).toBe(1);
    expect(repository.find(7, 'one')?.outputs[0]?.url).toBe('/uploads/retried.png');
  });

  test('commits the output before registering it and retries only the registration step', async () => {
    const repository = createRepository([createBlock(13, 'one')]);
    const client = createClient();
    vi.mocked(registerGeneratedChatBackground)
      .mockImplementationOnce(async imagePath => {
        expect(repository.find(13, 'one')?.outputs.map(output => output.url)).toEqual([imagePath]);
        throw new RequestError('背景登记暂时失败', { code: 'ASSOCIATION_FAILED' });
      })
      .mockImplementationOnce(async imagePath => {
        expect(repository.find(13, 'one')?.outputs.map(output => output.url)).toEqual([imagePath]);
      });
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished, {}, { retryCount: 1 });

    queue.enqueue(13, 'one');
    const summary = await waitForSummary(onQueueFinished);

    expect(client.generate).toHaveBeenCalledTimes(1);
    expect(uploadGeneratedImage).toHaveBeenCalledTimes(1);
    expect(registerGeneratedChatBackground).toHaveBeenCalledTimes(2);
    expect(repository.find(13, 'one')?.outputs).toHaveLength(1);
    expect(summary).toMatchObject({ succeededCount: 1, failedCount: 0, retriedCount: 1 });
  });

  test('retries only registration after an association failure exhausted its budget', async () => {
    const repository = createRepository([createBlock(14, 'one')]);
    const client = createClient();
    vi.mocked(registerGeneratedChatBackground).mockRejectedValueOnce(
      new RequestError('背景登记暂时失败', { code: 'ASSOCIATION_FAILED' }),
    );
    const firstFinished = vi.fn();
    const queue = createQueue(repository, client, firstFinished, {}, { retryCount: 0 });

    queue.enqueue(14, 'one');
    const firstSummary = await waitForSummary(firstFinished);
    expect(firstSummary.failedCount).toBe(1);
    expect(repository.find(14, 'one')).toMatchObject({
      status: 'failed',
      error: { stage: 'associate' },
      outputs: [{ url: '/uploads/one.png' }],
    });

    const secondFinished = vi.fn();
    const resumedQueue = createQueue(repository, client, secondFinished, {}, { retryCount: 0 });
    resumedQueue.enqueue(14, 'one');
    const secondSummary = await waitForSummary(secondFinished);

    expect(secondSummary.succeededCount).toBe(1);
    expect(client.generate).toHaveBeenCalledTimes(1);
    expect(uploadGeneratedImage).toHaveBeenCalledTimes(1);
    expect(registerGeneratedChatBackground).toHaveBeenCalledTimes(2);
    expect(repository.find(14, 'one')).toMatchObject({ status: 'ready', error: undefined });
    expect(repository.find(14, 'one')?.outputs).toHaveLength(1);
  });

  test('fails immediately without retrying when the backend token is not configured', async () => {
    const repository = createRepository([createBlock(8, 'one')]);
    const client = createClient(Promise.resolve({ configured: false, models: [] }));
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished, {}, { retryCount: 3 });

    queue.enqueue(8, 'one');
    const summary = await waitForSummary(onQueueFinished);

    expect(client.capabilities).toHaveBeenCalledTimes(1);
    expect(client.generate).not.toHaveBeenCalled();
    expect(summary.failedCount).toBe(1);
    expect(repository.find(8, 'one')?.error).toMatchObject({ code: 'TOKEN_NOT_CONFIGURED', retryable: false });
  });
});

describe('GenerationQueue controls', () => {
  test('pause lets the running task finish and keeps the rest queued', async () => {
    const pending = deferred<CapabilitiesResponse>();
    const client = createClient(pending.promise);
    const repository = createRepository([createBlock(9, 'one'), createBlock(9, 'two')]);
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished);

    queue.enqueue(9, 'one');
    queue.enqueue(9, 'two');
    queue.pause();
    expect(queue.snapshot().mode).toBe('paused');

    pending.resolve(CAPABILITIES);
    await vi.waitFor(() => expect(repository.find(9, 'one')?.status).toBe('ready'));

    expect(repository.find(9, 'two')?.status).toBe('queued');
    expect(onQueueFinished).not.toHaveBeenCalled();
    expect(queue.snapshot()).toMatchObject({ mode: 'paused', active: undefined });
    expect(queue.snapshot().pending).toHaveLength(1);

    queue.resume();
    const summary = await waitForSummary(onQueueFinished);
    expect(summary.succeededCount).toBe(2);
    expect(repository.find(9, 'two')?.status).toBe('ready');
  });

  test('cancelAll clears pending tasks and aborts the running one', async () => {
    const pending = deferred<CapabilitiesResponse>();
    const client = createClient(pending.promise);
    const repository = createRepository([createBlock(10, 'one'), createBlock(10, 'two'), createBlock(10, 'three')]);
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished);

    queue.enqueue(10, 'one');
    queue.enqueue(10, 'two');
    queue.enqueue(10, 'three');
    expect(queue.isBusy(10, 'two')).toBe(true);

    expect(queue.cancelAll()).toBe(2);
    pending.resolve(CAPABILITIES);
    const summary = await waitForSummary(onQueueFinished);

    expect(summary).toMatchObject({ succeededCount: 0, failedCount: 0, cancelledCount: 3 });
    expect(repository.find(10, 'one')?.status).toBe('draft');
    expect(repository.find(10, 'two')?.status).toBe('draft');
    expect(queue.isBusy(10, 'three')).toBe(false);
    expect(queue.snapshot().mode).toBe('idle');
  });

  test('fails the rest of the queue immediately when the backend rejects credentials', async () => {
    const repository = createRepository([createBlock(12, 'one'), createBlock(12, 'two'), createBlock(12, 'three')]);
    const client = createClient();
    client.generate.mockRejectedValue(new RequestError('凭证已失效', { statusCode: 401 }));
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished, {}, { retryCount: 3 });

    queue.enqueue(12, 'one');
    queue.enqueue(12, 'two');
    queue.enqueue(12, 'three');
    const summary = await waitForSummary(onQueueFinished);

    // 后端拒绝凭证时继续请求只会重复失败：只实际调用一次，剩下两个直接标失败。
    expect(client.generate).toHaveBeenCalledTimes(1);
    expect(summary).toMatchObject({ succeededCount: 0, failedCount: 3, retriedCount: 0 });
    ['one', 'two', 'three'].forEach(blockId => {
      expect(repository.find(12, blockId)?.status).toBe('failed');
      expect(repository.find(12, blockId)?.error).toMatchObject({ code: 'AUTH', retryable: false });
    });
  });

  test('rejects duplicate, unknown and destroyed enqueues', async () => {
    const client = createClient();
    const repository = createRepository([createBlock(11, 'one')]);
    const onQueueFinished = vi.fn();
    const queue = createQueue(repository, client, onQueueFinished);

    expect(queue.enqueue(11, 'missing')).toEqual({ ok: false, reason: 'missing' });
    expect(queue.enqueue(11, 'one')).toEqual({ ok: true });
    expect(queue.enqueue(11, 'one')).toEqual({ ok: false, reason: 'duplicate' });

    await waitForSummary(onQueueFinished);
    queue.destroy();
    expect(queue.enqueue(11, 'one')).toEqual({ ok: false, reason: 'destroyed' });
  });
});
