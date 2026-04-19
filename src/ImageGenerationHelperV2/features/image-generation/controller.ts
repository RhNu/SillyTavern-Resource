import { IMGGEN_BLOCK_STATE_UPDATED_EVENT, REGEX_NAME } from '@/ImageGenerationHelperV2/app/ids';
import { getImageGenerationStore, subscribeImageGenerationStore } from '@/ImageGenerationHelperV2/config/store';
import { logError, logWarn } from '@/ImageGenerationHelperV2/shared/log';
import { showInfoToast, showWarningToast } from '@/ImageGenerationHelperV2/shared/toast';
import type { TaskResultToast } from '@/ImageGenerationHelperV2/features/tasking/task-events';
import type {
  TaskProjection as TaskCenter,
  TaskGroupFocus,
} from '@/ImageGenerationHelperV2/features/tasking/task-projection';
import {
  createImageGenerationMessageUi,
  type RenderBlockState,
} from '@/ImageGenerationHelperV2/features/message-cards/controller';
import {
  normalizeImgGenMessageBlockState,
  setImgGenBlocksInMessageVariables,
} from '@/ImageGenerationHelperV2/features/image-generation/block-repository';
import { buildFinalImagePrompt } from '@/ImageGenerationHelperV2/features/image-generation/prompt-builder';
import {
  buildAutoGenerationQueueToastMessage,
  hasAutoGenerationQueueWork,
  type AutoGenerationQueueSnapshot,
} from '@/ImageGenerationHelperV2/features/image-generation/queue-policy';
import { buildImgGenRefFilterRegexString } from '@/ImageGenerationHelperV2/features/image-generation/ref-codec';
import { requestImageGeneration } from '@/ImageGenerationHelperV2/features/image-generation/request';
import { getResolvedImgGenMessageState } from '@/ImageGenerationHelperV2/features/image-generation/resolved-state';

type GenerationOrigin = 'manual' | 'auto';
type ImageCancelReason = 'button' | 'destroy' | 'replace';

type ImageGenerationRequestOptions = {
  requestId?: string;
  origin: GenerationOrigin;
  groupId?: string;
};

type ManualGenerationBatch = {
  groupId: string;
  requestId: string;
  totalCount: number;
  succeededCount: number;
  failedCount: number;
  cancelledCount: number;
  failureMessages: string[];
  detail: string;
  cancelled: boolean;
  cancelReason?: ImageCancelReason;
  focus?: TaskGroupFocus;
};

type AutomaticQueueSession = {
  requestId: string;
  succeededCount: number;
  failedCount: number;
  cancelledCount: number;
  failureMessages: string[];
};

type AutomaticQueueCancellationState = {
  active: boolean;
  pendingCount: number;
};

export type AutomaticQueueCompletionSummary = {
  requestId: string;
  succeededCount: number;
  failedCount: number;
  cancelledCount: number;
  failureMessages: string[];
  message: string;
};

type ImageGenerationLoggedError = Error & {
  __imggenInterrupted?: boolean;
  __imggenLogged?: boolean;
};

type ImageTaskRun = {
  origin: GenerationOrigin;
  batchId?: string;
  abortController: AbortController;
  cancelReason?: ImageCancelReason;
  cancelDelay?: () => void;
  done: Promise<void>;
  resolveDone: () => void;
};

type ImageTaskOutcome =
  | {
      status: 'success';
      urlsCount: number;
    }
  | {
      status: 'cancelled';
      message: string;
      cancelReason?: ImageCancelReason;
    }
  | {
      status: 'failed';
      message: string;
    }
  | {
      status: 'skipped';
    };

const IMAGE_AUTO_GROUP_ID = 'image-auto';
const SEQUENTIAL_QUEUE: Array<{ messageId: number; blockId: string }> = [];
const QUEUED_KEYS = new Set<string>();
const SCHEDULED_TIMERS = new Map<string, ReturnType<typeof setTimeout>>();
const ACTIVE_AUTO_TASKS = new Set<string>();
const ACTIVE_GENERATING_TASKS = new Set<string>();
const ACTIVE_TASK_RUNS = new Map<string, ImageTaskRun>();
const ACTIVE_MANUAL_BATCHES = new Map<string, ManualGenerationBatch>();
const PROMPT_FILTER_REGEX = buildImgGenRefFilterRegexString();

let sequentialProcessing = false;
let imageTaskCenter: TaskCenter | undefined;
let automaticQueueSession: AutomaticQueueSession | undefined;
let automaticQueueCancellation: AutomaticQueueCancellationState = {
  active: false,
  pendingCount: 0,
};
let suppressAutomaticQueueResult = false;
let automaticQueueDetailOverride:
  | {
      taskKey: string;
      message: string;
    }
  | undefined;
let automaticQueueFinishedNotifier: ((summary: AutomaticQueueCompletionSummary) => void) | undefined;

function getStore() {
  return getImageGenerationStore();
}

function getTaskCenter() {
  return imageTaskCenter;
}

function ensureAutomaticQueueSession() {
  if (!automaticQueueSession) {
    automaticQueueSession = {
      requestId: crypto.randomUUID(),
      succeededCount: 0,
      failedCount: 0,
      cancelledCount: 0,
      failureMessages: [],
    };
  }
  return automaticQueueSession;
}

function createLoggedImageGenerationError(
  message: string,
  options?: {
    logged?: boolean;
    interrupted?: boolean;
  },
): ImageGenerationLoggedError {
  const error = new Error(message) as ImageGenerationLoggedError;
  error.__imggenLogged = options?.logged ?? false;
  error.__imggenInterrupted = options?.interrupted ?? false;
  return error;
}

function isImageGenerationInterrupted(error: unknown): boolean {
  return (
    (error instanceof Error && Boolean((error as ImageGenerationLoggedError).__imggenInterrupted)) ||
    (error instanceof DOMException && error.name === 'AbortError')
  );
}

function createImageGenerationInterruptedError(messageId: number, blockId: string): ImageGenerationLoggedError {
  return createLoggedImageGenerationError(`${buildBlockLabel(messageId, blockId)} 的图片生成已中断`, {
    logged: true,
    interrupted: true,
  });
}

function createTaskRun(origin: GenerationOrigin, batchId?: string): ImageTaskRun {
  let resolveDone = () => {};
  const done = new Promise<void>(resolve => {
    resolveDone = resolve;
  });

  return {
    origin,
    batchId,
    abortController: new AbortController(),
    done,
    resolveDone,
  };
}

function startTaskRun(taskKey: string, origin: GenerationOrigin, batchId?: string) {
  const run = createTaskRun(origin, batchId);
  ACTIVE_TASK_RUNS.set(taskKey, run);
  ACTIVE_GENERATING_TASKS.add(taskKey);
  if (origin === 'auto') {
    ACTIVE_AUTO_TASKS.add(taskKey);
  }
  return run;
}

function finishTaskRun(taskKey: string) {
  const run = ACTIVE_TASK_RUNS.get(taskKey);
  if (!run) {
    return undefined;
  }

  ACTIVE_TASK_RUNS.delete(taskKey);
  ACTIVE_GENERATING_TASKS.delete(taskKey);
  if (run.origin === 'auto') {
    ACTIVE_AUTO_TASKS.delete(taskKey);
  }
  run.cancelDelay = undefined;
  run.resolveDone();
  return run;
}

function interruptTaskRun(taskKey: string, reason: ImageCancelReason): Promise<void> | undefined {
  const run = ACTIVE_TASK_RUNS.get(taskKey);
  if (!run) {
    return undefined;
  }

  run.cancelReason ??= reason;
  run.cancelDelay?.();
  if (!run.abortController.signal.aborted) {
    run.abortController.abort(reason);
  }
  return run.done;
}

function throwIfTaskInterrupted(taskKey: string, messageId: number, blockId: string) {
  const run = ACTIVE_TASK_RUNS.get(taskKey);
  if (run?.abortController.signal.aborted) {
    throw createImageGenerationInterruptedError(messageId, blockId);
  }
}

async function waitForTaskDelay(taskKey: string, delayMs: number, messageId: number, blockId: string) {
  if (delayMs <= 0) {
    return;
  }

  const run = ACTIVE_TASK_RUNS.get(taskKey);
  if (!run) {
    return;
  }

  throwIfTaskInterrupted(taskKey, messageId, blockId);

  await new Promise<void>((resolve, reject) => {
    let completed = false;
    const complete = () => {
      if (completed) {
        return;
      }
      completed = true;
      if (run.cancelDelay === cancelDelay) {
        run.cancelDelay = undefined;
      }
      resolve();
    };
    const cancelDelay = () => {
      if (completed) {
        return;
      }
      completed = true;
      clearTimeout(timer);
      if (run.cancelDelay === cancelDelay) {
        run.cancelDelay = undefined;
      }
      reject(createImageGenerationInterruptedError(messageId, blockId));
    };
    const timer = setTimeout(complete, delayMs);
    run.cancelDelay = cancelDelay;
  });
}

function isTaskInterrupted(taskKey: string, error: unknown): boolean {
  const run = ACTIVE_TASK_RUNS.get(taskKey);
  return Boolean(run?.abortController.signal.aborted) || isImageGenerationInterrupted(error);
}

async function waitForInterruptedTasks(taskKeys: string[], reason: ImageCancelReason) {
  const waits = taskKeys
    .map(taskKey => interruptTaskRun(taskKey, reason))
    .filter((promise): promise is Promise<void> => Boolean(promise));

  if (waits.length === 0) {
    return;
  }

  await Promise.allSettled(waits);
}

async function emitBlockStateUpdated(messageId: number) {
  await eventEmit(IMGGEN_BLOCK_STATE_UPDATED_EVENT, messageId);
}

function getBlockState(messageId: number, blockId: string): RenderBlockState | undefined {
  const resolved = getResolvedImgGenMessageState(messageId);
  const blockOrder = resolved?.blocks.findIndex(block => block.id === blockId) ?? -1;
  const block = blockOrder >= 0 ? resolved?.blocks[blockOrder] : undefined;

  return block
    ? {
        messageId,
        blockOrder,
        ...block,
      }
    : undefined;
}

function buildTaskKey(messageId: number, blockId: string): string {
  return `${messageId}::${blockId}`;
}

function parseTaskKey(taskKey: string): { messageId: number; blockId: string } {
  const separatorIndex = taskKey.indexOf('::');
  return {
    messageId: Number(taskKey.slice(0, separatorIndex)),
    blockId: taskKey.slice(separatorIndex + 2),
  };
}

function getBlockDisplayIndex(messageId: number, blockId: string): number | undefined {
  const block = getBlockState(messageId, blockId);
  return block ? block.blockOrder + 1 : undefined;
}

function buildBlockLabel(messageId: number, blockId: string) {
  const displayIndex = getBlockDisplayIndex(messageId, blockId);
  return `消息${messageId}${displayIndex ? ` · 块${displayIndex}` : ''}`;
}

function buildOfficialProgressMessage(messageId: number, blockId: string, content: string): string {
  return `${buildBlockLabel(messageId, blockId)}<br>${content}`;
}

function buildQueueFocusTask(taskKey?: string) {
  if (!taskKey) {
    return undefined;
  }

  const { messageId, blockId } = parseTaskKey(taskKey);
  return {
    messageId,
    blockId,
    blockDisplayIndex: getBlockDisplayIndex(messageId, blockId),
  };
}

function getAutomaticQueueSnapshot(): AutoGenerationQueueSnapshot {
  const pendingCount = [...QUEUED_KEYS].filter(taskKey => !ACTIVE_AUTO_TASKS.has(taskKey)).length;
  const activeTaskKey = ACTIVE_AUTO_TASKS.values().next().value as string | undefined;
  const sequentialTask = SEQUENTIAL_QUEUE[0];
  const sequentialTaskKey = sequentialTask ? buildTaskKey(sequentialTask.messageId, sequentialTask.blockId) : undefined;
  const scheduledTaskKey = SCHEDULED_TIMERS.keys().next().value as string | undefined;
  const fallbackTaskKey = QUEUED_KEYS.values().next().value as string | undefined;

  return {
    pendingCount,
    activeCount: ACTIVE_AUTO_TASKS.size,
    focusTask: buildQueueFocusTask(activeTaskKey ?? sequentialTaskKey ?? scheduledTaskKey ?? fallbackTaskKey),
  };
}

function buildAutomaticQueueDetail(snapshot: AutoGenerationQueueSnapshot) {
  if (automaticQueueCancellation.active) {
    return snapshot.activeCount > 0
      ? `正在取消 ${automaticQueueCancellation.pendingCount} 个自动任务<br>当前进行中的请求会被中断`
      : `正在取消 ${automaticQueueCancellation.pendingCount} 个等待中的自动任务`;
  }

  return automaticQueueDetailOverride?.message ?? buildAutoGenerationQueueToastMessage(snapshot);
}

function syncAutomaticTaskGroup() {
  const taskCenter = getTaskCenter();
  if (!taskCenter) {
    return;
  }

  const snapshot = getAutomaticQueueSnapshot();
  const hasWork = hasAutoGenerationQueueWork(snapshot);

  if (!hasWork && !automaticQueueCancellation.active) {
    taskCenter.removeGroup(IMAGE_AUTO_GROUP_ID);
    return;
  }

  const session = ensureAutomaticQueueSession();
  taskCenter.upsertGroup({
    id: IMAGE_AUTO_GROUP_ID,
    kind: 'image-auto',
    status: automaticQueueCancellation.active ? 'cancelling' : snapshot.activeCount > 0 ? 'running' : 'queued',
    title: '自动图片生成',
    detail: buildAutomaticQueueDetail(snapshot),
    counts: {
      queued: snapshot.pendingCount,
      running: snapshot.activeCount,
      succeeded: session.succeededCount,
      failed: session.failedCount,
      cancelled: session.cancelledCount,
    },
    focus: snapshot.focusTask,
    cancelAction:
      snapshot.pendingCount > 0 || snapshot.activeCount > 0 || automaticQueueCancellation.active
        ? {
            label: '取消自动生图队列',
            run: () => {
              void interruptAutomaticGenerationQueue({ reason: 'button' }).catch(error => {
                logError('取消自动生图队列失败', error);
              });
            },
          }
        : undefined,
  });
}

function setAutomaticQueueDetail(taskKey: string, message: string) {
  automaticQueueDetailOverride = {
    taskKey,
    message,
  };
  syncAutomaticTaskGroup();
}

function clearAutomaticQueueDetail(taskKey: string) {
  if (automaticQueueDetailOverride?.taskKey === taskKey) {
    automaticQueueDetailOverride = undefined;
  }
}

function buildAutomaticQueueResultToast(session: AutomaticQueueSession): TaskResultToast | undefined {
  if (session.failedCount === 0 && session.cancelledCount === 0) {
    return undefined;
  }

  const parts: string[] = [];
  if (session.succeededCount > 0) {
    parts.push(`${session.succeededCount} 个完成`);
  }
  if (session.failedCount > 0) {
    parts.push(`${session.failedCount} 个失败`);
  }
  if (session.cancelledCount > 0) {
    parts.push(`${session.cancelledCount} 个已取消`);
  }

  const level =
    session.failedCount > 0 ? (session.succeededCount > 0 || session.cancelledCount > 0 ? 'warning' : 'error') : 'info';
  const detail = session.failedCount === 1 && session.failureMessages[0] ? `：${session.failureMessages[0]}` : '';

  return {
    level,
    title: '图片生成',
    message: `自动生图队列结束，${parts.join('，')}${detail}`,
    dedupeKey: `${session.requestId}:result`,
  };
}

function buildAutomaticQueueCompletionSummary(session: AutomaticQueueSession): AutomaticQueueCompletionSummary {
  const processedCount = session.succeededCount + session.failedCount + session.cancelledCount;
  const parts: string[] = [];
  if (session.succeededCount > 0) {
    parts.push(`${session.succeededCount} 个完成`);
  }
  if (session.failedCount > 0) {
    parts.push(`${session.failedCount} 个失败`);
  }
  if (session.cancelledCount > 0) {
    parts.push(`${session.cancelledCount} 个已取消`);
  }

  return {
    requestId: session.requestId,
    succeededCount: session.succeededCount,
    failedCount: session.failedCount,
    cancelledCount: session.cancelledCount,
    failureMessages: [...session.failureMessages],
    message:
      processedCount > 0
        ? `自动生图队列结束，${parts.join('，')}`
        : '自动生图队列结束，没有可处理的图片任务',
  };
}

function completeAutomaticQueueSessionIfIdle() {
  const taskCenter = getTaskCenter();
  if (!taskCenter || automaticQueueCancellation.active) {
    return;
  }

  const snapshot = getAutomaticQueueSnapshot();
  if (hasAutoGenerationQueueWork(snapshot) || !automaticQueueSession) {
    syncAutomaticTaskGroup();
    return;
  }

  if (suppressAutomaticQueueResult) {
    suppressAutomaticQueueResult = false;
    automaticQueueSession = undefined;
    automaticQueueDetailOverride = undefined;
    taskCenter.removeGroup(IMAGE_AUTO_GROUP_ID);
    return;
  }

  automaticQueueFinishedNotifier?.(buildAutomaticQueueCompletionSummary(automaticQueueSession));
  const resultToast = buildAutomaticQueueResultToast(automaticQueueSession);
  automaticQueueSession = undefined;
  automaticQueueDetailOverride = undefined;
  taskCenter.finishGroup(IMAGE_AUTO_GROUP_ID, resultToast);
}

function createManualGenerationBatch(
  messageId: number,
  totalCount: number,
  options?: ImageGenerationRequestOptions,
): ManualGenerationBatch {
  const requestId = options?.requestId ?? crypto.randomUUID();
  return {
    groupId: options?.groupId ?? `image-manual:${requestId}`,
    requestId,
    totalCount,
    succeededCount: 0,
    failedCount: 0,
    cancelledCount: 0,
    failureMessages: [],
    detail: `准备处理 ${totalCount} 个图片任务...`,
    cancelled: false,
    focus: { messageId },
  };
}

function syncManualBatch(batch: ManualGenerationBatch) {
  const taskCenter = getTaskCenter();
  if (!taskCenter) {
    return;
  }

  const processedCount = batch.succeededCount + batch.failedCount + batch.cancelledCount;
  const runningCount = batch.focus ? 1 : 0;
  taskCenter.upsertGroup({
    id: batch.groupId,
    kind: 'image-manual',
    status: batch.cancelled ? 'cancelling' : 'running',
    title: '手动图片生成',
    detail: batch.detail,
    counts: {
      queued: Math.max(batch.totalCount - processedCount - runningCount, 0),
      running: runningCount,
      succeeded: batch.succeededCount,
      failed: batch.failedCount,
      cancelled: batch.cancelledCount,
    },
    focus: batch.focus,
    cancelAction:
      processedCount < batch.totalCount
        ? {
            label: '取消手动生图',
            run: () => {
              void cancelManualBatch(batch, { reason: 'button' });
            },
          }
        : undefined,
  });
}

function setManualBatchProgress(batch: ManualGenerationBatch, messageId: number, blockId: string, content: string) {
  batch.focus = {
    messageId,
    blockId,
    blockDisplayIndex: getBlockDisplayIndex(messageId, blockId),
  };
  batch.detail = buildOfficialProgressMessage(messageId, blockId, content);
  syncManualBatch(batch);
}

async function cancelManualBatch(batch: ManualGenerationBatch, options?: { reason?: ImageCancelReason }) {
  if (batch.cancelled) {
    return false;
  }

  batch.cancelled = true;
  batch.cancelReason = options?.reason;
  batch.detail = batch.focus
    ? buildOfficialProgressMessage(batch.focus.messageId, batch.focus.blockId ?? '', '正在取消...')
    : '正在取消剩余任务...';
  syncManualBatch(batch);

  const activeTaskKeys = [...ACTIVE_TASK_RUNS.entries()]
    .filter(([, run]) => run.origin === 'manual' && run.batchId === batch.groupId)
    .map(([taskKey]) => taskKey);
  await waitForInterruptedTasks(activeTaskKeys, options?.reason ?? 'button');
  return true;
}

function finalizeManualBatchStep(
  batch: ManualGenerationBatch,
  messageId: number,
  blockId: string,
  outcome: ImageTaskOutcome,
) {
  if (outcome.status === 'success') {
    batch.succeededCount += 1;
    batch.detail = buildOfficialProgressMessage(messageId, blockId, `已完成，获得 ${outcome.urlsCount} 张图片`);
  } else if (outcome.status === 'cancelled') {
    batch.cancelledCount += 1;
    batch.detail = buildOfficialProgressMessage(messageId, blockId, outcome.message);
  } else if (outcome.status === 'failed') {
    batch.failedCount += 1;
    batch.failureMessages.push(`${buildBlockLabel(messageId, blockId)}：${outcome.message}`);
    batch.detail = buildOfficialProgressMessage(messageId, blockId, outcome.message);
  }

  batch.focus = undefined;
  syncManualBatch(batch);
}

function buildManualBatchResultToast(batch: ManualGenerationBatch): TaskResultToast | undefined {
  const processedCount = batch.succeededCount + batch.failedCount + batch.cancelledCount;
  if (processedCount === 0) {
    return undefined;
  }

  if (batch.cancelReason === 'destroy' || batch.cancelReason === 'replace') {
    return undefined;
  }

  const parts: string[] = [];
  if (batch.succeededCount > 0) {
    parts.push(`${batch.succeededCount} 个完成`);
  }
  if (batch.failedCount > 0) {
    parts.push(`${batch.failedCount} 个失败`);
  }
  if (batch.cancelledCount > 0) {
    parts.push(`${batch.cancelledCount} 个已取消`);
  }

  const level =
    batch.failedCount > 0
      ? batch.succeededCount > 0 || batch.cancelledCount > 0
        ? 'warning'
        : 'error'
      : batch.cancelledCount > 0
        ? 'info'
        : 'success';
  const detail = batch.failedCount === 1 && batch.failureMessages[0] ? `：${batch.failureMessages[0]}` : '';

  return {
    level,
    title: '图片生成',
    message: `手动生图完成，${parts.join('，')}${detail}`,
    dedupeKey: `${batch.requestId}:result`,
  };
}

async function updateBlockData(
  messageId: number,
  blockId: string,
  payload: { prompt: string; mediaUrls: string[]; preventAuto: boolean; isScheduled: boolean },
) {
  const resolved = getResolvedImgGenMessageState(messageId);
  if (!resolved || !resolved.blocks.some(block => block.id === blockId)) {
    return false;
  }

  const nextBlocks = resolved.blocks.map(block =>
    block.id === blockId ? normalizeImgGenMessageBlockState(blockId, payload, payload.prompt) : block,
  );
  await setImgGenBlocksInMessageVariables(messageId, nextBlocks);
  await emitBlockStateUpdated(messageId);
  return true;
}

async function interruptAutomaticGenerationQueue(options?: { reason?: 'button' | 'destroy' }) {
  const pendingTaskKeys = new Set<string>();
  const activeTaskKeys = [...ACTIVE_AUTO_TASKS];

  SCHEDULED_TIMERS.forEach((timer, taskKey) => {
    clearTimeout(timer);
    pendingTaskKeys.add(taskKey);
  });
  SCHEDULED_TIMERS.clear();

  SEQUENTIAL_QUEUE.splice(0, SEQUENTIAL_QUEUE.length).forEach(task => {
    pendingTaskKeys.add(buildTaskKey(task.messageId, task.blockId));
  });

  QUEUED_KEYS.forEach(taskKey => {
    if (!ACTIVE_AUTO_TASKS.has(taskKey)) {
      pendingTaskKeys.add(taskKey);
    }
  });

  if (pendingTaskKeys.size === 0 && activeTaskKeys.length === 0) {
    if (options?.reason === 'destroy') {
      suppressAutomaticQueueResult = true;
    }
    syncAutomaticTaskGroup();
    return {
      interrupted: false,
      pendingCount: 0,
      activeCount: 0,
    };
  }

  ensureAutomaticQueueSession();
  if (options?.reason === 'destroy') {
    suppressAutomaticQueueResult = true;
  }
  automaticQueueCancellation = {
    active: true,
    pendingCount: pendingTaskKeys.size + activeTaskKeys.length,
  };
  pendingTaskKeys.forEach(taskKey => {
    QUEUED_KEYS.delete(taskKey);
  });
  syncAutomaticTaskGroup();

  await Promise.allSettled(
    [...pendingTaskKeys].map(async taskKey => {
      const { messageId, blockId } = parseTaskKey(taskKey);
      const state = getBlockState(messageId, blockId);
      if (!state || ACTIVE_GENERATING_TASKS.has(taskKey)) {
        return;
      }

      await updateBlockData(messageId, blockId, {
        prompt: state.prompt,
        mediaUrls: state.mediaUrls,
        preventAuto: state.mediaUrls.length === 0 ? true : state.preventAuto,
        isScheduled: false,
      });
    }),
  );

  if (automaticQueueSession) {
    automaticQueueSession.cancelledCount += pendingTaskKeys.size;
  }

  await waitForInterruptedTasks(activeTaskKeys, options?.reason ?? 'button');

  automaticQueueCancellation = {
    active: false,
    pendingCount: 0,
  };
  if (options?.reason !== 'destroy' && ACTIVE_AUTO_TASKS.size > 0) {
    automaticQueueDetailOverride = undefined;
  }
  syncAutomaticTaskGroup();
  completeAutomaticQueueSessionIfIdle();

  return {
    interrupted: true,
    pendingCount: pendingTaskKeys.size,
    activeCount: activeTaskKeys.length,
  };
}

async function interruptAllImageGeneration(options?: { reason?: 'button' | 'destroy' }) {
  await interruptAutomaticGenerationQueue(options);
  await Promise.allSettled(
    [...ACTIVE_MANUAL_BATCHES.values()].map(batch => cancelManualBatch(batch, { reason: options?.reason })),
  );
}

export async function cancelPendingAutomaticGenerationForBlock(messageId: number, blockId: string) {
  const taskKey = buildTaskKey(messageId, blockId);
  let cancelled = false;

  const timer = SCHEDULED_TIMERS.get(taskKey);
  if (timer) {
    clearTimeout(timer);
    SCHEDULED_TIMERS.delete(taskKey);
    cancelled = true;
  }

  const sequentialIndex = SEQUENTIAL_QUEUE.findIndex(task => task.messageId === messageId && task.blockId === blockId);
  if (sequentialIndex >= 0) {
    SEQUENTIAL_QUEUE.splice(sequentialIndex, 1);
    cancelled = true;
  }

  if (QUEUED_KEYS.delete(taskKey)) {
    cancelled = true;
  }

  if (ACTIVE_GENERATING_TASKS.has(taskKey)) {
    const activeRun = ACTIVE_TASK_RUNS.get(taskKey);
    if (activeRun?.origin === 'manual' && activeRun.batchId) {
      const batch = ACTIVE_MANUAL_BATCHES.get(activeRun.batchId);
      if (batch && !batch.cancelled) {
        batch.cancelled = true;
        batch.cancelReason = 'replace';
        syncManualBatch(batch);
      }
    }
    await waitForInterruptedTasks([taskKey], 'replace');
    return { cancelled: true, active: false };
  }

  const state = getBlockState(messageId, blockId);
  if (cancelled && state?.isScheduled) {
    await updateBlockData(messageId, blockId, {
      prompt: state.prompt,
      mediaUrls: state.mediaUrls,
      preventAuto: state.preventAuto,
      isScheduled: false,
    });
  }

  if (cancelled && automaticQueueSession) {
    automaticQueueSession.cancelledCount += 1;
  }

  syncAutomaticTaskGroup();
  completeAutomaticQueueSessionIfIdle();

  return { cancelled, active: false };
}

async function handleGeneration(
  messageId: number,
  blockId: string,
  options: ImageGenerationRequestOptions,
  batch?: ManualGenerationBatch,
): Promise<ImageTaskOutcome> {
  const taskKey = buildTaskKey(messageId, blockId);
  SCHEDULED_TIMERS.delete(taskKey);
  const state = getBlockState(messageId, blockId);
  if (!state || ACTIVE_GENERATING_TASKS.has(taskKey)) {
    return { status: 'skipped' };
  }

  const store = getStore();
  if (!store.config.enabled) {
    if (state.isScheduled) {
      await updateBlockData(messageId, blockId, {
        prompt: state.prompt,
        mediaUrls: state.mediaUrls,
        preventAuto: state.mediaUrls.length === 0 ? true : state.preventAuto,
        isScheduled: false,
      });
    }
    return {
      status: 'failed',
      message: '脚本已关闭',
    };
  }

  if (batch?.cancelled) {
    return {
      status: 'cancelled',
      message: '已取消',
      cancelReason: batch.cancelReason,
    };
  }

  const activePreset = store.getActivePromptPreset();
  const finalPrompt = buildFinalImagePrompt(state.prompt, {
    prefix: activePreset.prefix,
    suffix: activePreset.suffix,
    injectionMode: activePreset.injectionMode,
  });

  if (!finalPrompt) {
    await updateBlockData(messageId, blockId, {
      prompt: state.prompt,
      mediaUrls: state.mediaUrls,
      preventAuto: true,
      isScheduled: false,
    });
    if (options.origin === 'auto') {
      logWarn('跳过空提示词图片生成', { blockId, messageId });
      return { status: 'skipped' };
    }
    return {
      status: 'failed',
      message: '提示词为空，已跳过生图',
    };
  }

  const run = startTaskRun(taskKey, options.origin, batch?.groupId);
  if (options.origin === 'auto') {
    ensureAutomaticQueueSession();
    setAutomaticQueueDetail(taskKey, buildOfficialProgressMessage(messageId, blockId, '请求进行中...'));
  } else if (batch) {
    setManualBatchProgress(batch, messageId, blockId, '请求进行中...');
  }

  try {
    await updateBlockData(messageId, blockId, {
      prompt: state.prompt,
      mediaUrls: state.mediaUrls,
      preventAuto: state.preventAuto,
      isScheduled: true,
    });

    let lastError: Error | undefined;
    const maxAttempts = store.config.generation.retryCount + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      throwIfTaskInterrupted(taskKey, messageId, blockId);

      if (options.origin === 'auto') {
        setAutomaticQueueDetail(
          taskKey,
          buildOfficialProgressMessage(messageId, blockId, `请求进行中 (${attempt}/${maxAttempts})`),
        );
      } else if (batch) {
        setManualBatchProgress(batch, messageId, blockId, `请求进行中 (${attempt}/${maxAttempts})`);
      }

      try {
        const result = await requestImageGeneration(
          finalPrompt,
          activePreset.negative,
          run.abortController.signal,
          store.config.generation.timeoutEnabled ? store.config.generation.timeoutSeconds * 1000 : undefined,
        );
        if (result.urls.length === 0) {
          throw new Error('图片上传后未返回图片 URL');
        }

        await updateBlockData(messageId, blockId, {
          prompt: state.prompt,
          mediaUrls: [...new Set([...state.mediaUrls, ...result.urls])],
          preventAuto: false,
          isScheduled: false,
        });

        if (options.origin === 'auto' && automaticQueueSession) {
          automaticQueueSession.succeededCount += 1;
        }
        return {
          status: 'success',
          urlsCount: result.urls.length,
        };
      } catch (error) {
        if (isTaskInterrupted(taskKey, error)) {
          throw createImageGenerationInterruptedError(messageId, blockId);
        }

        lastError = error instanceof Error ? error : new Error('图片生成失败');
        if (attempt <= store.config.generation.retryCount) {
          const retryMessage = `请求失败，${store.config.generation.retryDelaySeconds} 秒后重试 (${attempt + 1}/${maxAttempts})`;
          if (options.origin === 'auto') {
            setAutomaticQueueDetail(taskKey, buildOfficialProgressMessage(messageId, blockId, retryMessage));
          } else if (batch) {
            setManualBatchProgress(batch, messageId, blockId, retryMessage);
          }
          await waitForTaskDelay(taskKey, store.config.generation.retryDelaySeconds * 1000, messageId, blockId);
        }
      }
    }

    await updateBlockData(messageId, blockId, {
      prompt: state.prompt,
      mediaUrls: state.mediaUrls,
      preventAuto: state.mediaUrls.length === 0 ? true : state.preventAuto,
      isScheduled: false,
    });

    const failureMessage = `生成失败: ${lastError?.message ?? '图片生成失败'}`;
    if (options.origin === 'auto' && automaticQueueSession) {
      automaticQueueSession.failedCount += 1;
      automaticQueueSession.failureMessages.push(
        `${buildBlockLabel(messageId, blockId)}：${lastError?.message ?? '图片生成失败'}`,
      );
    }
    return {
      status: 'failed',
      message: failureMessage,
    };
  } catch (error) {
    if (isImageGenerationInterrupted(error)) {
      await updateBlockData(messageId, blockId, {
        prompt: state.prompt,
        mediaUrls: state.mediaUrls,
        preventAuto: state.mediaUrls.length === 0 ? true : state.preventAuto,
        isScheduled: false,
      });

      if (options.origin === 'auto' && automaticQueueSession) {
        automaticQueueSession.cancelledCount += 1;
      }

      return {
        status: 'cancelled',
        message: '已取消',
        cancelReason: run.cancelReason,
      };
    }

    throw error;
  } finally {
    finishTaskRun(taskKey);
    if (options.origin === 'auto') {
      clearAutomaticQueueDetail(taskKey);
      syncAutomaticTaskGroup();
      completeAutomaticQueueSessionIfIdle();
    }
  }
}

async function processSequentialQueue() {
  const store = getStore();
  if (sequentialProcessing) {
    return;
  }

  sequentialProcessing = true;
  while (SEQUENTIAL_QUEUE.length > 0) {
    const task = SEQUENTIAL_QUEUE.shift()!;
    QUEUED_KEYS.delete(buildTaskKey(task.messageId, task.blockId));
    syncAutomaticTaskGroup();
    await handleGeneration(task.messageId, task.blockId, {
      origin: 'auto',
      requestId: automaticQueueSession?.requestId,
      groupId: IMAGE_AUTO_GROUP_ID,
    });
    if (SEQUENTIAL_QUEUE.length > 0) {
      await new Promise(resolve => setTimeout(resolve, store.config.generation.intervalSeconds * 1000));
    }
  }
  sequentialProcessing = false;
  completeAutomaticQueueSessionIfIdle();
}

export async function generateImageBlocks(
  messageId: number,
  blockIds: string[],
  options?: Partial<ImageGenerationRequestOptions>,
): Promise<number> {
  const store = getStore();
  if (!store.config.enabled) {
    showWarningToast('脚本已关闭');
    return 0;
  }

  const uniqueBlockIds = [...new Set(blockIds.map(blockId => blockId.trim()).filter(Boolean))].filter(blockId =>
    Boolean(getBlockState(messageId, blockId)),
  );
  if (uniqueBlockIds.length === 0) {
    return 0;
  }

  const batch = createManualGenerationBatch(messageId, uniqueBlockIds.length, {
    origin: 'manual',
    requestId: options?.requestId,
    groupId: options?.groupId,
  });
  ACTIVE_MANUAL_BATCHES.set(batch.groupId, batch);
  syncManualBatch(batch);

  try {
    for (const blockId of uniqueBlockIds) {
      if (batch.cancelled) {
        break;
      }

      const outcome = await handleGeneration(
        messageId,
        blockId,
        {
          origin: 'manual',
          requestId: batch.requestId,
          groupId: batch.groupId,
        },
        batch,
      );
      finalizeManualBatchStep(batch, messageId, blockId, outcome);
    }
  } finally {
    const processedCount = batch.succeededCount + batch.failedCount + batch.cancelledCount;
    const remainingCount = Math.max(batch.totalCount - processedCount, 0);
    if (remainingCount > 0 && batch.cancelled) {
      batch.cancelledCount += remainingCount;
      batch.focus = undefined;
      batch.detail = '已取消剩余图片任务';
      syncManualBatch(batch);
    }

    ACTIVE_MANUAL_BATCHES.delete(batch.groupId);
  }

  getTaskCenter()?.finishGroup(batch.groupId, buildManualBatchResultToast(batch));
  return uniqueBlockIds.length;
}

export function queueAutomaticImageBlocks(messageId: number, blockIds: string[]): number {
  const store = getStore();
  if (!store.config.enabled || !store.config.generation.autoSend) {
    return 0;
  }

  const uniqueBlockIds = [...new Set(blockIds.map(blockId => blockId.trim()).filter(Boolean))];
  let queuedCount = 0;
  for (const blockId of uniqueBlockIds) {
    const taskKey = buildTaskKey(messageId, blockId);
    const state = getBlockState(messageId, blockId);
    if (
      !state ||
      state.mediaUrls.length > 0 ||
      state.preventAuto ||
      state.isScheduled ||
      QUEUED_KEYS.has(taskKey) ||
      ACTIVE_GENERATING_TASKS.has(taskKey)
    ) {
      continue;
    }

    ensureAutomaticQueueSession();
    QUEUED_KEYS.add(taskKey);
    syncAutomaticTaskGroup();
    void updateBlockData(messageId, blockId, {
      prompt: state.prompt,
      mediaUrls: state.mediaUrls,
      preventAuto: false,
      isScheduled: true,
    })
      .then(updated => {
        if (!updated) {
          QUEUED_KEYS.delete(taskKey);
          syncAutomaticTaskGroup();
          completeAutomaticQueueSessionIfIdle();
          return;
        }
        if (!QUEUED_KEYS.has(taskKey)) {
          syncAutomaticTaskGroup();
          completeAutomaticQueueSessionIfIdle();
          return;
        }
        if (store.config.generation.sequential) {
          SEQUENTIAL_QUEUE.push({ messageId, blockId });
          syncAutomaticTaskGroup();
          void processSequentialQueue();
          return;
        }
        const timer = setTimeout(
          () => {
            SCHEDULED_TIMERS.delete(taskKey);
            QUEUED_KEYS.delete(taskKey);
            syncAutomaticTaskGroup();
            void handleGeneration(messageId, blockId, {
              origin: 'auto',
              requestId: automaticQueueSession?.requestId,
              groupId: IMAGE_AUTO_GROUP_ID,
            });
          },
          state.blockOrder * store.config.generation.intervalSeconds * 1000,
        );
        SCHEDULED_TIMERS.set(taskKey, timer);
        syncAutomaticTaskGroup();
      })
      .catch(error => {
        const timer = SCHEDULED_TIMERS.get(taskKey);
        if (timer) {
          clearTimeout(timer);
          SCHEDULED_TIMERS.delete(taskKey);
        }
        QUEUED_KEYS.delete(taskKey);
        syncAutomaticTaskGroup();
        completeAutomaticQueueSessionIfIdle();
        logError('标记自动生图任务失败', error);
      });

    queuedCount += 1;
  }
  return queuedCount;
}

function isPromptFilterRegexUpToDate(regex?: TavernRegex): boolean {
  return Boolean(
    regex &&
    regex.find_regex === PROMPT_FILTER_REGEX &&
    regex.enabled &&
    regex.run_on_edit &&
    regex.destination.prompt &&
    !regex.destination.display &&
    regex.source.ai_output &&
    !regex.source.user_input &&
    !regex.source.slash_command &&
    !regex.source.world_info,
  );
}

function upsertPromptFilterRegex(regexes: TavernRegex[]): TavernRegex[] {
  const existingRegex = regexes.find(regex => regex.script_name === REGEX_NAME);
  if (existingRegex) {
    existingRegex.find_regex = PROMPT_FILTER_REGEX;
    existingRegex.enabled = true;
    existingRegex.run_on_edit = true;
    existingRegex.destination.prompt = true;
    existingRegex.destination.display = false;
    existingRegex.source.ai_output = true;
    existingRegex.source.user_input = false;
    existingRegex.source.slash_command = false;
    existingRegex.source.world_info = false;
    return regexes;
  }

  regexes.push({
    id: crypto.randomUUID(),
    script_name: REGEX_NAME,
    enabled: true,
    find_regex: PROMPT_FILTER_REGEX,
    replace_string: '',
    trim_strings: [],
    source: { user_input: false, ai_output: true, slash_command: false, world_info: false },
    destination: { display: false, prompt: true },
    run_on_edit: true,
    min_depth: null,
    max_depth: null,
  });
  return regexes;
}

export async function ensureImgGenRegex() {
  const regexes = getTavernRegexes({ type: 'global' });
  const currentPromptRegex = regexes.find(regex => regex.script_name === REGEX_NAME);
  if (!isPromptFilterRegexUpToDate(currentPromptRegex)) {
    await updateTavernRegexesWith(currentRegexes => upsertPromptFilterRegex(currentRegexes), { type: 'global' });
  }
}

export function initializeImageGenerationUi(
  taskCenter: TaskCenter,
  options?: {
    onAutomaticQueueFinished?: (summary: AutomaticQueueCompletionSummary) => void;
  },
) {
  imageTaskCenter = taskCenter;
  automaticQueueFinishedNotifier = options?.onAutomaticQueueFinished;

  const stopEnabledWatch = subscribeImageGenerationStore(
    state => state.config.enabled,
    enabled => {
      if (!enabled) {
        void interruptAllImageGeneration({ reason: 'destroy' });
      }
    },
  );
  const messageUi = createImageGenerationMessageUi({
    getBlockState,
    isBlockGenerating: (messageId, blockId) => ACTIVE_GENERATING_TASKS.has(buildTaskKey(messageId, blockId)),
    updateBlockData,
    cancelPendingAutomaticGenerationForBlock,
    generateBlock: async (messageId, blockId) => {
      const pendingState = await cancelPendingAutomaticGenerationForBlock(messageId, blockId);
      if (pendingState.active) {
        showInfoToast('当前块已在生成中', '图片生成');
        return;
      }
      await generateImageBlocks(messageId, [blockId], { origin: 'manual' });
    },
  });

  return {
    destroy: () => {
      stopEnabledWatch();
      messageUi.destroy();
      void interruptAllImageGeneration({ reason: 'destroy' });
      automaticQueueDetailOverride = undefined;
      automaticQueueSession = undefined;
      automaticQueueFinishedNotifier = undefined;
      suppressAutomaticQueueResult = false;
      getTaskCenter()?.removeGroup(IMAGE_AUTO_GROUP_ID);
      imageTaskCenter = undefined;
    },
    process: messageUi.process,
  };
}
