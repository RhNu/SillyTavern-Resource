import type { FailureStage } from './failure';

export type TaskAbortKind = 'timeout' | 'cancelled' | 'cancelled-all' | 'destroyed';

export type TaskAbortReason = {
  kind: TaskAbortKind;
  stage?: FailureStage;
};

const ABORT_KINDS = new Set<TaskAbortKind>(['timeout', 'cancelled', 'cancelled-all', 'destroyed']);

/**
 * fetch 与 sleep 在被 abort 时会抛出 abort reason 本身，
 * 但宿主实现可能只抛出 AbortError，因此取消判定必须能同时处理两者。
 */
export function isTaskAbortReason(value: unknown): value is TaskAbortReason {
  if (!value || typeof value !== 'object') return false;
  const kind = (value as { kind?: unknown }).kind;
  return typeof kind === 'string' && ABORT_KINDS.has(kind as TaskAbortKind);
}

export function readAbortReason(signal: AbortSignal): TaskAbortReason | undefined {
  return isTaskAbortReason(signal.reason) ? signal.reason : undefined;
}

export type StageSignal = {
  signal: AbortSignal;
  /** 阶段自身的超时（区别于任务级取消）。 */
  didTimeout: () => boolean;
  dispose: () => void;
};

/** 把任务级取消信号与阶段级超时合并成一个信号，供单次请求使用。 */
export function withStageTimeout(parent: AbortSignal, timeoutMs: number, stage: FailureStage): StageSignal {
  const controller = new AbortController();
  let timedOut = false;
  const forward = () => controller.abort(parent.reason);

  if (parent.aborted) forward();
  else parent.addEventListener('abort', forward, { once: true });

  const timer =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          controller.abort({ kind: 'timeout', stage } satisfies TaskAbortReason);
        }, timeoutMs)
      : undefined;

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    dispose: () => {
      if (timer !== undefined) clearTimeout(timer);
      parent.removeEventListener('abort', forward);
    },
  };
}

/** 可被取消、暂停、销毁立即打断的等待。 */
export function sleepWithSignal(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(readAbortReason(signal) ?? { kind: 'cancelled' });
  if (ms <= 0) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      cleanup();
      reject(readAbortReason(signal) ?? { kind: 'cancelled' });
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });

    function cleanup() {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
    }
  });
}
