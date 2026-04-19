import { FLOATING_MENU_IDS } from '@/ImageGenerationHelperV2/app/ids';
import { getImageGenerationStore } from '@/ImageGenerationHelperV2/config/store';
import '@/ImageGenerationHelperV2/features/floating-menu/view.css';
import {
  getTaskGroupProgress,
  getTaskStatusLabel,
  pickFocusGroup,
} from '@/ImageGenerationHelperV2/features/tasking/task-progress';
import type { TaskGroup, TaskProjection } from '@/ImageGenerationHelperV2/features/tasking/task-projection';
import { type FloatingPercentPosition, mountDraggableFloatingSurface } from '@util/floating';
import { getHostDomContext } from '@util/host';
import { teleportStyle } from '@util/script';

const ROOT_ID = FLOATING_MENU_IDS.root;
const MENU_ID = FLOATING_MENU_IDS.menu;
const FLOATING_BUTTON_SIZE = 54;
const LEGACY_MOBILE_BREAKPOINT = 768;

type FloatingMenuOptions = {
  taskCenter: TaskProjection;
  onManualPromptGeneration: () => Promise<void> | void;
  onOpenSettings: () => void;
};

function getDefaultPosition(win: Window) {
  const isMobile = win.innerWidth <= LEGACY_MOBILE_BREAKPOINT;
  const top = isMobile ? win.innerHeight - FLOATING_BUTTON_SIZE - 88 : Math.floor(win.innerHeight * 0.45);

  return {
    x: win.innerWidth - FLOATING_BUTTON_SIZE - 12,
    y: top,
  };
}

function isValidPositionPercent(value: unknown): value is FloatingPercentPosition {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as FloatingPercentPosition).xPercent === 'number' &&
    typeof (value as FloatingPercentPosition).yPercent === 'number'
  );
}

function loadSavedPosition(): FloatingPercentPosition | undefined {
  try {
    const floatingMenuConfig = getImageGenerationStore().config.ui.floatingMenu;

    if (isValidPositionPercent(floatingMenuConfig.position)) {
      return floatingMenuConfig.position;
    }
  } catch (_error) {
    return undefined;
  }

  return undefined;
}

function savePosition(position: FloatingPercentPosition) {
  try {
    getImageGenerationStore().updateConfig(draft => {
      draft.ui.floatingMenu.position = position;
    });
  } catch (_error) {
    return;
  }
}

function toSingleLineText(detail: string) {
  return detail
    .replace(/<br\s*\/?\s*>/gi, ' · ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function ellipsisText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(maxLength - 1, 1)).trimEnd()}…`;
}

export function initializeFloatingMenu(options: FloatingMenuOptions) {
  const { doc, win } = getHostDomContext();
  const { destroy: destroyTeleportedStyle } = teleportStyle();
  let isOpen = false;
  let isManualPending = false;
  let focusGroup: TaskGroup | undefined;

  [ROOT_ID, MENU_ID]
    .map(id => doc.getElementById(id))
    .filter((node): node is HTMLElement => Boolean(node))
    .forEach(node => node.remove());

  const menu = doc.createElement('aside');

  const floating = mountDraggableFloatingSurface({
    doc,
    win,
    rootId: ROOT_ID,
    className: 'imggen-float-root is-idle',
    padding: 8,
    fallbackWidth: FLOATING_BUTTON_SIZE,
    fallbackHeight: FLOATING_BUTTON_SIZE,
    dragHandle: '.imggen-float-trigger',
    loadPosition: () => loadSavedPosition(),
    getDefaultPosition: () => getDefaultPosition(win),
    savePosition: position => {
      savePosition(position);
    },
    onMove: () => {
      if (isOpen) {
        placeMenu();
      }
    },
  });
  const root = floating.root;

  const trigger = doc.createElement('button');
  trigger.type = 'button';
  trigger.className = 'imggen-float-trigger';
  trigger.setAttribute('aria-label', '图片生成悬浮菜单');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', MENU_ID);
  trigger.innerHTML = `
    <span class="imggen-float-ring"></span>
    <span class="imggen-float-core">
      <i class="fa-solid fa-images imggen-float-icon" aria-hidden="true"></i>
      <span class="imggen-float-percent"></span>
    </span>
    <span class="imggen-float-badge">0</span>
  `;
  root.appendChild(trigger);

  menu.id = MENU_ID;
  menu.className = 'imggen-float-menu';
  menu.innerHTML = `
    <div class="imggen-float-actions">
      <button type="button" class="imggen-float-action" data-imggen-fm="manual">手动生成</button>
      <button type="button" class="imggen-float-action" data-imggen-fm="settings">打开设置</button>
      <button type="button" class="imggen-float-action" data-imggen-fm="cancel">取消进行中任务</button>
    </div>
    <div class="imggen-float-meta">
      <span class="imggen-float-meta__status" data-imggen-fm="focus-status">空闲</span>
      <span class="imggen-float-meta__text" data-imggen-fm="focus-text">暂无任务</span>
    </div>
  `;

  const mountPoint = doc.body ?? doc.documentElement;
  mountPoint.append(menu);

  const percentNode = root.querySelector<HTMLElement>('.imggen-float-percent');
  const badgeNode = root.querySelector<HTMLElement>('.imggen-float-badge');
  const manualButton = menu.querySelector<HTMLButtonElement>('[data-imggen-fm="manual"]');
  const settingsButton = menu.querySelector<HTMLButtonElement>('[data-imggen-fm="settings"]');
  const cancelButton = menu.querySelector<HTMLButtonElement>('[data-imggen-fm="cancel"]');
  const focusStatusNode = menu.querySelector<HTMLElement>('[data-imggen-fm="focus-status"]');
  const focusTextNode = menu.querySelector<HTMLElement>('[data-imggen-fm="focus-text"]');

  if (
    !percentNode ||
    !badgeNode ||
    !manualButton ||
    !settingsButton ||
    !cancelButton ||
    !focusStatusNode ||
    !focusTextNode
  ) {
    throw new Error('悬浮菜单初始化失败：关键节点缺失');
  }

  const placeMenu = () => {
    const triggerRect = root.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 220;
    const menuHeight = menu.offsetHeight || 140;
    const gap = 8;

    let left = triggerRect.right + gap;
    if (left + menuWidth > win.innerWidth - 8) {
      left = triggerRect.left - menuWidth - gap;
    }

    let top = triggerRect.top + (triggerRect.height - menuHeight) / 2;

    left = Math.max(8, Math.min(left, win.innerWidth - menuWidth - 8));
    top = Math.max(8, Math.min(top, win.innerHeight - menuHeight - 8));

    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
  };

  const setOpen = (nextOpen: boolean) => {
    if (isOpen === nextOpen) {
      return;
    }

    isOpen = nextOpen;
    menu.classList.toggle('is-open', isOpen);
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    if (isOpen) {
      placeMenu();
    }
  };

  const close = () => {
    setOpen(false);
  };

  const toggleOpen = () => {
    setOpen(!isOpen);
  };

  const syncActionButtons = () => {
    manualButton.disabled = isManualPending;

    const cancelAction = focusGroup?.cancelAction;
    cancelButton.disabled = !cancelAction || focusGroup?.status === 'cancelling';
    cancelButton.textContent = cancelAction?.label ?? '取消进行中任务';
  };

  const applyProgress = (group?: TaskGroup) => {
    if (!group) {
      root.classList.add('is-idle');
      root.classList.remove('is-indeterminate');
      root.style.setProperty('--imggen-progress', '0');
      percentNode.textContent = '';
      return;
    }

    root.classList.remove('is-idle');

    const progress = getTaskGroupProgress(group);
    if (progress.indeterminate) {
      root.classList.add('is-indeterminate');
      root.style.setProperty('--imggen-progress', '32');
      percentNode.textContent = '...';
      return;
    }

    root.classList.remove('is-indeterminate');
    root.style.setProperty('--imggen-progress', String(progress.percent));
    percentNode.textContent = `${progress.percent}%`;
  };

  const updateTaskView = (groups: TaskGroup[]) => {
    focusGroup = pickFocusGroup(groups);
    applyProgress(focusGroup);

    badgeNode.textContent = String(groups.length);
    badgeNode.classList.toggle('has-count', groups.length > 0);

    if (!focusGroup) {
      focusStatusNode.textContent = '空闲';
      focusStatusNode.className = 'imggen-float-meta__status';
      focusTextNode.textContent = '暂无任务';
      syncActionButtons();
      return;
    }

    const statusLabel = getTaskStatusLabel(focusGroup.status) || '处理中';
    const progress = getTaskGroupProgress(focusGroup);
    const detail = ellipsisText(toSingleLineText(focusGroup.detail), 34);
    const title = ellipsisText(focusGroup.title, 16);
    const progressText = progress.indeterminate ? '' : ` · ${progress.percent}%`;

    focusStatusNode.textContent = statusLabel;
    focusStatusNode.className = [
      'imggen-float-meta__status',
      focusGroup.status === 'cancelling' ? 'is-cancelling' : '',
      focusGroup.status === 'failed' ? 'is-failed' : '',
    ]
      .filter(Boolean)
      .join(' ');
    focusTextNode.textContent = detail ? `${title}${progressText} · ${detail}` : `${title}${progressText}`;
    syncActionButtons();
  };

  const onTriggerClick = (event: MouseEvent) => {
    event.preventDefault();

    if (floating.consumeClickSuppression()) {
      return;
    }

    toggleOpen();
  };

  const onDocumentPointerDown = (event: PointerEvent) => {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (root.contains(target) || menu.contains(target)) {
      return;
    }

    close();
  };

  const onManualClick = async (event: MouseEvent) => {
    event.preventDefault();
    if (isManualPending) {
      return;
    }

    isManualPending = true;
    syncActionButtons();
    try {
      await options.onManualPromptGeneration();
      close();
    } finally {
      isManualPending = false;
      syncActionButtons();
    }
  };

  const onSettingsClick = (event: MouseEvent) => {
    event.preventDefault();
    close();
    options.onOpenSettings();
  };

  const onCancelClick = (event: MouseEvent) => {
    event.preventDefault();
    focusGroup?.cancelAction?.run();
  };

  const unsubscribe = options.taskCenter.subscribe(snapshot => {
    updateTaskView(snapshot.groups);
    if (isOpen) {
      placeMenu();
    }
  });

  trigger.addEventListener('click', onTriggerClick);
  doc.addEventListener('pointerdown', onDocumentPointerDown, true);
  manualButton.addEventListener('click', onManualClick);
  settingsButton.addEventListener('click', onSettingsClick);
  cancelButton.addEventListener('click', onCancelClick);

  syncActionButtons();

  return {
    destroy: () => {
      unsubscribe();
      trigger.removeEventListener('click', onTriggerClick);
      doc.removeEventListener('pointerdown', onDocumentPointerDown, true);
      manualButton.removeEventListener('click', onManualClick);
      settingsButton.removeEventListener('click', onSettingsClick);
      cancelButton.removeEventListener('click', onCancelClick);
      floating.destroy();
      root.remove();
      menu.remove();
      destroyTeleportedStyle();
    },
  };
}
