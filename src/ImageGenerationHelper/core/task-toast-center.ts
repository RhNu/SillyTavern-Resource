import { ActionToastSession } from './action-toast';
import { SCRIPT_DISPLAY_NAME } from './constants';
import type { TaskCenter, TaskCenterSnapshot, TaskGroup, TaskGroupCounts, TaskResultToast } from './task-center';
import { getTaskStatusLabel, pickFocusGroup, sumTaskGroupCounts } from './task-progress';
import { showErrorToast, showInfoToast, showSuccessToast, showWarningToast } from './toast';

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

function buildProgressMessage(snapshot: TaskCenterSnapshot, focusGroup: TaskGroup) {
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

export function createTaskToastCenter(taskCenter: TaskCenter) {
  const progressSession = new ActionToastSession(SCRIPT_DISPLAY_NAME);
  const seenResultKeys = new Set<string>();
  const unsubscribe = taskCenter.subscribe((snapshot, event) => {
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
