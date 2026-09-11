export const ANCHOR_NAME = 'NovelAIImage';
export const ANCHOR_SOURCE = String.raw`\[\[${ANCHOR_NAME}\s+id=(?:"([^"\]]+)"|'([^'\]]+)')\s*\]\]`;

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
