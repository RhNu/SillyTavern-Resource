import type {
  TaskGroup,
  TaskGroupCancelAction,
  TaskGroupCounts,
  TaskGroupFocus,
  TaskGroupKind,
  TaskGroupStatus,
} from '@/ImageGenerationHelperV2/features/tasking/task-projection';

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

export type TaskResultToast = {
  level: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  dedupeKey: string;
};

export type TaskReporter = {
  started: (input: TaskLifecycleInput) => TaskGroup;
  updated: (input: TaskLifecycleInput) => TaskGroup;
  finished: (id: string, resultToast?: TaskResultToast) => TaskGroup | undefined;
  removed: (id: string) => boolean;
};
