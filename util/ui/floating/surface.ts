import {
  clampFloatingPosition,
  fromFloatingPercentPosition,
  toFloatingPercentPosition,
  type FloatingPosition,
  type FloatingPercentPosition,
  type FloatingViewport,
} from './position';
import { getHostDomContext } from '@util/st/dom/host';
import { createScriptIdDiv } from '@util/tavern-helper/script/host';

type FloatingContext = {
  doc: Document;
  win: Window;
  root: HTMLElement;
};

type DragCallbackMeta = {
  persist: boolean;
};

export type MountDraggableFloatingSurfaceOptions = {
  doc?: Document;
  win?: Window;
  root?: HTMLElement;
  rootId?: string;
  className?: string;
  attributes?: Record<string, string>;
  mountTarget?: HTMLElement;
  padding?: number;
  fallbackWidth?: number;
  fallbackHeight?: number;
  dragHandle?: string | HTMLElement;
  ignoreDragWithin?: string;
  draggingClassName?: string;
  loadPosition?: (context: FloatingContext) => FloatingPosition | FloatingPercentPosition | null | undefined;
  getDefaultPosition?: (context: FloatingContext) => FloatingPosition;
  savePosition?: (percent: FloatingPercentPosition, absolute: FloatingPosition, context: FloatingContext) => void;
  onMove?: (absolute: FloatingPosition, context: FloatingContext, meta: DragCallbackMeta) => void;
  onDragStateChange?: (dragging: boolean, context: FloatingContext) => void;
};

export type MountedDraggableFloatingSurface = {
  doc: Document;
  win: Window;
  root: HTMLElement;
  moveTo: (position: FloatingPosition, persist?: boolean) => FloatingPosition;
  recalculatePosition: (persist?: boolean) => FloatingPosition;
  getPosition: () => FloatingPosition;
  getRect: () => DOMRect;
  consumeClickSuppression: () => boolean;
  destroy: () => void;
};

function isFloatingPercentPosition(value: unknown): value is FloatingPercentPosition {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as FloatingPercentPosition).xPercent === 'number' &&
    typeof (value as FloatingPercentPosition).yPercent === 'number'
  );
}

function matchesDragHandle(target: HTMLElement | null, root: HTMLElement, dragHandle?: string | HTMLElement) {
  if (!target) {
    return false;
  }

  if (!dragHandle) {
    return root.contains(target);
  }

  if (typeof dragHandle === 'string') {
    return Boolean(target.closest(dragHandle));
  }

  return dragHandle === target || dragHandle.contains(target);
}

/**
 * 挂载一个带共享拖拽和持久化行为的宿主文档浮层。
 *
 * 适用范围：
 * - 挂载到宿主文档中的固定定位浮窗/面板。
 * - 仅提供挂载、拖拽、视口限制、窗口缩放处理以及位置持久化钩子。
 *
 * 不适用范围：
 * - 不负责菜单对齐、业务状态或弹窗语义。
 * - 不替代 `tavern-helper/script/host` 中用于隔离渲染的 `createScriptIdIframe()`。
 */
export function mountDraggableFloatingSurface(
  options: MountDraggableFloatingSurfaceOptions = {},
): MountedDraggableFloatingSurface {
  const fallbackContext = getHostDomContext();
  const doc = options.doc ?? fallbackContext.doc;
  const win = options.win ?? fallbackContext.win;
  const mountTarget = options.mountTarget ?? doc.body ?? doc.documentElement;
  const draggingClassName = options.draggingClassName ?? 'is-dragging';

  const root =
    options.root ??
    (() => {
      const node = createScriptIdDiv()[0];
      if (!node) {
        throw new Error('悬浮挂件 root 初始化失败。');
      }
      return node;
    })();

  if (options.rootId) {
    root.id = options.rootId;
  }

  if (options.className) {
    root.className = options.className;
  }

  Object.entries(options.attributes ?? {}).forEach(([key, value]) => {
    root.setAttribute(key, value);
  });

  if (!root.isConnected) {
    mountTarget.append(root);
  }

  const context: FloatingContext = { doc, win, root };
  // Measure on each operation: resizing and content changes alter the available travel range.
  const measureViewport = (): FloatingViewport => ({
    viewportWidth: win.innerWidth,
    viewportHeight: win.innerHeight,
    width: root.offsetWidth || Math.round(root.getBoundingClientRect().width) || (options.fallbackWidth ?? 320),
    height: root.offsetHeight || Math.round(root.getBoundingClientRect().height) || (options.fallbackHeight ?? 160),
    padding: options.padding,
  });

  let destroyed = false;
  let currentPosition: FloatingPosition = { x: 0, y: 0 };
  let lastPercentPosition: FloatingPercentPosition | null = null;
  let suppressNextClick = false;
  let dragging = false;
  let dragMoved = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let dragStartX = 0;
  let dragStartY = 0;

  const emitPosition = (persist: boolean) => {
    options.onMove?.(currentPosition, context, { persist });
    if (!persist) {
      return;
    }

    const nextPercent = toFloatingPercentPosition(currentPosition, measureViewport());
    lastPercentPosition = nextPercent;
    options.savePosition?.(nextPercent, currentPosition, context);
  };

  const moveTo = (position: FloatingPosition, persist = false): FloatingPosition => {
    currentPosition = clampFloatingPosition(position, measureViewport());
    root.style.left = `${Math.round(currentPosition.x)}px`;
    root.style.top = `${Math.round(currentPosition.y)}px`;

    if (!lastPercentPosition) {
      lastPercentPosition = toFloatingPercentPosition(currentPosition, measureViewport());
    }

    emitPosition(persist);
    return currentPosition;
  };

  const resolveInitialPosition = (): FloatingPosition => {
    const loadedPosition = options.loadPosition?.(context);
    if (isFloatingPercentPosition(loadedPosition)) {
      lastPercentPosition = loadedPosition;
      return fromFloatingPercentPosition(loadedPosition, measureViewport());
    }

    if (loadedPosition) {
      const absolutePosition = clampFloatingPosition(loadedPosition, measureViewport());
      lastPercentPosition = toFloatingPercentPosition(absolutePosition, measureViewport());
      return absolutePosition;
    }

    const defaultPosition = options.getDefaultPosition?.(context) ?? {
      x: win.innerWidth - ((options.fallbackWidth ?? 320) + (options.padding ?? 8)),
      y: Math.max(options.padding ?? 8, Math.round(win.innerHeight * 0.2)),
    };
    const absolutePosition = clampFloatingPosition(defaultPosition, measureViewport());
    lastPercentPosition = toFloatingPercentPosition(absolutePosition, measureViewport());
    return absolutePosition;
  };

  const setDragging = (nextDragging: boolean) => {
    if (dragging === nextDragging) {
      return;
    }

    dragging = nextDragging;
    root.classList.toggle(draggingClassName, dragging);
    options.onDragStateChange?.(dragging, context);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) {
      return;
    }

    if (Math.abs(event.clientX - dragStartX) > 4 || Math.abs(event.clientY - dragStartY) > 4) {
      dragMoved = true;
    }

    moveTo(
      {
        x: event.clientX - dragOffsetX,
        y: event.clientY - dragOffsetY,
      },
      false,
    );
  };

  const stopDragging = () => {
    if (!dragging) {
      return;
    }

    const moved = dragMoved;
    setDragging(false);
    dragMoved = false;
    emitPosition(true);
    if (moved) {
      suppressNextClick = true;
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!matchesDragHandle(target, root, options.dragHandle)) {
      return;
    }

    if (options.ignoreDragWithin && target?.closest(options.ignoreDragWithin)) {
      return;
    }

    const rect = root.getBoundingClientRect();
    dragMoved = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    setDragging(true);
    event.preventDefault();
  };

  const onResize = () => {
    const nextPosition = lastPercentPosition
      ? fromFloatingPercentPosition(lastPercentPosition, measureViewport())
      : currentPosition;
    moveTo(nextPosition, true);
  };

  moveTo(resolveInitialPosition(), false);

  root.addEventListener('pointerdown', onPointerDown);
  doc.addEventListener('pointermove', onPointerMove);
  doc.addEventListener('pointerup', stopDragging);
  doc.addEventListener('pointercancel', stopDragging);
  win.addEventListener('resize', onResize);

  return {
    doc,
    win,
    root,
    moveTo,
    recalculatePosition(persist = true) {
      const nextPosition = lastPercentPosition
        ? fromFloatingPercentPosition(lastPercentPosition, measureViewport())
        : currentPosition;
      return moveTo(nextPosition, persist);
    },
    getPosition() {
      return currentPosition;
    },
    getRect() {
      return root.getBoundingClientRect();
    },
    consumeClickSuppression() {
      if (!suppressNextClick) {
        return false;
      }

      suppressNextClick = false;
      return true;
    },
    destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;
      root.removeEventListener('pointerdown', onPointerDown);
      doc.removeEventListener('pointermove', onPointerMove);
      doc.removeEventListener('pointerup', stopDragging);
      doc.removeEventListener('pointercancel', stopDragging);
      win.removeEventListener('resize', onResize);
      root.classList.remove(draggingClassName);
    },
  };
}
