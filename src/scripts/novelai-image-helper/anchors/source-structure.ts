export type SourceSpan = { start: number; end: number; unclosed?: boolean };

export function collectProtectedSourceSpans(raw: string): SourceSpan[] {
  const spans: SourceSpan[] = [];
  const stack: Array<{ name: string; start: number }> = [];
  const voidTags = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ]);
  // Include unclosed fences through EOF. Their content is opaque, including apparent HTML tags.
  for (const match of raw.matchAll(/^ {0,3}(`{3,}|~{3,})[^\r\n]*(?:\r?\n|$)/gm)) {
    if (spans.some(span => match.index >= span.start && match.index < span.end)) continue;
    const closing = new RegExp(`^ {0,3}${match[1]![0]}{${match[1]!.length},}[ \\t]*(?:\\r?\\n|$)`, 'gm');
    closing.lastIndex = match.index + match[0].length;
    const end = closing.exec(raw);
    spans.push({ start: match.index, end: end ? end.index + end[0].trimEnd().length : raw.length, unclosed: !end });
  }
  for (const match of raw.matchAll(/<!--[\s\S]*?(?:-->|$)|<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
    if (spans.some(span => match.index >= span.start && match.index < span.end)) continue;
    if (!match[1]) {
      spans.push({ start: match.index, end: match.index + match[0].length, unclosed: !match[0].endsWith('-->') });
      continue;
    }
    const name = match[1].toLowerCase();
    if (match[0].startsWith('</')) {
      const index = stack.findLastIndex(tag => tag.name === name);
      if (index >= 0) {
        spans.push({ start: stack[index]!.start, end: match.index + match[0].length });
        stack.splice(index);
      }
    } else if (!voidTags.has(name) && !match[0].endsWith('/>')) stack.push({ name, start: match.index });
  }
  stack.forEach(tag => spans.push({ start: tag.start, end: raw.length, unclosed: true }));
  // Keep lists (including blank-separated items/indented continuations), quotes and tables intact.
  const lines = [...raw.matchAll(/[^\n]*(?:\n|$)/g)].filter(match => match[0]);
  for (let i = 0; i < lines.length; i += 1) {
    const first = lines[i]!;
    const isContainerLine = (line: string) => /^\s*(?:[-+*] |\d+[.)] |>\s?)|^(?: {2,}|\t)/.test(line);
    const isTable = /\|/.test(first[0]);
    if (!isContainerLine(first[0]) && !isTable) continue;
    let last = i;
    let afterBlank = false;
    for (let j = i + 1; j < lines.length; j += 1) {
      const line = lines[j]![0];
      if (!line.trim()) {
        afterBlank = true;
        continue;
      }
      if (isTable ? !/\|/.test(line) : afterBlank && !isContainerLine(line)) break;
      // Unindented lazy continuation lines still belong to the current Markdown list/quote.
      last = j;
      afterBlank = false;
    }
    spans.push({ start: first.index, end: lines[last]!.index + lines[last]![0].trimEnd().length });
    i = last;
  }
  return spans;
}
