import { teleportStyle } from '@util/script';
import { FLOATING_MENU_IDS } from '@/ImageGenerationHelperV2/app/ids';
import { getImageGenerationStore } from '@/ImageGenerationHelperV2/config/store';
import type { TaskGroup, TaskProjection } from '@/ImageGenerationHelperV2/features/tasking/task-projection';
import { getTaskGroupProgress, getTaskStatusLabel, pickFocusGroup } from '@/ImageGenerationHelperV2/features/tasking/task-progress';
import '@/ImageGenerationHelperV2/features/floating-menu/view.css';

const ROOT_ID = FLOATING_MENU_IDS.root;
const MENU_ID = FLOATING_MENU_IDS.menu;
const FLOATING_BUTTON_SIZE = 64;
const VIEWPORT_PADDING = 8;
const LEGACY_MOBILE_BREAKPOINT = 768;

type FloatingMenuOptions = {
  taskCenter: TaskProjection;
  onManualPromptGeneration: () => Promise<void> | void;
  onOpenSettings: () => void;
};

type Position = {
  x: number;
  y: number;
};

type PositionPercent = {
  xPercent: number;
  yPercent: number;
};

function getHostDocument() {
  try {
    return {
      doc: parent?.document ?? document,
      win: parent?.window ?? window,
    };
  } catch (_error) {
    return {
      doc: document,
      win: window,
    };
  }
}

function getPositionBounds(viewportWidth: number, viewportHeight: number) {
  const minX = VIEWPORT_PADDING;
  const minY = VIEWPORT_PADDING;
  const maxX = Math.max(minX, viewportWidth - FLOATING_BUTTON_SIZE);
  const maxY = Math.max(minY, viewportHeight - FLOATING_BUTTON_SIZE);

  return {
    minX,
    minY,
    maxX,
    maxY,
    rangeX: Math.max(0, maxX - minX),
    rangeY: Math.max(0, maxY - minY),
  };
}

function clampPosition(position: Position, viewportWidth: number, viewportHeight: number): Position {
  const bounds = getPositionBounds(viewportWidth, viewportHeight);
  return {
    x: Math.max(bounds.minX, Math.min(position.x, bounds.maxX)),
    y: Math.max(bounds.minY, Math.min(position.y, bounds.maxY)),
  };
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(value, 100));
}

function toPositionPercent(position: Position, viewportWidth: number, viewportHeight: number): PositionPercent {
  const bounds = getPositionBounds(viewportWidth, viewportHeight);
  const clamped = clampPosition(position, viewportWidth, viewportHeight);

  return {
    xPercent: bounds.rangeX <= 0 ? 100 : clampPercent(((clamped.x - bounds.minX) / bounds.rangeX) * 100),
    yPercent: bounds.rangeY <= 0 ? 100 : clampPercent(((clamped.y - bounds.minY) / bounds.rangeY) * 100),
  };
}

function fromPositionPercent(position: PositionPercent, viewportWidth: number, viewportHeight: number): Position {
  const bounds = getPositionBounds(viewportWidth, viewportHeight);

  return clampPosition(
    {
      x: bounds.minX + bounds.rangeX * (clampPercent(position.xPercent) / 100),
      y: bounds.minY + bounds.rangeY * (clampPercent(position.yPercent) / 100),
    },
    viewportWidth,
    viewportHeight,
  );
}

function getDefaultPosition(win: Window): Position {
  const isMobile = win.innerWidth <= LEGACY_MOBILE_BREAKPOINT;
  const top = isMobile ? win.innerHeight - FLOATING_BUTTON_SIZE - 88 : Math.floor(win.innerHeight * 0.45);

  return clampPosition(
    {
      x: win.innerWidth - 76,
      y: top,
    },
    win.innerWidth,
    win.innerHeight,
  );
}

function isValidPositionPercent(value: unknown): value is PositionPercent {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as PositionPercent).xPercent === 'number' &&
    typeof (value as PositionPercent).yPercent === 'number'
  );
}

function loadSavedPosition(win: Window): Position {
  try {
    const floatingMenuConfig = getImageGenerationStore().config.ui.floatingMenu;

    if (isValidPositionPercent(floatingMenuConfig.position)) {
      return fromPositionPercent(floatingMenuConfig.position, win.innerWidth, win.innerHeight);
    }
  } catch (_error) {
    return getDefaultPosition(win);
  }

  return getDefaultPosition(win);
}

function savePosition(win: Window, position: Position) {
  try {
    getImageGenerationStore().updateConfig(draft => {
      draft.ui.floatingMenu.position = toPositionPercent(position, win.innerWidth, win.innerHeight);
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
  const { doc, win } = getHostDocument();
  const { destroy: destroyTeleportedStyle } = teleportStyle();

  [ROOT_ID, MENU_ID]
    .map(id => doc.getElementById(id))
    .filter((node): node is HTMLElement => Boolean(node))
    .forEach(node => node.remove());

  const root = doc.createElement('div');
  root.id = ROOT_ID;
  root.className = 'imggen-float-root is-idle';

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

  const menu = doc.createElement('aside');
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
  mountPoint.append(root, menu);

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

  let position = loadSavedPosition(win);
  root.style.left = `${position.x}px`;
  root.style.top = `${position.y}px`;

  let isOpen = false;
  let isManualPending = false;
  let focusGroup: TaskGroup | undefined;

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

  const moveTo = (nextPosition: Position) => {
    position = clampPosition(nextPosition, win.innerWidth, win.innerHeight);
    root.style.left = `${position.x}px`;
    root.style.top = `${position.y}px`;
    if (isOpen) {
      placeMenu();
    }
  };

  let dragging = false;
  let dragMoved = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let suppressNextClick = false;

  const beginDrag = (clientX: number, clientY: number) => {
    const rect = root.getBoundingClientRect();
    dragging = true;
    dragMoved = false;
    dragStartX = clientX;
    dragStartY = clientY;
    dragOffsetX = clientX - rect.left;
    dragOffsetY = clientY - rect.top;
    root.classList.add('is-dragging');
  };

  const updateDrag = (clientX: number, clientY: number) => {
    if (!dragging) {
      return;
    }

    if (Math.abs(clientX - dragStartX) > 4 || Math.abs(clientY - dragStartY) > 4) {
      dragMoved = true;
    }

    moveTo({
      x: clientX - dragOffsetX,
      y: clientY - dragOffsetY,
    });
  };

  const endDrag = () => {
    if (!dragging) {
      return;
    }

    dragging = false;
    root.classList.remove('is-dragging');
    if (dragMoved) {
      savePosition(win, position);
    }
  };

  const onMouseDown = (event: MouseEvent) => {
    beginDrag(event.clientX, event.clientY);
    event.preventDefault();
  };

  const onMouseMove = (event: MouseEvent) => {
    updateDrag(event.clientX, event.clientY);
  };

  const onMouseUp = () => {
    endDrag();
  };

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    beginDrag(touch.clientX, touch.clientY);
  };

  const onTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    updateDrag(touch.clientX, touch.clientY);
  };

  const onTouchEnd = (event: TouchEvent) => {
    const moved = dragMoved;
    endDrag();
    if (!moved) {
      toggleOpen();
    }
    suppressNextClick = true;
    event.preventDefault();
  };

  const onTriggerClick = (event: MouseEvent) => {
    event.preventDefault();

    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }

    if (dragMoved) {
      dragMoved = false;
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

  const onResize = () => {
    moveTo(loadSavedPosition(win));
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

  trigger.addEventListener('mousedown', onMouseDown);
  doc.addEventListener('mousemove', onMouseMove);
  doc.addEventListener('mouseup', onMouseUp);
  trigger.addEventListener('click', onTriggerClick);
  trigger.addEventListener('touchstart', onTouchStart, { passive: true });
  trigger.addEventListener('touchmove', onTouchMove, { passive: true });
  trigger.addEventListener('touchend', onTouchEnd, { passive: false });
  doc.addEventListener('pointerdown', onDocumentPointerDown, true);
  win.addEventListener('resize', onResize);
  manualButton.addEventListener('click', onManualClick);
  settingsButton.addEventListener('click', onSettingsClick);
  cancelButton.addEventListener('click', onCancelClick);

  syncActionButtons();

  return {
    destroy: () => {
      unsubscribe();
      trigger.removeEventListener('mousedown', onMouseDown);
      doc.removeEventListener('mousemove', onMouseMove);
      doc.removeEventListener('mouseup', onMouseUp);
      trigger.removeEventListener('click', onTriggerClick);
      trigger.removeEventListener('touchstart', onTouchStart);
      trigger.removeEventListener('touchmove', onTouchMove);
      trigger.removeEventListener('touchend', onTouchEnd);
      doc.removeEventListener('pointerdown', onDocumentPointerDown, true);
      win.removeEventListener('resize', onResize);
      manualButton.removeEventListener('click', onManualClick);
      settingsButton.removeEventListener('click', onSettingsClick);
      cancelButton.removeEventListener('click', onCancelClick);
      root.remove();
      menu.remove();
      destroyTeleportedStyle();
    },
  };
}
