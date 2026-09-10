import { mountDraggableFloatingSurface, type FloatingPercentPosition } from '@util/floating';
import { createScriptSettingsSync, type ScriptSettingsSync } from '@util/script-settings';
import { z } from 'zod';
import { createLogger } from '../app/logger';
import type { NovelAiImageService } from '../app/service';
import type { FailureStage } from '../image-generation/failure';
import type { QueueSnapshot, QueueTaskView } from '../image-generation/queue';

const TITLE = 'NovelAI 图片助手';
const TICK_MS = 500;
const logger = createLogger('ui/queue-indicator');

/**
 * 指示器位置与展开状态是纯界面偏好，单独存一条脚本变量，
 * 不与 novelaiImageHelper 的设置 schema 混在一起。
 */
const IndicatorStateSchema = z
  .object({
    collapsed: z.boolean().default(true),
    position: z.object({ xPercent: z.number(), yPercent: z.number() }).nullable().default(null),
  })
  .prefault({});

type IndicatorState = z.infer<typeof IndicatorStateSchema>;

const STAGE_LABELS: Record<FailureStage, string> = {
  validate: '检查后端',
  generate: '生成中',
  upload: '上传中',
  commit: '写入楼层',
};

function createIndicatorStateSync(): ScriptSettingsSync<IndicatorState> {
  return createScriptSettingsSync<IndicatorState>({
    key: 'queueIndicator',
    parse: value => IndicatorStateSchema.parse(value),
    defaultValue: { collapsed: true, position: null },
    debounceMs: 400,
  });
}

function taskLabel(task: QueueTaskView): string {
  const stage = task.stage ? STAGE_LABELS[task.stage] : '排队中';
  const attempt = task.attempt > 1 ? ` · 第 ${task.attempt}/${task.maxAttempts} 次尝试` : '';
  return `${task.summary || `图片块 ${task.blockId}`}（${stage}${attempt}）`;
}

function modeLabel(snapshot: QueueSnapshot, waitingMs: number): string {
  if (snapshot.mode === 'paused') return '已暂停';
  if (waitingMs > 0) return `节流等待 ${(waitingMs / 1000).toFixed(1)}s`;
  if (snapshot.active) return '进行中';
  if (snapshot.pending.length > 0) return '排队中';
  return '空闲';
}

/**
 * 轻量队列指示器：折叠时只显示一个带计数的悬浮球，
 * 展开后显示当前任务、节流倒计时与队列级操作。
 */
export function mountQueueIndicator(service: NovelAiImageService): { destroy: () => void } {
  const sync = createIndicatorStateSync();
  let state = sync.load();
  let snapshot = service.getQueueSnapshot();
  let ticker: ReturnType<typeof setInterval> | undefined;

  const $badge = $('<span class="nai-queue__badge">');
  const $toggle = $('<button type="button" class="nai-queue__toggle" data-action="toggle">')
    .attr('aria-label', 'NovelAI 图片队列')
    .append($badge);
  const $mode = $('<span class="nai-queue__mode">');
  const $header = $('<div class="nai-queue__header">').append(
    $('<span class="nai-queue__title">').text('NovelAI 队列'),
    $mode,
  );
  const $detail = $('<div class="nai-queue__detail">');
  const $list = $('<ul class="nai-queue__list">');
  const $pause = $('<button type="button" class="menu_button" data-action="pause">').text('暂停');
  const $cancelCurrent = $('<button type="button" class="menu_button" data-action="cancel-current">').text('取消当前');
  const $cancelAll = $('<button type="button" class="menu_button menu_button_cancel" data-action="cancel-all">').text(
    '取消全部',
  );
  const $retry = $('<button type="button" class="menu_button" data-action="retry-failed">').text('重试失败');
  const $actions = $('<div class="nai-queue__actions">').append($pause, $cancelCurrent, $cancelAll, $retry);
  const $panel = $('<div class="nai-queue__panel">').append($header, $detail, $list, $actions);
  const $root = $('<div class="nai-queue">').append($toggle, $panel);

  const floating = mountDraggableFloatingSurface({
    root: $root[0] as HTMLElement,
    dragHandle: '.nai-queue__header',
    ignoreDragWithin: '[data-action]',
    padding: 12,
    fallbackWidth: 280,
    fallbackHeight: 220,
    loadPosition: () => state.position,
    getDefaultPosition: context => ({ x: context.win.innerWidth - 300, y: 140 }),
    savePosition: (percent: FloatingPercentPosition) => {
      state = { ...state, position: percent };
      sync.schedule(state);
    },
  });

  function setCollapsed(collapsed: boolean): void {
    state = { ...state, collapsed };
    sync.schedule(state);
    render();
  }

  function ensureTicker(active: boolean): void {
    if (active && !ticker) ticker = setInterval(safeRender, TICK_MS);
    else if (!active && ticker) {
      clearInterval(ticker);
      ticker = undefined;
    }
  }

  function render(): void {
    snapshot = service.getQueueSnapshot();
    const waitingMs = Math.max(0, snapshot.nextDispatchAt - Date.now());
    const failedCount = snapshot.lastSummary?.failedCount ?? 0;
    const pendingCount = snapshot.pending.length;
    const total = pendingCount + (snapshot.active ? 1 : 0);
    const visible = snapshot.mode !== 'idle' || failedCount > 0;

    $root
      .attr('data-visible', String(visible))
      .attr('data-collapsed', String(state.collapsed))
      .attr('data-mode', snapshot.mode)
      .attr('data-waiting', String(waitingMs > 0));
    ensureTicker(snapshot.mode !== 'idle');
    if (!visible) return;

    $badge.text(String(total > 0 ? total : failedCount)).attr('data-tone', total === 0 ? 'error' : 'normal');
    $mode.text(modeLabel(snapshot, waitingMs));
    $toggle.attr('aria-expanded', String(!state.collapsed));

    $detail.empty();
    if (snapshot.active) {
      $detail.append($('<div class="nai-queue__line">').text(`当前：${taskLabel(snapshot.active)}`));
    }
    if (waitingMs > 0) {
      $detail.append(
        $('<div class="nai-queue__line nai-queue__line--waiting">').text(
          `等待节流：${(waitingMs / 1000).toFixed(1)} 秒（NovelAI 生图限流保护）`,
        ),
      );
    }
    if (pendingCount > 0) {
      $detail.append($('<div class="nai-queue__line">').text(`排队中：${pendingCount} 个任务`));
    }
    if (failedCount > 0) {
      $detail.append($('<div class="nai-queue__line nai-queue__line--error">').text(`本次失败：${failedCount} 个`));
    }

    $list.empty();
    snapshot.pending.slice(0, 3).forEach(task => {
      $list.append($('<li class="nai-queue__item">').text(taskLabel(task)));
    });
    if (pendingCount > 3) {
      $list.append($('<li class="nai-queue__item nai-queue__item--more">').text(`还有 ${pendingCount - 3} 个…`));
    }
    $list.toggle(pendingCount > 0);

    $pause.text(snapshot.mode === 'paused' ? '恢复' : '暂停').prop('disabled', snapshot.mode === 'idle');
    $cancelCurrent.prop('disabled', !snapshot.active);
    $cancelAll.prop('disabled', !snapshot.active && pendingCount === 0);
  }

  function safeRender(): void {
    try {
      render();
    } catch (error) {
      logger.error('渲染生成队列指示器失败', error);
    }
  }

  $root.on('click', '[data-action]', event => {
    try {
      event.stopPropagation();
      const action = String($(event.currentTarget).attr('data-action'));

      if (action === 'toggle') {
        setCollapsed(!state.collapsed);
        return;
      }
      if (action === 'pause') {
        if (snapshot.mode === 'paused') service.resumeQueue();
        else service.pauseQueue();
        return;
      }
      if (action === 'cancel-current') {
        const active = snapshot.active;
        if (active) service.queue.cancel(active.messageId, active.blockId);
        return;
      }
      if (action === 'cancel-all') {
        const cancelled = service.cancelQueue();
        toastr.info(`已取消 ${cancelled} 个等待中的任务`, TITLE);
        return;
      }
      if (action === 'retry-failed') {
        const { enqueued, skipped } = service.retryFailedBlocks();
        if (enqueued === 0) toastr.info('没有需要重试的图片块（已跳过重复入队）', TITLE);
        else toastr.success(`已重新加入 ${enqueued} 个任务${skipped > 0 ? `，跳过 ${skipped} 个` : ''}`, TITLE);
      }
    } catch (error) {
      logger.error('处理生成队列指示器操作失败', error);
      toastr.error(error instanceof Error ? error.message : String(error), TITLE);
    }
  });

  const unsubscribe = service.queue.subscribe(safeRender);
  safeRender();
  logger.info('生成队列指示器已挂载');

  return {
    destroy: () => {
      ensureTicker(false);
      unsubscribe();
      $root.off('click');
      floating.destroy();
      sync.destroy();
      logger.debug('生成队列指示器已销毁');
    },
  };
}
