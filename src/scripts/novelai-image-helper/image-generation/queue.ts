import type { ImageBlock } from '../domain/block';
import { NovelAiClient } from '../platform/imggen-novelai/client';
import { uploadGeneratedImage } from '../platform/tavern/image-upload';
import type { SettingsStore } from '../settings/store';
import type { MessageBlockRepository } from '../message-blocks/repository';

export const BLOCKS_CHANGED_EVENT = 'novelai_image_helper_blocks_changed';

type QueueTask = { messageId: number; blockId: string };

export type GenerationQueueCompletionSummary = {
  requestId: string;
  succeededCount: number;
  failedCount: number;
  cancelledCount: number;
  failureMessages: string[];
};

type MutableQueueCompletionSummary = Omit<GenerationQueueCompletionSummary, 'failureMessages'> & {
  failureMessages: string[];
};

type QueueTaskOutcome = { status: 'succeeded' } | { status: 'failed'; message: string } | { status: 'cancelled' };

export type GenerationQueueOptions = {
  onQueueFinished?: (summary: GenerationQueueCompletionSummary) => void;
};

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
  private completion?: MutableQueueCompletionSummary;
  private destroyed = false;

  constructor(
    private readonly repository: MessageBlockRepository,
    private readonly settings: SettingsStore,
    private readonly client: NovelAiClient,
    private readonly options: GenerationQueueOptions = {},
  ) {}

  enqueue(messageId: number, blockId: string): boolean {
    const task = { messageId, blockId };
    const key = taskKey(task);
    if (this.destroyed || this.known.has(key)) return false;
    const block = this.repository.find(messageId, blockId);
    if (!block) return false;
    this.ensureCompletion();
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
      this.recordOutcome({ messageId, blockId }, { status: 'cancelled' });
      this.completeIfIdle();
    }
    if (this.active && taskKey(this.active.task) === key) this.active.controller.abort('cancelled');
  }

  isActive(messageId: number, blockId: string): boolean {
    return Boolean(this.active && taskKey(this.active.task) === taskKey({ messageId, blockId }));
  }

  destroy(): void {
    this.destroyed = true;
    this.pending.splice(0).forEach(task => this.setStatus(task, 'draft'));
    this.completion = undefined;
    this.active?.controller.abort('destroyed');
    this.known.clear();
  }

  private ensureCompletion(): MutableQueueCompletionSummary {
    return (this.completion ??= {
      requestId: crypto.randomUUID(),
      succeededCount: 0,
      failedCount: 0,
      cancelledCount: 0,
      failureMessages: [],
    });
  }

  private recordOutcome(task: QueueTask, outcome: QueueTaskOutcome): void {
    const completion = this.completion;
    if (!completion) return;

    if (outcome.status === 'succeeded') {
      completion.succeededCount += 1;
      return;
    }

    if (outcome.status === 'cancelled') {
      completion.cancelledCount += 1;
      return;
    }

    completion.failedCount += 1;
    completion.failureMessages.push(`${task.messageId}:${task.blockId}：${outcome.message}`);
  }

  private completeIfIdle(): void {
    if (this.destroyed || this.active || this.pending.length > 0 || !this.completion) return;

    const completion = this.completion;
    this.completion = undefined;
    try {
      this.options.onQueueFinished?.({
        ...completion,
        failureMessages: [...completion.failureMessages],
      });
    } catch (error) {
      console.error('[NovelAI Image Helper] 队列完成回调失败', error);
    }
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
    if (!task) {
      this.completeIfIdle();
      return;
    }

    const controller = new AbortController();
    this.active = { task, controller };
    const key = taskKey(task);
    const settings = this.settings.get();
    const timeout = setTimeout(() => controller.abort('timeout'), settings.generation.timeoutMs);
    let outcome: QueueTaskOutcome | undefined;
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
      outcome = { status: 'succeeded' };
      toastr.success('图片已生成', 'NovelAI 图片助手');
    } catch (error) {
      const cancelled = controller.signal.aborted && controller.signal.reason !== 'timeout';
      const message = error instanceof Error ? error.message : String(error);
      this.setStatus(
        task,
        cancelled ? 'draft' : 'failed',
        cancelled
          ? undefined
          : {
              code: controller.signal.reason === 'timeout' ? 'TIMEOUT' : 'GENERATION_FAILED',
              message,
              retryable: retryable(error),
            },
      );
      outcome = cancelled ? { status: 'cancelled' } : { status: 'failed', message };
      if (!cancelled) toastr.error(message, 'NovelAI 图片助手');
    } finally {
      clearTimeout(timeout);
      this.known.delete(key);
      if (outcome) this.recordOutcome(task, outcome);
      this.active = undefined;
      void eventEmit(BLOCKS_CHANGED_EVENT, task.messageId);
      if (this.pending.length > 0) void this.drain();
      else this.completeIfIdle();
    }
  }
}
