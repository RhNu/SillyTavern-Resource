export type StoryBlock = { text: string; anchorId: string; sourceEnd: number };
export type StoryLayout = { blocks: StoryBlock[] };

export function planStoryLayout(
  raw: string,
  fragments: Array<{ start: number; end: number; text: string }>,
): StoryLayout {
  const lines = fragments
    .filter(fragment => fragment.text.trim() && fragment.start >= 0 && fragment.end <= raw.length)
    .sort((left, right) => left.start - right.start || left.end - right.end);
  return {
    blocks: lines.map((line, index) => ({ text: line.text, sourceEnd: line.end, anchorId: `A${index + 1}` })),
  };
}

export function renderStoryLayout(layout: StoryLayout): string {
  return layout.blocks.map(block => `${block.text}\n\n[插图锚点 ${block.anchorId}]`).join('\n\n');
}
