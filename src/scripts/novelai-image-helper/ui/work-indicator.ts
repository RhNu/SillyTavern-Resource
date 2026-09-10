import { mountDraggableFloatingSurface, type FloatingPercentPosition } from '@util/floating';
import { getHostDomContext } from '@util/host';
import { createScriptSettingsSync, type ScriptSettingsSync } from '@util/script-settings';
import { z } from 'zod';
import { createLogger } from '../app/logger';
import type { NovelAiImageService } from '../app/service';
import {
  pickFocusedWork,
  workProgressPercent,
  type WorkProgressItem,
  type WorkProgressSnapshot,
} from '../app/work-progress';

const ROOT_ID = 'novelai-image-helper-work-indicator';
const MENU_ID = 'novelai-image-helper-work-menu';
const BUTTON_SIZE = 54;
const TITLE = 'NovelAI 图片助手';
const logger = createLogger('ui/work-indicator');

const IndicatorStateSchema = z
  .object({ position: z.object({ xPercent: z.number(), yPercent: z.number() }).nullable().default(null) })
  .prefault({});

type IndicatorState = z.infer<typeof IndicatorStateSchema>;

const STATUS_LABELS: Record<WorkProgressItem['status'], string> = {
  queued: '排队中',
  running: '进行中',
  paused: '已暂停',
  cancelling: '正在中断',
};

function createIndicatorStateSync(): ScriptSettingsSync<IndicatorState> {
  return createScriptSettingsSync<IndicatorState>({
    key: 'workIndicator',
    parse: value => IndicatorStateSchema.parse(value),
    defaultValue: { position: null },
    debounceMs: 400,
  });
}

function itemLabel(item: WorkProgressItem): string {
  const percent = workProgressPercent(item);
  return `${item.title} · ${STATUS_LABELS[item.status]}${percent === undefined ? '' : ` · ${percent}%`}`;
}

function requireElement<T extends Element>(parent: ParentNode, selector: string): T {
  const element = parent.querySelector<T>(selector);
  if (!element) throw new Error(`工作进度悬浮窗初始化失败：缺少 ${selector}`);
  return element;
}

/**
 * 统一工作悬浮窗。触发球保持固定尺寸，菜单独立挂载并按视口翻转，
 * 避免展开后改变拖拽根节点尺寸而在屏幕边缘错位。
 */
export function mountWorkIndicator(service: NovelAiImageService): { destroy: () => void } {
  const { doc, win } = getHostDomContext();
  const sync = createIndicatorStateSync();
  let state = sync.load();
  let snapshot: WorkProgressSnapshot = service.progress.snapshot();
  let focus: WorkProgressItem | undefined;
  let open = false;

  // 清理旧版队列指示器及热重载遗留节点。固定 ID 保证新版本也始终只有一个实例。
  doc.querySelectorAll(`#${ROOT_ID}, #${MENU_ID}, .nai-queue`).forEach(node => node.remove());

  const root = doc.createElement('div');
  root.id = ROOT_ID;
  root.className = 'nai-work-root';
  root.setAttribute('script_id', getScriptId());
  root.innerHTML = `
    <button type="button" class="nai-work-trigger" aria-label="NovelAI 工作进度" aria-expanded="false" aria-controls="${MENU_ID}">
      <span class="nai-work-ring"></span>
      <span class="nai-work-core">
        <i class="fa-solid fa-images" aria-hidden="true"></i>
        <span class="nai-work-percent"></span>
      </span>
      <span class="nai-work-badge">0</span>
    </button>
  `;

  const menu = doc.createElement('aside');
  menu.id = MENU_ID;
  menu.className = 'nai-work-menu';
  menu.setAttribute('script_id', getScriptId());
  menu.innerHTML = `
    <div class="nai-work-header">
      <strong>NovelAI 工作进度</strong>
      <button type="button" class="nai-work-close" data-nai-work-action="close" aria-label="关闭进度菜单">×</button>
    </div>
    <div class="nai-work-focus">
      <span class="nai-work-status"></span>
      <strong class="nai-work-focus-title"></strong>
      <span class="nai-work-focus-detail"></span>
    </div>
    <div class="nai-work-progress"><span class="nai-work-progress-bar"></span></div>
    <ul class="nai-work-list"></ul>
    <div class="nai-work-actions">
      <button type="button" class="menu_button menu_button_cancel" data-nai-work-action="cancel">中断当前工作</button>
    </div>
  `;
  (doc.body ?? doc.documentElement).append(menu);

  const trigger = requireElement<HTMLButtonElement>(root, '.nai-work-trigger');
  const percentNode = requireElement<HTMLElement>(root, '.nai-work-percent');
  const badgeNode = requireElement<HTMLElement>(root, '.nai-work-badge');
  const statusNode = requireElement<HTMLElement>(menu, '.nai-work-status');
  const titleNode = requireElement<HTMLElement>(menu, '.nai-work-focus-title');
  const detailNode = requireElement<HTMLElement>(menu, '.nai-work-focus-detail');
  const progressBar = requireElement<HTMLElement>(menu, '.nai-work-progress-bar');
  const list = requireElement<HTMLUListElement>(menu, '.nai-work-list');
  const cancelButton = requireElement<HTMLButtonElement>(menu, '[data-nai-work-action="cancel"]');

  const floating = mountDraggableFloatingSurface({
    doc,
    win,
    root,
    dragHandle: trigger,
    padding: 8,
    fallbackWidth: BUTTON_SIZE,
    fallbackHeight: BUTTON_SIZE,
    loadPosition: () => state.position,
    getDefaultPosition: context => ({
      x: context.win.innerWidth - BUTTON_SIZE - 12,
      y: Math.max(12, Math.floor(context.win.innerHeight * 0.45)),
    }),
    savePosition: (position: FloatingPercentPosition) => {
      state = { position };
      sync.schedule(state);
    },
    onMove: () => {
      if (open) placeMenu();
    },
  });

  function placeMenu(): void {
    const triggerRect = root.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 220;
    const menuHeight = menu.offsetHeight || 180;
    const gap = 8;
    let left = triggerRect.right + gap;
    if (left + menuWidth > win.innerWidth - 8) left = triggerRect.left - menuWidth - gap;
    let top = triggerRect.top + (triggerRect.height - menuHeight) / 2;
    left = Math.max(8, Math.min(left, win.innerWidth - menuWidth - 8));
    top = Math.max(8, Math.min(top, win.innerHeight - menuHeight - 8));
    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
  }

  function setOpen(next: boolean): void {
    open = next;
    menu.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    if (open) placeMenu();
  }

  function render(): void {
    focus = pickFocusedWork(snapshot.items);
    const percent = focus ? workProgressPercent(focus) : undefined;
    root.classList.toggle('is-idle', !focus);
    root.classList.toggle('is-indeterminate', Boolean(focus) && percent === undefined);
    root.classList.toggle('is-cancelling', focus?.status === 'cancelling');
    menu.classList.toggle('is-indeterminate', Boolean(focus) && percent === undefined);
    root.style.setProperty('--nai-work-progress', String(percent ?? 32));
    if (!focus) {
      percentNode.textContent = '';
      badgeNode.textContent = '0';
      badgeNode.classList.remove('has-count');
      statusNode.textContent = '空闲';
      titleNode.textContent = '暂无进行中的工作';
      detailNode.textContent = '开始工作后会显示实时进度。';
      progressBar.style.width = '0%';
      list.replaceChildren();
      list.hidden = true;
      cancelButton.textContent = '暂无可中断工作';
      cancelButton.disabled = true;
      if (open) placeMenu();
      return;
    }

    percentNode.textContent = percent === undefined ? '…' : `${percent}%`;
    badgeNode.textContent = String(snapshot.items.length);
    badgeNode.classList.toggle('has-count', snapshot.items.length > 1);
    statusNode.textContent = STATUS_LABELS[focus.status];
    titleNode.textContent = focus.title;
    detailNode.textContent = focus.detail;
    progressBar.style.width = percent === undefined ? '35%' : `${percent}%`;

    list.replaceChildren();
    snapshot.items
      .filter(item => item.id !== focus?.id)
      .forEach(item => {
        const entry = doc.createElement('li');
        entry.textContent = itemLabel(item);
        list.append(entry);
      });
    list.hidden = snapshot.items.length <= 1;
    cancelButton.textContent = focus.cancel?.label ?? '不可中断';
    cancelButton.disabled = !focus.cancel || focus.status === 'cancelling';
    if (open) placeMenu();
  }

  function onTriggerClick(event: MouseEvent): void {
    event.preventDefault();
    if (floating.consumeClickSuppression()) return;
    setOpen(!open);
  }

  function onMenuClick(event: MouseEvent): void {
    const action = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-nai-work-action]')?.dataset
      .naiWorkAction;
    if (action === 'close') setOpen(false);
    if (action === 'cancel') {
      try {
        focus?.cancel?.run();
      } catch (error) {
        logger.error('中断工作失败', error);
        toastr.error(error instanceof Error ? error.message : String(error), TITLE);
      }
    }
  }

  function onDocumentPointerDown(event: PointerEvent): void {
    const target = event.target as Node | null;
    if (open && target && !root.contains(target) && !menu.contains(target)) setOpen(false);
  }

  function onDocumentKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') setOpen(false);
  }

  trigger.addEventListener('click', onTriggerClick);
  menu.addEventListener('click', onMenuClick);
  doc.addEventListener('pointerdown', onDocumentPointerDown);
  doc.addEventListener('keydown', onDocumentKeyDown);
  const unsubscribe = service.progress.subscribe(next => {
    snapshot = next;
    try {
      render();
    } catch (error) {
      logger.error('渲染工作悬浮窗失败', error);
    }
  });
  logger.info('工作进度悬浮窗已挂载');

  return {
    destroy: () => {
      unsubscribe();
      trigger.removeEventListener('click', onTriggerClick);
      menu.removeEventListener('click', onMenuClick);
      doc.removeEventListener('pointerdown', onDocumentPointerDown);
      doc.removeEventListener('keydown', onDocumentKeyDown);
      floating.destroy();
      root.remove();
      menu.remove();
      sync.destroy();
      logger.debug('工作进度悬浮窗已销毁');
    },
  };
}
