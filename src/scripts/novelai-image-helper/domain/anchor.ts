import type { PromptInsertion } from './prompt.ts';

export const ANCHOR_NAME = 'NovelAIImage';
const ANCHOR_SOURCE = String.raw`\[\[${ANCHOR_NAME}\s+id=(?:"([^"\]]+)"|'([^'\]]+)')\s*\]\]`;

export type StoryParagraph = {
  number: number;
  text: string;
  end: number;
};

export type AnchorMatch = {
  id: string;
  fullMatch: string;
};

export function buildAnchor(id: string): string {
  return `[[${ANCHOR_NAME} id="${id.trim()}"]]`;
}

export function matchAnchors(text: string): AnchorMatch[] {
  return [...text.matchAll(new RegExp(ANCHOR_SOURCE, 'gi'))]
    .map(match => ({ id: (match[1] ?? match[2] ?? '').trim(), fullMatch: match[0] }))
    .filter(match => Boolean(match.id));
}

export function stripAnchors(text: string): string {
  return text
    .replace(new RegExp(ANCHOR_SOURCE, 'gi'), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function collectStoryParagraphs(text: string, minimumLength: number): StoryParagraph[] {
  const paragraphs: StoryParagraph[] = [];
  const separator = /\n\s*\n/g;
  let start = 0;
  let match: RegExpExecArray | null;

  const push = (end: number) => {
    const raw = text.slice(start, end);
    const trimmed = raw.trim();
    if (trimmed.length >= minimumLength && !trimmed.startsWith('```')) {
      paragraphs.push({ number: paragraphs.length + 1, text: trimmed, end });
    }
  };

  while ((match = separator.exec(text)) !== null) {
    push(match.index);
    start = match.index + match[0].length;
  }
  push(text.length);
  return paragraphs;
}

export function insertAnchors(
  original: string,
  paragraphs: StoryParagraph[],
  entries: Array<{ insertion: PromptInsertion; blockId: string }>,
): string {
  const byPosition = new Map<number, string[]>();
  for (const entry of entries) {
    const paragraph = paragraphs[entry.insertion.after_paragraph - 1];
    if (!paragraph) {
      throw new Error(`提示词插入段落 P${entry.insertion.after_paragraph} 不存在`);
    }
    const anchors = byPosition.get(paragraph.end) ?? [];
    anchors.push(buildAnchor(entry.blockId));
    byPosition.set(paragraph.end, anchors);
  }

  let result = original;
  [...byPosition.entries()]
    .sort(([left], [right]) => right - left)
    .forEach(([position, anchors]) => {
      result = `${result.slice(0, position)}${anchors.map(anchor => `\n\n${anchor}`).join('')}${result.slice(position)}`;
    });
  return result;
}
