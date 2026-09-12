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

export type FloatingViewport = {
  viewportWidth: number;
  viewportHeight: number;
  width: number;
  height: number;
  padding?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function getFloatingBounds(options: FloatingViewport) {
  const { viewportWidth, viewportHeight, width, height, padding = 8 } = options;

  const minX = padding;
  const minY = padding;
  const maxX = Math.max(minX, viewportWidth - width - padding);
  const maxY = Math.max(minY, viewportHeight - height - padding);

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
export function clampFloatingPosition(position: FloatingPosition, options: FloatingViewport): FloatingPosition {
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
  options: FloatingViewport,
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
  options: FloatingViewport,
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
