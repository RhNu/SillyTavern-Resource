import { SCRIPT_DISPLAY_NAME } from '@/ImageGenerationHelperV2/app/ids';
import { ActionToastSession } from '@/ImageGenerationHelperV2/shared/action-toast';
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showWarningToast,
} from '@/ImageGenerationHelperV2/shared/toast';
import {
  getTaskStatusLabel,
  pickFocusGroup,
  sumTaskGroupCounts,
} from '@/ImageGenerationHelperV2/features/tasking/task-progress';
import type { TaskReporter, TaskResultToast } from '@/ImageGenerationHelperV2/features/tasking/task-events';

export type TaskGroupKind = 'prompt-auto' | 'prompt-manual' | 'image-auto' | 'image-manual';
export type TaskGroupStatus = 'queued' | 'running' | 'cancelling' | 'succeeded' | 'failed' | 'cancelled' | 'partial';

export type TaskGroupCounts = {
  queued: number;
  running: number;
  succeeded: number;
  failed: number;
  cancelled: number;
};

export type TaskGroupFocus = {
  messageId: number;
  blockId?: string;
  blockDisplayIndex?: number;
};

export type TaskGroupCancelAction = {
  label: string;
  run: () => void;
};

export type TaskGroup = {
  id: string;
  kind: TaskGroupKind;
  status: TaskGroupStatus;
  title: string;
  detail: string;
  counts: TaskGroupCounts;
  focus?: TaskGroupFocus;
  cancelAction?: TaskGroupCancelAction;
  updatedAt: number;
};

export type TaskProjectionSnapshot = {
  groups: TaskGroup[];
};

export type TaskProjectionEvent =
  | {
      type: 'result';
      groupId: string;
      resultToast: TaskResultToast;
    }
  | undefined;

export type TaskProjectionListener = (snapshot: TaskProjectionSnapshot, event?: TaskProjectionEvent) => void;

export type TaskLifecycleInput = {
  id: string;
  kind: TaskGroupKind;
  status?: TaskGroupStatus;
  title?: string;
  detail?: string;
  counts?: Partial<TaskGroupCounts>;
  focus?: TaskGroupFocus;
  cancelAction?: TaskGroupCancelAction;
};

export type TaskProjection = ReturnType<typeof createTaskProjection>;

function createDefaultCounts(): TaskGroupCounts {
  return {
    queued: 0,
    running: 0,
    succeeded: 0,
    failed: 0,
    cancelled: 0,
  };
}

function normalizeCounts(counts?: Partial<TaskGroupCounts>, base?: TaskGroupCounts): TaskGroupCounts {
  const source = base ?? createDefaultCounts();
  return {
    queued: counts?.queued ?? source.queued,
    running: counts?.running ?? source.running,
    succeeded: counts?.succeeded ?? source.succeeded,
    failed: counts?.failed ?? source.failed,
    cancelled: counts?.cancelled ?? source.cancelled,
  };
}

function cloneGroup(group: TaskGroup): TaskGroup {
  return {
    ...group,
    counts: { ...group.counts },
    focus: group.focus ? { ...group.focus } : undefined,
    cancelAction: group.cancelAction ? { ...group.cancelAction } : undefined,
  };
}

function buildCountsLine(summary: TaskGroupCounts) {
  const parts = [`排队 ${summary.queued}`, `进行中 ${summary.running}`];
  if (summary.succeeded > 0) {
    parts.push(`完成 ${summary.succeeded}`);
  }
  if (summary.failed > 0) {
    parts.push(`失败 ${summary.failed}`);
  }
  if (summary.cancelled > 0) {
    parts.push(`已取消 ${summary.cancelled}`);
  }
  return parts.join(' / ');
}

function buildProgressMessage(snapshot: TaskProjectionSnapshot, focusGroup: TaskGroup) {
  const statusLabel = getTaskStatusLabel(focusGroup.status);
  const lines = [`<strong>${focusGroup.title}</strong>${statusLabel ? ` · ${statusLabel}` : ''}`];
  if (focusGroup.detail) {
    lines.push(focusGroup.detail);
  }
  if (snapshot.groups.length > 1) {
    lines.push(`并行任务 ${snapshot.groups.length} 组`);
  }
  lines.push(buildCountsLine(sumTaskGroupCounts(snapshot.groups)));
  return lines.join('<br>');
}

function showResultToast(resultToast: TaskResultToast) {
  switch (resultToast.level) {
    case 'success':
      showSuccessToast(resultToast.message, resultToast.title);
      return;
    case 'warning':
      showWarningToast(resultToast.message, resultToast.title);
      return;
    case 'error':
      showErrorToast(resultToast.message, resultToast.title);
      return;
    default:
      showInfoToast(resultToast.message, resultToast.title);
  }
}

export function createTaskProjection() {
  const groups = new Map<string, TaskGroup>();
  const listeners = new Set<TaskProjectionListener>();
  let sequence = 0;

  const getSnapshot = (): TaskProjectionSnapshot => ({
    groups: [...groups.values()].sort((left, right) => right.updatedAt - left.updatedAt).map(cloneGroup),
  });

  const emit = (event?: TaskProjectionEvent) => {
    const snapshot = getSnapshot();
    listeners.forEach(listener => {
      listener(snapshot, event);
    });
  };

  const upsert = (input: TaskLifecycleInput) => {
    const existing = groups.get(input.id);
    const next: TaskGroup = {
      id: input.id,
      kind: input.kind ?? existing?.kind ?? 'image-auto',
      status: input.status ?? existing?.status ?? 'queued',
      title: input.title ?? existing?.title ?? '',
      detail: input.detail ?? existing?.detail ?? '',
      counts: normalizeCounts(input.counts, existing?.counts),
      focus: input.focus ?? existing?.focus,
      cancelAction: input.cancelAction ?? existing?.cancelAction,
      updatedAt: ++sequence,
    };
    groups.set(next.id, next);
    emit();
    return cloneGroup(next);
  };

  const finish = (id: string, resultToast?: TaskResultToast) => {
    const existing = groups.get(id);
    if (existing) {
      groups.delete(id);
    }
    emit(
      resultToast
        ? {
            type: 'result',
            groupId: id,
            resultToast,
          }
        : undefined,
    );
    return existing ? cloneGroup(existing) : undefined;
  };

  const remove = (id: string) => {
    const existing = groups.get(id);
    if (!existing) {
      return false;
    }

    groups.delete(id);
    emit();
    return true;
  };

  const subscribe = (listener: TaskProjectionListener) => {
    listeners.add(listener);
    listener(getSnapshot());
    return () => {
      listeners.delete(listener);
    };
  };

  const reporter: TaskReporter = {
    started: input => upsert(input),
    updated: input => upsert(input),
    finished: (id, resultToast) => finish(id, resultToast),
    removed: id => remove(id),
  };

  return {
    reporter,
    subscribe,
    getSnapshot,
    upsertGroup: upsert,
    finishGroup: finish,
    removeGroup: remove,
    dispose() {
      groups.clear();
      emit();
      listeners.clear();
    },
  };
}

export function attachTaskToastProjection(taskProjection: TaskProjection) {
  const progressSession = new ActionToastSession(SCRIPT_DISPLAY_NAME);
  const seenResultKeys = new Set<string>();
  const unsubscribe = taskProjection.subscribe((snapshot, event) => {
    if (event?.type === 'result' && !seenResultKeys.has(event.resultToast.dedupeKey)) {
      seenResultKeys.add(event.resultToast.dedupeKey);
      showResultToast(event.resultToast);
    }

    const focusGroup = pickFocusGroup(snapshot.groups);
    if (!focusGroup) {
      progressSession.clear();
      return;
    }

    progressSession.show({
      ownerId: focusGroup.id,
      message: buildProgressMessage(snapshot, focusGroup),
      action: focusGroup.cancelAction
        ? {
            label: focusGroup.cancelAction.label,
            disabled: focusGroup.status === 'cancelling',
            onClick: focusGroup.cancelAction.run,
          }
        : undefined,
    });
  });

  return {
    destroy: () => {
      unsubscribe();
      progressSession.dispose();
      seenResultKeys.clear();
    },
  };
}
