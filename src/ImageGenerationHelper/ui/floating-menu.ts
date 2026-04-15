import { teleportStyle } from '@util/script';
import type { TaskCenter, TaskGroup } from '../core/task-center';
import { getTaskGroupProgress, getTaskStatusLabel, pickFocusGroup } from '../core/task-progress';
import './floating-menu.css';

const ROOT_ID = 'imggen-floating-menu';
const MENU_ID = `${ROOT_ID}-menu`;
const POSITION_VARIABLE_KEY = 'imggen_floating_menu_position';

type FloatingMenuOptions = {
  taskCenter: TaskCenter;
  onManualPromptGeneration: () => Promise<void> | void;
  onOpenSettings: () => void;
};

type Position = {
  x: number;
  y: number;
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

function clampPosition(position: Position, viewportWidth: number, viewportHeight: number): Position {
  return {
    x: Math.max(8, Math.min(position.x, viewportWidth - 64)),
    y: Math.max(8, Math.min(position.y, viewportHeight - 64)),
  };
}

function loadSavedPosition(win: Window): Position {
  const defaultPosition = {
    x: win.innerWidth - 76,
    y: Math.max(8, Math.floor(win.innerHeight * 0.45)),
  };

  try {
    const savedRaw = getVariables({ type: 'global' })?.[POSITION_VARIABLE_KEY];
    const saved = typeof savedRaw === 'string' ? (JSON.parse(savedRaw) as Partial<Position>) : undefined;
    if (!saved || typeof saved.x !== 'number' || typeof saved.y !== 'number') {
      return clampPosition(defaultPosition, win.innerWidth, win.innerHeight);
    }
    return clampPosition(saved as Position, win.innerWidth, win.innerHeight);
  } catch (_error) {
    return clampPosition(defaultPosition, win.innerWidth, win.innerHeight);
  }
}

function savePosition(position: Position) {
  try {
    insertOrAssignVariables(
      {
        [POSITION_VARIABLE_KEY]: JSON.stringify(position),
      },
      { type: 'global' },
    );
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
      savePosition(position);
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
    moveTo(position);
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
