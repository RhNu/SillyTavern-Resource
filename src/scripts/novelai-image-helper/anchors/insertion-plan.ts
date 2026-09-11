import { buildAnchor } from '../domain/anchor';
import type { StoryLayout } from './story-layout';

export function applyInsertionPlan(
  original: string,
  layout: StoryLayout,
  entries: Array<{ anchorId: string; imageId: string }>,
): string {
  const used = new Set<number>();
  const patches = entries.map(entry => {
    const block = layout.blocks.find(block => block.anchorId === entry.anchorId);
    if (!block) throw new Error(`图片锚点 ${entry.anchorId} 不存在`);
    if (!Number.isInteger(block.sourceEnd) || block.sourceEnd < 0 || block.sourceEnd > original.length)
      throw new Error('图片锚点不在原文范围内');
    if (used.has(block.sourceEnd)) throw new Error(`图片锚点 ${entry.anchorId} 重复`);
    used.add(block.sourceEnd);
    return { position: block.sourceEnd, text: `\n\n${buildAnchor(entry.imageId)}\n\n` };
  });
  return patches
    .sort((a, b) => b.position - a.position)
    .reduce((text, patch) => text.slice(0, patch.position) + patch.text + text.slice(patch.position), original);
}
