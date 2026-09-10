type TextSegment = {
  node: Text;
  start: number;
  end: number;
  text: string;
};

/** SillyTavern 的 Markdown 渲染可能把普通空格转换成 NBSP。 */
export function normalizeRenderedText(value: string): string {
  return value.replace(/\u00a0/g, ' ');
}

function findExactAnchorElement(root: HTMLElement, anchor: string, cardSelector: string): HTMLElement | undefined {
  const normalizedAnchor = normalizeRenderedText(anchor).trim();
  const candidates = [...root.querySelectorAll<HTMLElement>('*')].filter(element => {
    if (element.closest(cardSelector)) return false;
    return normalizeRenderedText(element.textContent ?? '').trim() === normalizedAnchor;
  });

  // 优先替换最深层的独立容器，避免把锚点所在段落之外的消息内容一并删除。
  return candidates.sort((left, right) => elementDepth(right) - elementDepth(left))[0];
}

function elementDepth(element: HTMLElement): number {
  let depth = 0;
  let current: HTMLElement | null = element;
  while (current) {
    depth += 1;
    current = current.parentElement;
  }
  return depth;
}

function collectTextSegments(root: HTMLElement, cardSelector: string): { content: string; segments: TextSegment[] } {
  const nodeFilter = root.ownerDocument.defaultView?.NodeFilter ?? NodeFilter;
  const segments: TextSegment[] = [];
  let content = '';
  const walker = root.ownerDocument.createTreeWalker(root, nodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      const parent = node.parentElement;
      if (!parent || parent.closest(cardSelector)) return nodeFilter.FILTER_REJECT;
      return normalizeRenderedText(node.nodeValue ?? '') ? nodeFilter.FILTER_ACCEPT : nodeFilter.FILTER_SKIP;
    },
  });

  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    const text = normalizeRenderedText(node.nodeValue ?? '');
    segments.push({ node, start: content.length, end: content.length + text.length, text });
    content += text;
    current = walker.nextNode();
  }
  return { content, segments };
}

function resolveBoundary(segments: TextSegment[], index: number): { node: Text; offset: number } | undefined {
  for (const segment of segments) {
    if (index < segment.start || index > segment.end) continue;
    return {
      node: segment.node,
      offset: Math.max(0, Math.min(segment.text.length, index - segment.start)),
    };
  }
  return undefined;
}

function findAnchorRange(root: HTMLElement, anchor: string, cardSelector: string): Range | undefined {
  const normalizedAnchor = normalizeRenderedText(anchor);
  const { content, segments } = collectTextSegments(root, cardSelector);
  const startIndex = content.indexOf(normalizedAnchor);
  if (startIndex < 0) return undefined;

  const start = resolveBoundary(segments, startIndex);
  const end = resolveBoundary(segments, startIndex + normalizedAnchor.length);
  if (!start || !end) return undefined;

  const range = root.ownerDocument.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  return range;
}

/**
 * 用卡片替换已格式化消息里的锚点。
 *
 * 锚点可能是独立的 `<p>`，也可能被 Markdown/酒馆正则拆到多个文本节点中，
 * 所以不能依赖单个 Text.nodeValue 完整包含原始标记。
 */
export function replaceRenderedAnchor(
  root: HTMLElement,
  anchor: string,
  card: HTMLElement,
  cardSelector: string,
): boolean {
  const exactElement = findExactAnchorElement(root, anchor, cardSelector);
  if (exactElement) {
    exactElement.replaceWith(card);
    return true;
  }

  const range = findAnchorRange(root, anchor, cardSelector);
  if (!range) return false;
  range.deleteContents();
  range.insertNode(card);
  return true;
}

export function renderedTextContains(root: HTMLElement, value: string): boolean {
  return normalizeRenderedText(root.textContent ?? '').includes(normalizeRenderedText(value));
}

export function previewRenderedText(root: HTMLElement): string {
  const preview = normalizeRenderedText(root.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  return preview.length > 160 ? `${preview.slice(0, 160)}...` : preview;
}
