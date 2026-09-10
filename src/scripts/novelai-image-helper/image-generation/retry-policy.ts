import type { Settings } from '../settings/schema';
import type { GenerationFailure } from './failure';

/**
 * 节流窗口的抖动比例。基准 4000ms 时实际落在 3000–5000ms，
 * 避免固定节奏持续命中 NovelAI 的限流。
 */
export const INTERVAL_JITTER_RATIO = 0.25;

export type RetryPolicy = {
  /** 单个阶段的尝试上限（首次尝试 + 自动重试次数）。 */
  maxAttempts: number;
  /** 任务之间与重试之前的节流基准窗口。 */
  intervalMs: number;
};

export function resolveRetryPolicy(generation: Settings['generation']): RetryPolicy {
  return {
    maxAttempts: Math.max(1, Math.round(generation.retryCount) + 1),
    intervalMs: Math.max(0, generation.requestIntervalMs),
  };
}

/** 以基准窗口为中心抖动，得到本次实际等待时间。 */
export function jitteredInterval(intervalMs: number, random: () => number = Math.random): number {
  if (intervalMs <= 0) return 0;
  const ratio = 1 - INTERVAL_JITTER_RATIO + random() * INTERVAL_JITTER_RATIO * 2;
  return Math.round(intervalMs * ratio);
}

export function shouldRetry(failure: GenerationFailure, attempt: number, policy: RetryPolicy): boolean {
  return failure.retryable && attempt < policy.maxAttempts;
}
