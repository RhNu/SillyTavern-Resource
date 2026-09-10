import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS, type Settings } from '../settings/schema';
import type { GenerationFailure } from './failure';
import { INTERVAL_JITTER_RATIO, jitteredInterval, resolveRetryPolicy, shouldRetry } from './retry-policy';

function generation(overrides: Partial<Settings['generation']> = {}): Settings['generation'] {
  return { ...structuredClone(DEFAULT_SETTINGS.generation), ...overrides };
}

function failure(retryable: boolean): GenerationFailure {
  return { code: 'UPSTREAM', message: '上游异常', retryable, stage: 'generate' };
}

describe('resolveRetryPolicy', () => {
  test('turns retryCount into an attempt budget and keeps the throttle window', () => {
    expect(resolveRetryPolicy(generation({ retryCount: 0, requestIntervalMs: 0 }))).toEqual({
      maxAttempts: 1,
      intervalMs: 0,
    });
    expect(resolveRetryPolicy(generation({ retryCount: 2, requestIntervalMs: 4_000 }))).toEqual({
      maxAttempts: 3,
      intervalMs: 4_000,
    });
  });
});

describe('jitteredInterval', () => {
  test('spreads the wait around the base interval', () => {
    expect(jitteredInterval(4_000, () => 0)).toBe(3_000);
    expect(jitteredInterval(4_000, () => 0.5)).toBe(4_000);
    expect(jitteredInterval(4_000, () => 1)).toBe(5_000);
  });

  test('keeps every sample inside the jitter ratio', () => {
    const samples = Array.from({ length: 50 }, () => jitteredInterval(4_000));
    samples.forEach(sample => {
      expect(sample).toBeGreaterThanOrEqual(4_000 * (1 - INTERVAL_JITTER_RATIO));
      expect(sample).toBeLessThanOrEqual(4_000 * (1 + INTERVAL_JITTER_RATIO));
    });
  });

  test('does not wait when throttling is disabled', () => {
    expect(jitteredInterval(0, () => 0.5)).toBe(0);
  });
});

describe('shouldRetry', () => {
  test('only retries retryable failures and stops at the budget', () => {
    const policy = resolveRetryPolicy(generation({ retryCount: 1 }));

    expect(shouldRetry(failure(true), 1, policy)).toBe(true);
    expect(shouldRetry(failure(true), 2, policy)).toBe(false);
    expect(shouldRetry(failure(false), 1, policy)).toBe(false);
  });
});
