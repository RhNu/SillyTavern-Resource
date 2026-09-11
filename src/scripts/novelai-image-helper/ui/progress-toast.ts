import { createLogger } from '../app/logger';
import type { NovelAiImageService } from '../app/service';
import {
  pickFocusedWork,
  type WorkProgressItem,
  type WorkProgressSnapshot,
  workProgressPercent,
} from '../app/work-progress';

const TITLE = 'NovelAI 图片助手';
const logger = createLogger('ui/progress-toast');

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return entities[character] ?? character;
  });
}

function buildMarkup(item: WorkProgressItem, workCount: number): string {
  const percent = workProgressPercent(item);
  const status = item.status === 'cancelling' ? '正在中断' : item.status === 'paused' ? '已暂停' : '处理中';
  const action = item.cancel
    ? `<button type="button" class="nai-work-toast__button" data-nai-work-cancel ${item.status === 'cancelling' ? 'disabled' : ''}>${escapeHtml(item.cancel.label)}</button>`
    : '';
  return `<div class="nai-work-toast__body">
    <strong>${escapeHtml(item.title)} · ${status}${percent === undefined ? '' : ` · ${percent}%`}</strong>
    <span>${escapeHtml(item.detail)}</span>
    ${workCount > 1 ? `<small>另有 ${workCount - 1} 组工作同时进行</small>` : ''}
    ${action}
  </div>`;
}

/** 可选的持久进度 toast；成功与失败通知由执行层独立展示，不受此开关影响。 */
export function mountProgressToast(service: NovelAiImageService): { destroy: () => void } {
  let toast: JQuery | undefined;
  let cleanupAction: (() => void) | undefined;
  let snapshot: WorkProgressSnapshot = service.progress.snapshot();
  let enabled = service.settings.get().notifications.progressToast;

  function clear(): void {
    cleanupAction?.();
    cleanupAction = undefined;
    if (toast?.length) {
      toastr.clear(toast, { force: true });
      toastr.remove(toast);
    }
    toast = undefined;
  }

  function bindAction(item: WorkProgressItem): void {
    cleanupAction?.();
    cleanupAction = undefined;
    if (!toast?.length || !item.cancel) return;
    const $button = toast.find('[data-nai-work-cancel]');
    const onClick = (event: JQuery.ClickEvent) => {
      event.preventDefault();
      item.cancel?.run();
    };
    $button.on('click.nai-work-progress', onClick);
    cleanupAction = () => $button.off('click.nai-work-progress', onClick);
  }

  function render(): void {
    try {
      if (!enabled) {
        clear();
        return;
      }
      const focus = pickFocusedWork(snapshot.items);
      if (!focus) {
        clear();
        return;
      }
      const markup = buildMarkup(focus, snapshot.items.length);
      if (toast?.length && toast[0]?.isConnected) {
        toast.find('.toast-title').text(TITLE);
        toast.find('.toast-message').html(markup);
      } else {
        toast = toastr.info(markup, TITLE, {
          timeOut: 0,
          extendedTimeOut: 0,
          closeButton: true,
          progressBar: true,
          tapToDismiss: false,
          escapeHtml: false,
        });
        toast?.addClass('nai-work-toast');
      }
      bindAction(focus);
    } catch (error) {
      logger.error('更新持久进度 toast 失败', error);
    }
  }

  const unsubscribeProgress = service.progress.subscribe(next => {
    snapshot = next;
    render();
  });
  const unsubscribeSettings = service.settings.subscribe(settings => {
    enabled = settings.notifications.progressToast;
    render();
  });

  return {
    destroy: () => {
      unsubscribeProgress();
      unsubscribeSettings();
      clear();
    },
  };
}
