import type { ImageBlock } from '../domain/block';
import type { MessageBlockRepository } from '../message-blocks/repository';
import type { NovelAiClient } from '../platform/imggen-novelai/client';
import { uploadGeneratedImage } from '../platform/tavern/image-upload';
import type { SettingsStore } from '../settings/store';
import { isTaskAbortReason, readAbortReason, sleepWithSignal, type TaskAbortReason } from './abort';
import { classifyFailure, GenerationFailureError, type FailureStage, type GenerationFailure } from './failure';
import { jitteredInterval, resolveRetryPolicy, type RetryPolicy } from './retry-policy';
import { runGenerationTask } from './task-runner';

export const BLOCKS_CHANGED_EVENT = 'novelai_image_helper_blocks_changed';
const TITLE = 'NovelAI 图片助手';

export type GenerationQueueCompletionSummary = {
  requestId: string;
  succeededCount: number;
  failedCount: number;
  cancelledCount: number;
  retriedCount: number;
  failureMessages: string[];
};

type MutableQueueCompletionSummary = Omit<GenerationQueueCompletionSummary, 'failureMessages'> & {
  failureMessages: string[];
};

export type QueueEnqueueResult = { ok: true } | { ok: false; reason: 'destroyed' | 'duplicate' | 'missing' };

export type QueueTaskView = {
  messageId: number;
  blockId: string;
  summary: string;
  stage?: FailureStage;
  attempt: number;
  maxAttempts: number;
};

export type QueueSnapshot = {
  mode: 'idle' | 'running' | 'paused';
  active?: QueueTaskView;
  pending: QueueTaskView[];
  /** 节流闸门的下一个可派发时刻；大于当前时间表示队列正在等待。 */
  nextDispatchAt: number;
  lastSummary?: GenerationQueueCompletionSummary;
};

type TaskRef = { messageId: number; blockId: string };
type QueueTask = TaskRef & { summary: string; stage?: FailureStage; attempt: number };
type QueueTaskOutcome = { status: 'succeeded' } | { status: 'failed'; message: string } | { status: 'cancelled' };

export type GenerationQueueOptions = {
  onQueueFinished?: (summary: GenerationQueueCompletionSummary) => void;
  /** 时间相关依赖，供测试注入。 */
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
  random?: () => number;
  now?: () => number;
};

function taskKey(task: TaskRef): string {
  return `${task.messageId}:${task.blockId}`;
}

/**
 * 串行工作流队列。
 *
 * 职责边界：
 * - 队列持有调度状态（pending / active / 节流闸门 / 批次摘要）与全部块状态写入；
 * - 阶段流水线与最终结果落盘交给 task-runner.ts；
 * - 运行态只在内存中，刷新后由 service.recoverInterruptedBlocks() 收尾。
 *
 * 节流：NovelAI 生图有限流，任何两次生成请求之间都要跨过 `nextDispatchAt`
 * （由生成阶段的结束时间推进），因此任务不会「结束后直接跑下一个」，自动重试也复用同一窗口。
 */
export class GenerationQueue {
  private readonly pending: QueueTask[] = [];
  private readonly known = new Set<string>();
  private readonly listeners = new Set<(snapshot: QueueSnapshot) => void>();
  private active?: { task: QueueTask; controller: AbortController };
  private completion?: MutableQueueCompletionSummary;
  private lastSummary?: GenerationQueueCompletionSummary;
  private mode: 'running' | 'paused' = 'running';
  private nextDispatchAt = 0;
  private draining = false;
  private destroyed = false;
  private policy: RetryPolicy;

  constructor(
    private readonly repository: MessageBlockRepository,
    private readonly settings: SettingsStore,
    private readonly client: NovelAiClient,
    private readonly options: GenerationQueueOptions = {},
  ) {
    this.policy = resolveRetryPolicy(this.settings.get().generation);
  }

  private get sleep(): (ms: number, signal: AbortSignal) => Promise<void> {
    return this.options.sleep ?? sleepWithSignal;
  }

  private get now(): () => number {
    return this.options.now ?? Date.now;
  }

  private get random(): () => number {
    return this.options.random ?? Math.random;
  }

  enqueue(messageId: number, blockId: string): QueueEnqueueResult {
    if (this.destroyed) return { ok: false, reason: 'destroyed' };

    const task: TaskRef = { messageId, blockId };
    const key = taskKey(task);
    if (this.known.has(key)) return { ok: false, reason: 'duplicate' };

    const block = this.repository.find(messageId, blockId);
    if (!block) return { ok: false, reason: 'missing' };

    this.policy = resolveRetryPolicy(this.settings.get().generation);
    this.ensureCompletion();
    this.known.add(key);
    this.pending.push({ ...task, summary: block.summary || block.prompt.main.positive, attempt: 0 });
    this.setStatus(task, 'queued');
    this.notify();
    void this.drain();
    return { ok: true };
  }

  /** 取消单个任务：排队中的直接移除，执行中的立即中止。 */
  cancel(messageId: number, blockId: string): boolean {
    const task: TaskRef = { messageId, blockId };
    const key = taskKey(task);
    const index = this.pending.findIndex(entry => taskKey(entry) === key);
    if (index >= 0) {
      const [cancelled] = this.pending.splice(index, 1);
      this.known.delete(key);
      this.restoreIdleStatus(cancelled);
      this.recordOutcome(cancelled, { status: 'cancelled' });
      this.notify();
      this.completeIfIdle();
      return true;
    }

    if (this.active && taskKey(this.active.task) === key) {
      this.active.controller.abort({ kind: 'cancelled' } satisfies TaskAbortReason);
      return true;
    }
    return false;
  }

  /** 取消全部：清空等待队列并中止当前任务。 */
  cancelAll(): number {
    const tasks = this.pending.splice(0);
    tasks.forEach(task => {
      this.known.delete(taskKey(task));
      this.restoreIdleStatus(task);
      this.recordOutcome(task, { status: 'cancelled' });
    });
    if (this.active) this.active.controller.abort({ kind: 'cancelled-all' } satisfies TaskAbortReason);
    this.notify();
    this.completeIfIdle();
    return tasks.length;
  }

  /**
   * 暂停只阻止取出下一个任务：正在执行的任务会正常跑完，
   * 因此不会浪费已经消耗了 NovelAI 配额的生成。
   */
  pause(): void {
    if (this.destroyed || this.mode === 'paused') return;
    this.mode = 'paused';
    this.notify();
  }

  resume(): void {
    if (this.destroyed || this.mode === 'running') return;
    this.mode = 'running';
    this.notify();
    void this.drain();
  }

  isActive(messageId: number, blockId: string): boolean {
    return Boolean(this.active && taskKey(this.active.task) === taskKey({ messageId, blockId }));
  }

  isBusy(messageId: number, blockId: string): boolean {
    const key = taskKey({ messageId, blockId });
    return this.isActive(messageId, blockId) || this.pending.some(task => taskKey(task) === key);
  }

  snapshot(): QueueSnapshot {
    const maxAttempts = this.policy.maxAttempts;
    const busy = Boolean(this.active) || this.pending.length > 0;
    return {
      mode: !this.destroyed && busy ? this.mode : 'idle',
      active: this.active ? this.toView(this.active.task, maxAttempts) : undefined,
      pending: this.pending.map(task => this.toView(task, maxAttempts)),
      nextDispatchAt: this.nextDispatchAt,
      lastSummary: this.lastSummary,
    };
  }

  subscribe(listener: (snapshot: QueueSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.pending.splice(0).forEach(task => this.restoreIdleStatus(task));
    this.completion = undefined;
    this.active?.controller.abort({ kind: 'destroyed' } satisfies TaskAbortReason);
    this.known.clear();
    this.listeners.clear();
  }

  private toView(task: QueueTask, maxAttempts: number): QueueTaskView {
    return {
      messageId: task.messageId,
      blockId: task.blockId,
      summary: task.summary,
      stage: task.stage,
      attempt: task.attempt,
      maxAttempts,
    };
  }

  private ensureCompletion(): MutableQueueCompletionSummary {
    if (this.completion) return this.completion;
    this.lastSummary = undefined;
    return (this.completion = {
      requestId: crypto.randomUUID(),
      succeededCount: 0,
      failedCount: 0,
      cancelledCount: 0,
      retriedCount: 0,
      failureMessages: [],
    });
  }

  private recordOutcome(task: TaskRef, outcome: QueueTaskOutcome): void {
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
    const summary: GenerationQueueCompletionSummary = {
      ...completion,
      failureMessages: [...completion.failureMessages],
    };
    this.lastSummary = summary;
    this.notify();
    try {
      this.options.onQueueFinished?.(summary);
    } catch (error) {
      console.error('[NovelAI Image Helper] 队列完成回调失败', error);
    }
  }

  private notify(): void {
    if (this.listeners.size === 0) return;
    const snapshot = this.snapshot();
    this.listeners.forEach(listener => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error('[NovelAI Image Helper] 队列状态监听失败', error);
      }
    });
  }

  private setStatus(task: TaskRef, status: ImageBlock['status'], error?: ImageBlock['error']): ImageBlock | undefined {
    const result = this.repository.update(task.messageId, task.blockId, block => ({
      ...block,
      revision: block.revision + 1,
      status,
      error,
    }));
    void eventEmit(BLOCKS_CHANGED_EVENT, task.messageId);
    return result;
  }

  /** 取消 / 销毁后回到「可再次生成」：已出图的回到 ready，否则回到 draft。 */
  private restoreIdleStatus(task: TaskRef): void {
    const block = this.repository.find(task.messageId, task.blockId);
    if (!block) return;
    this.setStatus(task, block.outputs.length > 0 ? 'ready' : 'draft');
  }

  private async drain(): Promise<void> {
    if (this.draining || this.destroyed) return;
    this.draining = true;
    try {
      while (!this.destroyed && this.mode === 'running') {
        const task = this.pending.shift();
        if (!task) break;
        this.notify();
        await this.runTask(task);
      }
    } finally {
      this.draining = false;
      this.notify();
      this.completeIfIdle();
    }
  }

  private async runTask(task: QueueTask): Promise<void> {
    const controller = new AbortController();
    this.active = { task, controller };
    const generation = this.settings.get().generation;
    this.policy = resolveRetryPolicy(generation);

    let outcome: QueueTaskOutcome | undefined;
    try {
      const result = await runGenerationTask({
        messageId: task.messageId,
        blockId: task.blockId,
        signal: controller.signal,
        repository: this.repository,
        client: this.client,
        upload: uploadGeneratedImage,
        generation,
        policy: this.policy,
        beginAttempt: (stage, attempt) => this.beginAttempt(task, stage, attempt, controller.signal),
        finishAttempt: stage => {
          // 节流窗口只由真正打到 NovelAI 的生成阶段推进：
          // 上一次生成结束到下一次生成开始之间必须跨过整个窗口。
          if (stage !== 'generate') return;
          this.nextDispatchAt = this.now() + jitteredInterval(this.policy.intervalMs, this.random);
        },
        onRetry: info => {
          this.ensureCompletion().retriedCount += 1;
          console.info(
            `[NovelAI Image Helper] ${info.failure.code} 第 ${info.attempt}/${info.maxAttempts} 次尝试失败，` +
              `等待节流后重试：${info.failure.message}`,
          );
          this.notify();
        },
      });

      if (result.status === 'succeeded') {
        outcome = { status: 'succeeded' };
        toastr.success('图片已生成', TITLE);
      } else {
        outcome = { status: 'failed', message: result.failure.message };
        this.setStatus(task, 'failed', {
          code: result.failure.code,
          message: result.failure.message,
          retryable: result.failure.retryable,
          stage: result.failure.stage,
          attempts: result.attempts,
        });
        toastr.error(result.failure.message, TITLE);
        this.failPendingForBackendFailure(result.failure);
      }
    } catch (error) {
      outcome = this.handleTaskError(task, error);
    } finally {
      this.known.delete(taskKey(task));
      this.active = undefined;
      if (outcome) this.recordOutcome(task, outcome);
      void eventEmit(BLOCKS_CHANGED_EVENT, task.messageId);
      this.notify();
    }
  }

  /**
   * 阶段失败已经在流水线内转成 failed，这里只处理中止与逃逸异常。
   * 销毁与取消都不计入失败，而是回到可再次生成的状态。
   */
  private handleTaskError(task: QueueTask, error: unknown): QueueTaskOutcome | undefined {
    const active = this.active;
    const reason =
      (active && readAbortReason(active.controller.signal)) ?? (isTaskAbortReason(error) ? error : undefined);

    if (reason?.kind === 'destroyed') {
      this.restoreIdleStatus(task);
      return undefined;
    }
    if (reason?.kind === 'cancelled' || reason?.kind === 'cancelled-all') {
      this.restoreIdleStatus(task);
      return { status: 'cancelled' };
    }

    const failure = classifyFailure(error, task.stage ?? 'generate');
    this.setStatus(task, 'failed', {
      code: failure.code,
      message: failure.message,
      retryable: failure.retryable,
      stage: failure.stage,
      attempts: task.attempt > 0 ? task.attempt : undefined,
    });
    toastr.error(failure.message, TITLE);
    return { status: 'failed', message: failure.message };
  }

  /**
   * 后端未配置或凭证失效时，把剩下等待的任务一并标失败：
   * 继续跑完整条队列只会产生一串一模一样的失败提示。
   */
  private failPendingForBackendFailure(failure: GenerationFailure): void {
    if (failure.code !== 'TOKEN_NOT_CONFIGURED' && failure.code !== 'AUTH') return;
    const tasks = this.pending.splice(0);
    if (tasks.length === 0) return;

    tasks.forEach(task => {
      this.known.delete(taskKey(task));
      this.setStatus(task, 'failed', {
        code: failure.code,
        message: failure.message,
        retryable: false,
        stage: failure.stage,
      });
      this.recordOutcome(task, { status: 'failed', message: failure.message });
    });
    this.notify();
  }

  /**
   * 一次阶段尝试开始前的统一入口：先跨过节流闸门，再写入块状态。
   *
   * 只有真正请求 NovelAI 的生成阶段需要节流：上传与写回走的是酒馆本地接口。
   * 闸门必须先于状态切换，否则等待期间卡片会错误地显示「生成中」。
   */
  private async beginAttempt(
    task: QueueTask,
    stage: FailureStage,
    attempt: number,
    signal: AbortSignal,
  ): Promise<void> {
    task.stage = stage;
    task.attempt = attempt;
    this.notify();

    if (stage === 'generate') {
      const waitMs = Math.max(0, this.nextDispatchAt - this.now());
      if (waitMs > 0) await this.sleep(waitMs, signal);
    }

    if (stage !== 'commit') {
      const written = this.setStatus(task, stage === 'upload' ? 'uploading' : 'generating');
      if (!written) throw new GenerationFailureError('BLOCK_MISSING', '图片块已被删除，已跳过生成');
    }
    this.notify();
  }
}
