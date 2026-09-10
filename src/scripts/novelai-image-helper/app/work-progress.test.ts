import { describe, expect, test, vi } from 'vitest';
import { pickFocusedWork, queueSnapshotToProgress, WorkProgressStore, workProgressPercent } from './work-progress';

describe('WorkProgressStore', () => {
  test('notifies subscribers with isolated snapshots', () => {
    const store = new WorkProgressStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.upsert({
      id: 'analysis',
      kind: 'analysis',
      status: 'running',
      title: '分析',
      detail: '请求模型',
      completed: 0,
    });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.snapshot().items).toMatchObject([{ id: 'analysis', status: 'running' }]);
    store.remove('analysis');
    expect(store.snapshot().items).toEqual([]);
  });
});

test('queue projection exposes aggregate progress and cancellation', () => {
  const cancel = vi.fn();
  const item = queueSnapshotToProgress(
    {
      mode: 'running',
      cancelling: false,
      active: { messageId: 2, blockId: 'b', summary: '雨夜', stage: 'upload', attempt: 1, maxAttempts: 3 },
      pending: [{ messageId: 2, blockId: 'c', summary: '街灯', attempt: 0, maxAttempts: 3 }],
      nextDispatchAt: 0,
      batch: { succeededCount: 2, failedCount: 0, cancelledCount: 0, retriedCount: 1 },
    },
    cancel,
  );

  expect(item).toMatchObject({ completed: 2, total: 4, detail: '雨夜 · 上传图片' });
  expect(workProgressPercent(item!)).toBe(50);
  item?.cancel?.run();
  expect(cancel).toHaveBeenCalledOnce();
});

test('analysis has display priority over image generation', () => {
  const store = new WorkProgressStore();
  store.upsert({ id: 'queue', kind: 'generation', status: 'running', title: '', detail: '', completed: 0 });
  store.upsert({ id: 'analysis', kind: 'analysis', status: 'running', title: '', detail: '', completed: 0 });
  expect(pickFocusedWork(store.snapshot().items)?.id).toBe('analysis');
});
