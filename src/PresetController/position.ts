import { DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_WIDTH, VIEWPORT_PADDING } from './constants';
import { type Position, type PositionPercent } from './schema';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function getBounds(win: Window, root: HTMLElement) {
  const width = root.offsetWidth || DEFAULT_PANEL_WIDTH;
  const height = root.offsetHeight || DEFAULT_PANEL_HEIGHT;

  const minX = VIEWPORT_PADDING;
  const minY = VIEWPORT_PADDING;
  const maxX = Math.max(minX, win.innerWidth - width - VIEWPORT_PADDING);
  const maxY = Math.max(minY, win.innerHeight - height - VIEWPORT_PADDING);

  return {
    minX,
    minY,
    maxX,
    maxY,
    rangeX: Math.max(0, maxX - minX),
    rangeY: Math.max(0, maxY - minY),
  };
}

export function clampPosition(position: Position, win: Window, root: HTMLElement): Position {
  const bounds = getBounds(win, root);
  return {
    x: clamp(position.x, bounds.minX, bounds.maxX),
    y: clamp(position.y, bounds.minY, bounds.maxY),
  };
}

export function toPercentPosition(position: Position, win: Window, root: HTMLElement): PositionPercent {
  const bounds = getBounds(win, root);
  const clamped = clampPosition(position, win, root);

  return {
    xPercent: bounds.rangeX === 0 ? 100 : clamp(((clamped.x - bounds.minX) / bounds.rangeX) * 100, 0, 100),
    yPercent: bounds.rangeY === 0 ? 100 : clamp(((clamped.y - bounds.minY) / bounds.rangeY) * 100, 0, 100),
  };
}

export function fromPercentPosition(percent: PositionPercent, win: Window, root: HTMLElement): Position {
  const bounds = getBounds(win, root);
  return clampPosition(
    {
      x: bounds.minX + bounds.rangeX * (clamp(percent.xPercent, 0, 100) / 100),
      y: bounds.minY + bounds.rangeY * (clamp(percent.yPercent, 0, 100) / 100),
    },
    win,
    root,
  );
}

export function getDefaultPosition(win: Window, root: HTMLElement): Position {
  const width = root.offsetWidth || DEFAULT_PANEL_WIDTH;
  return clampPosition(
    {
      x: win.innerWidth - width - 18,
      y: Math.max(64, Math.round(win.innerHeight * 0.18)),
    },
    win,
    root,
  );
}
