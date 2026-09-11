/** Source structure owns boundaries; model-facing cleanup must never invent one. */
import { collectProtectedSourceSpans, type SourceSpan } from './source-structure';

export type StoryBlock = { text: string; anchorId: string | null; sourceEnd: number };
export type StoryLayout = { blocks: StoryBlock[] };

export function planStoryLayout(raw: string, fragments: Array<SourceSpan & { text: string }>): StoryLayout {
  const protectedRanges = collectProtectedSourceSpans(raw);
  const boundaries: number[] = protectedRanges.map(span => span.end);
  // Blank lines define prose blocks. Plain single-line stories also get explicit boundaries,
  // without the former length-dependent fallback that changed numbering unpredictably.
  const separator = /\n\s*\n/.test(raw) ? /\n\s*\n/g : /\n/g;
  for (const match of raw.matchAll(separator)) boundaries.push(raw.slice(0, match.index).trimEnd().length);
  boundaries.push(raw.trimEnd().length);
  const safe = [
    ...new Set(
      boundaries.map(position => {
        let result = position;
        for (;;) {
          const containing = protectedRanges.filter(span => span.start < result && result < span.end);
          if (!containing.length) return result;
          result = Math.max(...containing.map(span => span.end));
        }
      }),
    ),
  ]
    .filter(position => !protectedRanges.some(span => span.unclosed && position > span.start))
    .sort((a, b) => a - b);
  const groups = new Map<number, string[]>();
  const seen = new Set<string>();
  for (const fragment of [...fragments].sort((a, b) => a.start - b.start || a.end - b.end)) {
    const key = JSON.stringify(fragment);
    if (seen.has(key)) continue;
    seen.add(key);
    const position = safe.find(boundary => boundary >= fragment.end) ?? raw.length + 1;
    const texts = groups.get(position) ?? [];
    texts.push(fragment.text);
    groups.set(position, texts);
  }
  let anchorNumber = 0;
  return {
    blocks: [...groups]
      .sort(([a], [b]) => a - b)
      .map(([sourceEnd, texts]) => ({
        text: texts.join('\n'),
        sourceEnd,
        anchorId: sourceEnd <= raw.length ? `A${++anchorNumber}` : null,
      })),
  };
}

export function renderStoryLayout(layout: StoryLayout): string {
  return layout.blocks
    .map(block => `${block.text}${block.anchorId ? `\n\n[插图锚点 ${block.anchorId}]` : ''}`)
    .join('\n\n');
}
