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

export type TaskResultToast = {
  level: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  dedupeKey: string;
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

export type TaskGroupInput = {
  id: string;
  kind: TaskGroupKind;
  status?: TaskGroupStatus;
  title?: string;
  detail?: string;
  counts?: Partial<TaskGroupCounts>;
  focus?: TaskGroupFocus;
  cancelAction?: TaskGroupCancelAction;
};

export type TaskCenterSnapshot = {
  groups: TaskGroup[];
};

export type TaskCenterEvent =
  | {
      type: 'result';
      groupId: string;
      resultToast: TaskResultToast;
    }
  | undefined;

export type TaskCenterListener = (snapshot: TaskCenterSnapshot, event?: TaskCenterEvent) => void;

export type TaskCenter = ReturnType<typeof createTaskCenter>;

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

export function createTaskCenter() {
  const groups = new Map<string, TaskGroup>();
  const listeners = new Set<TaskCenterListener>();
  let sequence = 0;

  const getSnapshot = (): TaskCenterSnapshot => ({
    groups: [...groups.values()].sort((left, right) => right.updatedAt - left.updatedAt).map(cloneGroup),
  });

  const emit = (event?: TaskCenterEvent) => {
    const snapshot = getSnapshot();
    listeners.forEach(listener => {
      listener(snapshot, event);
    });
  };

  return {
    upsertGroup(input: TaskGroupInput) {
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
    },

    finishGroup(id: string, resultToast?: TaskResultToast) {
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
    },

    removeGroup(id: string) {
      const existing = groups.get(id);
      if (!existing) {
        return false;
      }

      groups.delete(id);
      emit();
      return true;
    },

    subscribe(listener: TaskCenterListener) {
      listeners.add(listener);
      listener(getSnapshot());
      return () => {
        listeners.delete(listener);
      };
    },

    getSnapshot,

    dispose() {
      groups.clear();
      emit();
      listeners.clear();
    },
  };
}
