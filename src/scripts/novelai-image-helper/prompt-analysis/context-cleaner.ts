import { ANCHOR_SOURCE } from '../domain/anchor';

export type ContextCleanupSettings = {
  extractRules: readonly string[];
  filterRules: readonly string[];
};

export type CleanupDiagnostic = {
  phase: 'extract' | 'filter';
  rule: string;
  message: string;
};

export type CleanContextResult = {
  text: string;
  diagnostics: CleanupDiagnostic[];
};

type Origin = { start: number; end: number };

type MappedText = {
  chars: string[];
  origins: Origin[];
};

type RegexRule = {
  kind: 'regex';
  pattern: RegExp;
  replacement?: string;
};

type FilterRule =
  | { kind: 'block' | 'pair'; pattern: RegExp }
  | { kind: 'before' | 'after'; marker: RegExp }
  | { kind: 'text'; value: string }
  | RegexRule;

type ExtractRule = { kind: 'capture'; pattern: RegExp } | RegexRule;

type MappedRange = {
  start: number;
  end: number;
};

const CODE_FENCE_REGEX = /^ {0,3}(`{3,}|~{3,})[^\r\n]*(?:\r?\n|$)[\s\S]*?(?:^ {0,3}\1[ \t]*$|(?![\s\S]))/gm;
const HTML_CODE_REGEX = /<code\b[^>]*>[\s\S]*?<\/code\s*>/gi;
const XML_COMMENT_REGEX = /<!--[\s\S]*?-->/g;
// Old chat messages may still contain the old anchor text. This is content cleanup, not settings migration.
const LEGACY_IMAGE_ANCHOR_REGEX = /\[\[ImageGenRef\s+id=(?:"[^"\]]+"|'[^'\]]+')\s*\]\]/gi;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function textOf(value: MappedText): string {
  return value.chars.join('');
}

function sliceMapped(value: MappedText, start: number, end: number): MappedText {
  return {
    chars: value.chars.slice(start, end),
    origins: value.origins.slice(start, end),
  };
}

function createMappedText(value: string): MappedText {
  return {
    chars: value.split(''),
    origins: value.split('').map((_char, index) => ({ start: index, end: index + 1 })),
  };
}

function originForRange(origins: readonly Origin[], start: number, end: number): Origin | undefined {
  if (start >= end) return undefined;
  const first = origins[start];
  if (!first) return undefined;
  let originStart = first.start;
  let originEnd = first.end;
  for (let index = start + 1; index < end; index += 1) {
    const origin = origins[index];
    if (!origin) continue;
    originStart = Math.min(originStart, origin.start);
    originEnd = Math.max(originEnd, origin.end);
  }
  return { start: originStart, end: originEnd };
}

function trimMapped(value: MappedText): MappedText {
  let start = 0;
  let end = value.chars.length;
  while (start < end && /\s/.test(value.chars[start]!)) start += 1;
  while (end > start && /\s/.test(value.chars[end - 1]!)) end -= 1;
  return sliceMapped(value, start, end);
}

function replaceMapped(value: MappedText, pattern: RegExp, replacement: string): MappedText {
  const source = textOf(value);
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  const chars: string[] = [];
  const origins: Origin[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    chars.push(...value.chars.slice(cursor, start));
    origins.push(...value.origins.slice(cursor, start));
    const replacementOrigin = originForRange(value.origins, start, end) ?? { start: 0, end: 0 };
    for (const char of replacement.split('')) {
      chars.push(char);
      origins.push(replacementOrigin);
    }
    cursor = end;
    if (match[0].length === 0) regex.lastIndex += 1;
  }

  chars.push(...value.chars.slice(cursor));
  origins.push(...value.origins.slice(cursor));
  return { chars, origins };
}

function normalizeMapped(value: MappedText): MappedText {
  return trimMapped(replaceMapped(value, /\n{3,}/g, '\n\n'));
}

function findRegexDelimiter(value: string): number {
  let escaped = false;
  let inCharacterClass = false;
  for (let index = 1; index < value.length; index += 1) {
    const char = value[index]!;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '[') {
      inCharacterClass = true;
      continue;
    }
    if (char === ']') {
      inCharacterClass = false;
      continue;
    }
    if (char === '/' && !inCharacterClass) return index;
  }
  return -1;
}

function parseRegexRule(value: string): RegexRule | undefined {
  if (!value.startsWith('regex:')) return undefined;
  const body = value.slice('regex:'.length).trimStart();
  if (!body.startsWith('/')) throw new Error('正则规则必须使用 regex:/pattern/flags 格式');

  const delimiter = findRegexDelimiter(body);
  if (delimiter < 0) throw new Error('正则规则缺少结束斜杠 /');
  const source = body.slice(1, delimiter);
  const rest = body.slice(delimiter + 1);
  const replacementSeparator = rest.indexOf('=>');
  const flags = (replacementSeparator < 0 ? rest : rest.slice(0, replacementSeparator)).trim();
  if (!/^[dgimsuvy]*$/.test(flags)) throw new Error(`正则 flags 无效：${flags}`);

  const replacement = replacementSeparator < 0 ? undefined : rest.slice(replacementSeparator + 2);
  const normalizedFlags = flags.includes('g') ? flags : `${flags}g`;
  let pattern: RegExp;
  try {
    pattern = new RegExp(source, normalizedFlags);
  } catch (error) {
    throw new Error(`正则表达式无效：${error instanceof Error ? error.message : String(error)}`);
  }
  if (pattern.test('')) throw new Error('正则不能匹配空字符串');
  pattern.lastIndex = 0;
  return { kind: 'regex', pattern, ...(replacement === undefined ? {} : { replacement }) };
}

function splitPair(value: string): [string, string] | undefined {
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]!;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '|') {
      const left = value.slice(0, index).trim().replaceAll('\\|', '|');
      const right = value
        .slice(index + 1)
        .trim()
        .replaceAll('\\|', '|');
      return left && right ? [left, right] : undefined;
    }
  }
  return undefined;
}

function createHtmlBlockRegex(tagName: string, capture: boolean): RegExp {
  const escaped = escapeRegExp(tagName);
  return new RegExp(`<${escaped}(?=[\\s>])[^>]*>${capture ? '([\\s\\S]*?)' : '[\\s\\S]*?'}<\\/${escaped}\\s*>`, 'gi');
}

function createBracketBlockRegex(tagName: string, capture: boolean): RegExp {
  const escaped = escapeRegExp(tagName);
  return new RegExp(`\\[${escaped}\\]${capture ? '([\\s\\S]*?)' : '[\\s\\S]*?'}\\[\\/${escaped}\\]`, 'gi');
}

function createPairRegex(prefix: string, suffix: string): RegExp {
  return new RegExp(`${escapeRegExp(prefix)}([\\s\\S]*?)${escapeRegExp(suffix)}`, 'gi');
}

function parseCaptureRule(rule: string): ExtractRule | undefined {
  const value = rule.trim();
  if (!value) return undefined;
  if (value.startsWith('regex:')) return parseRegexRule(value);

  const pair = splitPair(value.replace(/^pair:/i, '').trim());
  if (pair) return { kind: 'capture', pattern: createPairRegex(pair[0], pair[1]) };

  const htmlMatch = value.match(/^<([^\s/>]+)>$/);
  if (htmlMatch) return { kind: 'capture', pattern: createHtmlBlockRegex(htmlMatch[1]!, true) };
  const bracketMatch = value.match(/^\[([^\]/]+)\]$/);
  if (bracketMatch && !bracketMatch[1]!.startsWith('/')) {
    return { kind: 'capture', pattern: createBracketBlockRegex(bracketMatch[1]!, true) };
  }
  throw new Error('提取规则应为 <tag>、[tag]、prefix|suffix 或 regex:/pattern/flags');
}

function parseFilterRule(rule: string): FilterRule | undefined {
  const separator = rule.indexOf(':');
  if (separator <= 0) throw new Error('过滤规则缺少类型前缀 block/before/after/pair/text/regex');
  const kind = rule.slice(0, separator).trim().toLowerCase();
  const value = rule.slice(separator + 1).trim();
  if (!value) throw new Error('规则内容不能为空');
  if (kind === 'regex') return parseRegexRule(rule);

  if (kind === 'text') return { kind: 'text', value };
  if (kind === 'pair') {
    const pair = splitPair(value);
    if (!pair) throw new Error('pair 规则需要使用 prefix|suffix');
    return { kind: 'pair', pattern: createPairRegex(pair[0], pair[1]) };
  }
  if (kind === 'block' || kind === 'before' || kind === 'after') {
    const htmlMatch = value.match(/^<\/?([^\s/>]+)>$/);
    const bracketMatch = value.match(/^\[\/?([^\]/]+)\]$/);
    const isClosing = value.startsWith('</') || value.startsWith('[/');
    const tagName = htmlMatch?.[1] ?? bracketMatch?.[1];
    if (!tagName || (kind === 'before' && !isClosing) || (kind !== 'before' && isClosing)) {
      throw new Error(`${kind} 规则的标签格式不正确`);
    }
    const html = Boolean(htmlMatch);
    if (kind === 'block') {
      return {
        kind: 'block',
        pattern: html ? createHtmlBlockRegex(tagName, false) : createBracketBlockRegex(tagName, false),
      };
    }
    const escaped = escapeRegExp(tagName);
    const marker = html
      ? new RegExp(isClosing ? `<\\/${escaped}\\s*>` : `<${escaped}(?=[\\s>])[^>]*>`, 'i')
      : new RegExp(isClosing ? `\\[\\/${escaped}\\]` : `\\[${escaped}\\]`, 'i');
    return { kind, marker };
  }
  throw new Error(`不支持的过滤规则类型：${kind}`);
}

function activeRules(input: readonly string[], commaSeparated: boolean): string[] {
  return input
    .flatMap(rule =>
      rule.split(/\r?\n/).flatMap(line => {
        // Keep regex literals intact because commas are valid inside their pattern.
        if (commaSeparated && !line.trimStart().toLowerCase().startsWith('regex:')) return line.split(',');
        return [line];
      }),
    )
    .map(rule => rule.trimStart())
    .filter(rule => rule.trim().length > 0);
}

function compileRules(settings: ContextCleanupSettings): {
  extract: ExtractRule[];
  filter: FilterRule[];
  diagnostics: CleanupDiagnostic[];
} {
  const diagnostics: CleanupDiagnostic[] = [];
  const extract: ExtractRule[] = [];
  const filter: FilterRule[] = [];
  const compile = <T>(phase: CleanupDiagnostic['phase'], source: string, target: T[], parser: (value: string) => T) => {
    try {
      const rule = parser(source);
      if (rule) target.push(rule);
    } catch (error) {
      diagnostics.push({
        phase,
        rule: source,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };
  activeRules(settings.extractRules, true).forEach(rule => compile('extract', rule, extract, parseCaptureRule));
  activeRules(settings.filterRules, false).forEach(rule => compile('filter', rule, filter, parseFilterRule));
  return { extract, filter, diagnostics };
}

export function diagnoseCleanupRules(settings: ContextCleanupSettings): CleanupDiagnostic[] {
  return compileRules(settings).diagnostics;
}

function applyExtractRules(value: MappedText, rules: readonly ExtractRule[]): MappedText {
  if (rules.length === 0) return value;
  const parts: MappedText[] = [];
  const source = textOf(value);

  for (const rule of rules) {
    const regex = new RegExp(
      rule.pattern.source,
      rule.pattern.flags.includes('g') ? rule.pattern.flags : `${rule.pattern.flags}g`,
    );
    let match: RegExpExecArray | null;
    while ((match = regex.exec(source)) !== null) {
      const fullStart = match.index;
      const capture = match[1] === undefined ? match[0] : match[1];
      const localStart = match[1] === undefined ? 0 : Math.max(0, match[0].indexOf(match[1]));
      const captured = trimMapped(sliceMapped(value, fullStart + localStart, fullStart + localStart + capture.length));
      // Anchor after the complete source match, including the wrapper removed by extraction.
      const matchOrigin = originForRange(value.origins, fullStart, fullStart + match[0].length);
      const part = matchOrigin ? { ...captured, origins: captured.origins.map(() => matchOrigin) } : captured;
      if (textOf(part)) parts.push(part);
      if (match[0].length === 0) regex.lastIndex += 1;
    }
  }

  if (parts.length === 0) return value;
  const joined: MappedText = { chars: [], origins: [] };
  // Rules are selectors, not ordering instructions. Prefer outer captures and deduplicate overlaps.
  const selected = parts
    .sort((a, b) => a.origins[0]!.start - b.origins[0]!.start || b.origins[0]!.end - a.origins[0]!.end)
    .filter(
      (part, index, sorted) =>
        !sorted.slice(0, index).some(previous => previous.origins[0]!.end > part.origins[0]!.start),
    );
  selected.forEach((part, index) => {
    if (index > 0) {
      const previous = joined.origins.at(-1) ?? { start: 0, end: 0 };
      joined.chars.push('\n', '\n');
      joined.origins.push(previous, previous);
    }
    joined.chars.push(...part.chars);
    joined.origins.push(...part.origins);
  });
  return joined;
}

function applyFilterRules(value: MappedText, rules: readonly FilterRule[]): MappedText {
  return rules.reduce((current, rule) => {
    switch (rule.kind) {
      case 'block':
      case 'pair':
        return replaceMapped(current, rule.pattern, '');
      case 'regex':
        return replaceMapped(current, rule.pattern, rule.replacement ?? '');
      case 'text':
        return replaceMapped(current, new RegExp(escapeRegExp(rule.value), 'g'), '');
      case 'before': {
        const match = rule.marker.exec(textOf(current));
        return match && typeof match.index === 'number'
          ? sliceMapped(current, match.index + match[0].length, current.chars.length)
          : current;
      }
      case 'after': {
        const match = rule.marker.exec(textOf(current));
        return match && typeof match.index === 'number' ? sliceMapped(current, 0, match.index) : current;
      }
    }
  }, value);
}

function cleanMappedContext(
  raw: string,
  settings: ContextCleanupSettings,
): { mapped: MappedText; diagnostics: CleanupDiagnostic[] } {
  const compiled = compileRules(settings);
  let mapped = createMappedText(raw);
  mapped = replaceMapped(mapped, new RegExp(ANCHOR_SOURCE, 'gi'), '');
  mapped = replaceMapped(mapped, LEGACY_IMAGE_ANCHOR_REGEX, '');
  mapped = replaceMapped(mapped, XML_COMMENT_REGEX, '');
  mapped = applyExtractRules(mapped, compiled.extract);
  mapped = applyFilterRules(mapped, compiled.filter);
  mapped = replaceMapped(mapped, CODE_FENCE_REGEX, '[CODE_BLOCK]');
  mapped = replaceMapped(mapped, HTML_CODE_REGEX, '[CODE_BLOCK]');
  return { mapped: normalizeMapped(mapped), diagnostics: compiled.diagnostics };
}

export function cleanContextText(raw: string, settings: ContextCleanupSettings): CleanContextResult {
  const cleaned = cleanMappedContext(raw, settings);
  return { text: textOf(cleaned.mapped), diagnostics: cleaned.diagnostics };
}

function splitMappedRanges(value: MappedText, separator: RegExp): MappedRange[] {
  const source = textOf(value);
  const regex = new RegExp(separator.source, separator.flags.includes('g') ? separator.flags : `${separator.flags}g`);
  const ranges: MappedRange[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    ranges.push({ start: cursor, end: match.index });
    cursor = match.index + match[0].length;
    if (match[0].length === 0) regex.lastIndex += 1;
  }
  ranges.push({ start: cursor, end: value.chars.length });
  return ranges;
}

/** Cleaned fragments retain source ranges; choosing insertion boundaries belongs to story-layout. */
export function collectCleanedFragments(raw: string, settings: ContextCleanupSettings) {
  const cleaned = cleanMappedContext(raw, settings);
  const fragments = splitMappedRanges(cleaned.mapped, /\n+/g).flatMap(range => {
    const part = trimMapped(sliceMapped(cleaned.mapped, range.start, range.end));
    const text = textOf(part);
    const origin = originForRange(part.origins, 0, part.origins.length);
    return text && text !== '[CODE_BLOCK]' && origin ? [{ text, ...origin }] : [];
  });
  return { fragments, diagnostics: cleaned.diagnostics };
}
