import type { TaskGroup, TaskGroupCounts, TaskGroupStatus } from './task-center';

const TASK_FOCUS_PRIORITY: Record<TaskGroup['kind'], number> = {
  'image-manual': 4,
  'prompt-manual': 3,
  'prompt-auto': 2,
  'image-auto': 1,
};

export type TaskGroupProgress = {
  total: number;
  completed: number;
  ratio?: number;
  percent: number;
  indeterminate: boolean;
};

export function pickFocusGroup(groups: TaskGroup[]) {
  return [...groups].sort((left, right) => {
    const priorityDiff = TASK_FOCUS_PRIORITY[right.kind] - TASK_FOCUS_PRIORITY[left.kind];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return right.updatedAt - left.updatedAt;
  })[0];
}

export function sumTaskGroupCounts(groups: TaskGroup[]): TaskGroupCounts {
  return groups.reduce<TaskGroupCounts>(
    (summary, group) => ({
      queued: summary.queued + group.counts.queued,
      running: summary.running + group.counts.running,
      succeeded: summary.succeeded + group.counts.succeeded,
      failed: summary.failed + group.counts.failed,
      cancelled: summary.cancelled + group.counts.cancelled,
    }),
    {
      queued: 0,
      running: 0,
      succeeded: 0,
      failed: 0,
      cancelled: 0,
    },
  );
}

export function getTaskStatusLabel(status: TaskGroupStatus) {
  switch (status) {
    case 'queued':
      return '排队中';
    case 'running':
      return '进行中';
    case 'cancelling':
      return '正在取消';
    case 'succeeded':
      return '已完成';
    case 'failed':
      return '已失败';
    case 'cancelled':
      return '已取消';
    case 'partial':
      return '部分完成';
    default:
      return '';
  }
}

export function getTaskGroupProgress(group: TaskGroup): TaskGroupProgress {
  const total =
    group.counts.queued + group.counts.running + group.counts.succeeded + group.counts.failed + group.counts.cancelled;
  const completed = group.counts.succeeded + group.counts.failed + group.counts.cancelled;

  if (total <= 0) {
    return {
      total: 0,
      completed,
      percent: 0,
      indeterminate: true,
    };
  }

  const ratio = Math.min(1, Math.max(0, completed / total));
  return {
    total,
    completed,
    ratio,
    percent: Math.round(ratio * 100),
    indeterminate: false,
  };
}
