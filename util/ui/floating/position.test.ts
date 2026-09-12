import { describe, expect, test } from 'vitest';
import { clampFloatingPosition, fromFloatingPercentPosition, toFloatingPercentPosition } from './position';

const viewport = { viewportWidth: 1000, viewportHeight: 800, width: 200, height: 100, padding: 10 };

describe('floating position persistence', () => {
  test('clamps absolute and restored positions to the usable viewport', () => {
    expect(clampFloatingPosition({ x: -50, y: 900 }, viewport)).toEqual({ x: 10, y: 690 });
    expect(fromFloatingPercentPosition({ xPercent: -20, yPercent: 150 }, viewport)).toEqual({ x: 10, y: 690 });
  });

  test('restores relative position after viewport or surface size changes', () => {
    const saved = toFloatingPercentPosition({ x: 400, y: 350 }, viewport);
    expect(saved).toEqual({ xPercent: 50, yPercent: 50 });
    expect(fromFloatingPercentPosition(saved, viewport)).toEqual({ x: 400, y: 350 });
    expect(fromFloatingPercentPosition(saved, { ...viewport, viewportWidth: 600, height: 300 })).toEqual({
      x: 200,
      y: 250,
    });
  });

  test('preserves a finite edge position when the surface is larger than the viewport', () => {
    const smallViewport = { ...viewport, viewportWidth: 100, viewportHeight: 50 };
    const saved = toFloatingPercentPosition({ x: 400, y: 350 }, smallViewport);
    expect(saved).toEqual({ xPercent: 100, yPercent: 100 });
    expect(fromFloatingPercentPosition(saved, smallViewport)).toEqual({ x: 10, y: 10 });
    expect(fromFloatingPercentPosition(saved, viewport)).toEqual({ x: 790, y: 690 });
  });
});
