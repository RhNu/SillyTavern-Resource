import { showLoader } from '@util/ui/loader/loader';
import type { LoaderSession } from '@util/ui/loader/types';
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

function buildMessage(item: WorkProgressItem, workCount: number): string {
  const percent = workProgressPercent(item);
  const status = { queued: '排队中', running: '处理中', cancelling: '正在中断', paused: '已暂停' }[item.status];
  return [
    `${item.title} · ${status}${percent === undefined ? '' : ` · ${percent}%`}`,
    item.detail,
    workCount > 1 ? `另有 ${workCount - 1} 组工作同时进行` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/** 可选的原生 loader toast；成功与失败通知由执行层独立展示。 */
export function mountProgressToast(service: NovelAiImageService): { destroy: () => void } {
  let current: { session: LoaderSession; stoppable: boolean } | undefined;
  let snapshot: WorkProgressSnapshot = service.progress.snapshot();
  let enabled = service.settings.get().notifications.progressToast;
  let destroyed = false;

  function clear(): void {
    const previous = current;
    current = undefined;
    if (previous) void previous.session.hide().catch(error => logger.error('关闭进度 loader 失败', error));
  }

  function render(): void {
    try {
      const focus = pickFocusedWork(snapshot.items);
      if (destroyed || !enabled || !focus) {
        clear();
        return;
      }
      const message = buildMessage(focus, snapshot.items.length);
      const stoppable = Boolean(focus.cancel) && focus.status !== 'cancelling';
      if (current && (!current.session.active || current.stoppable !== stoppable)) clear();
      if (!current) {
        const session = showLoader({
          blocking: false,
          toast: stoppable ? 'stoppable' : 'static',
          slug: 'novelai-image-helper-progress',
          title: TITLE,
          message,
          stopTooltip: focus.cancel?.label,
          onStop: stopped => {
            if (destroyed || current?.session !== stopped) return;
            // 原生 stop 在回调后销毁旧 handle。先释放引用，让同步进度通知创建收尾提示。
            current = undefined;
            const work = pickFocusedWork(snapshot.items);
            try {
              if (work?.status !== 'cancelling') work?.cancel?.run();
            } finally {
              render();
            }
          },
        });
        current = { session, stoppable };
      } else {
        current.session.update({ message, stopTooltip: focus.cancel?.label });
      }
    } catch (error) {
      logger.error('更新进度 loader 失败', error);
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
      destroyed = true;
      unsubscribeProgress();
      unsubscribeSettings();
      clear();
    },
  };
}
