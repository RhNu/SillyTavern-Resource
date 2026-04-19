import { getHostDomContext } from '@util/host';
import { createScriptIdDiv } from '@util/script';

/**
 * 共享的浮动元素绝对位置。
 *
 * 适用范围：
 * - 用于挂载到宿主文档中的 `position: fixed` 浮层。
 *
 * 不适用范围：
 * - 不是用于任意布局计算的通用几何类型。
 */
export type FloatingPosition = {
  x: number;
  y: number;
};

/**
 * 共享的百分比浮动位置，按视口边界进行持久化。
 *
 * 适用范围：
 * - 用于宿主挂载浮层的位置持久化。
 */
export type FloatingPercentPosition = {
  xPercent: number;
  yPercent: number;
};

type FloatingMeasureOptions = {
  win: Window;
  element: HTMLElement;
  padding?: number;
  fallbackWidth?: number;
  fallbackHeight?: number;
};

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

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

function getFloatingBounds(options: FloatingMeasureOptions) {
  const { win, element, padding = 8, fallbackWidth = 320, fallbackHeight = 160 } = options;
  const width = element.offsetWidth || Math.round(element.getBoundingClientRect().width) || fallbackWidth;
  const height = element.offsetHeight || Math.round(element.getBoundingClientRect().height) || fallbackHeight;

  const minX = padding;
  const minY = padding;
  const maxX = Math.max(minX, win.innerWidth - width - padding);
  const maxY = Math.max(minY, win.innerHeight - height - padding);

  return {
    minX,
    minY,
    maxX,
    maxY,
    rangeX: Math.max(0, maxX - minX),
    rangeY: Math.max(0, maxY - minY),
  };
}

/**
 * 将浮层位置限制在视口内。
 *
 * 适用范围：
 * - 宿主文档中的固定定位浮层。
 */
export function clampFloatingPosition(position: FloatingPosition, options: FloatingMeasureOptions): FloatingPosition {
  const bounds = getFloatingBounds(options);
  return {
    x: clamp(position.x, bounds.minX, bounds.maxX),
    y: clamp(position.y, bounds.minY, bounds.maxY),
  };
}

/**
 * 将绝对浮动位置转换为可持久化的百分比位置。
 */
export function toFloatingPercentPosition(
  position: FloatingPosition,
  options: FloatingMeasureOptions,
): FloatingPercentPosition {
  const bounds = getFloatingBounds(options);
  const clampedPosition = clampFloatingPosition(position, options);

  return {
    xPercent: bounds.rangeX === 0 ? 100 : clamp(((clampedPosition.x - bounds.minX) / bounds.rangeX) * 100, 0, 100),
    yPercent: bounds.rangeY === 0 ? 100 : clamp(((clampedPosition.y - bounds.minY) / bounds.rangeY) * 100, 0, 100),
  };
}

/**
 * 根据已持久化的百分比位置恢复绝对浮动位置。
 */
export function fromFloatingPercentPosition(
  position: FloatingPercentPosition,
  options: FloatingMeasureOptions,
): FloatingPosition {
  const bounds = getFloatingBounds(options);
  return clampFloatingPosition(
    {
      x: bounds.minX + bounds.rangeX * (clamp(position.xPercent, 0, 100) / 100),
      y: bounds.minY + bounds.rangeY * (clamp(position.yPercent, 0, 100) / 100),
    },
    options,
  );
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
 * - 不替代用于隔离渲染的 `createScriptIdIframe()`。
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
  const measureOptions: FloatingMeasureOptions = {
    win,
    element: root,
    padding: options.padding,
    fallbackWidth: options.fallbackWidth,
    fallbackHeight: options.fallbackHeight,
  };

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

    const nextPercent = toFloatingPercentPosition(currentPosition, measureOptions);
    lastPercentPosition = nextPercent;
    options.savePosition?.(nextPercent, currentPosition, context);
  };

  const moveTo = (position: FloatingPosition, persist = false): FloatingPosition => {
    currentPosition = clampFloatingPosition(position, measureOptions);
    root.style.left = `${Math.round(currentPosition.x)}px`;
    root.style.top = `${Math.round(currentPosition.y)}px`;

    if (!lastPercentPosition) {
      lastPercentPosition = toFloatingPercentPosition(currentPosition, measureOptions);
    }

    emitPosition(persist);
    return currentPosition;
  };

  const resolveInitialPosition = (): FloatingPosition => {
    const loadedPosition = options.loadPosition?.(context);
    if (isFloatingPercentPosition(loadedPosition)) {
      lastPercentPosition = loadedPosition;
      return fromFloatingPercentPosition(loadedPosition, measureOptions);
    }

    if (loadedPosition) {
      const absolutePosition = clampFloatingPosition(loadedPosition, measureOptions);
      lastPercentPosition = toFloatingPercentPosition(absolutePosition, measureOptions);
      return absolutePosition;
    }

    const defaultPosition = options.getDefaultPosition?.(context) ?? {
      x: win.innerWidth - ((options.fallbackWidth ?? 320) + (options.padding ?? 8)),
      y: Math.max(options.padding ?? 8, Math.round(win.innerHeight * 0.2)),
    };
    const absolutePosition = clampFloatingPosition(defaultPosition, measureOptions);
    lastPercentPosition = toFloatingPercentPosition(absolutePosition, measureOptions);
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
      ? fromFloatingPercentPosition(lastPercentPosition, measureOptions)
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
        ? fromFloatingPercentPosition(lastPercentPosition, measureOptions)
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
