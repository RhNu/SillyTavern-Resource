import { IMAGE_GEN_REF_NAME } from './constants';
import { logWarn } from './log';

const MEDIA_URL_REGEX = /(https?:\/\/|\/|output\/)[^\s"'<>]+?\.(png|jpg|jpeg|webp|gif)(?:[?#][^\s"'<>]+)?/gi;
const IMAGE_GEN_REF_REGEX_SOURCE = String.raw`\[\[${escapeRegExp(IMAGE_GEN_REF_NAME)}\s+id=(?:"([^"\]]+)"|'([^'\]]+)')\s*\]\]`;
const XML_COMMENT_REGEX = /<!--[\s\S]*?-->/g;

export type ImgGenRefMatch = {
  id: string;
  refIndex: number;
  index: number;
  fullMatch: string;
};

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function escapeSlashArg(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}

export function escapeSlashPipe(value: string): string {
  return value.replace(/\\?\|/g, '\\|');
}

export function extractMediaUrls(value: string): string[] {
  return (value.match(MEDIA_URL_REGEX) ?? []).map(url => url.trim());
}

export function stripXmlComments(value: string): string {
  return value.replace(XML_COMMENT_REGEX, '');
}

export function buildImgGenRef(id: string): string {
  return `[[${IMAGE_GEN_REF_NAME} id="${id.trim()}"]]`;
}

function buildImgGenRefRegex(flags = 'g'): RegExp {
  return new RegExp(IMAGE_GEN_REF_REGEX_SOURCE, flags);
}

export function buildImgGenRefRegexString(): string {
  return `/${IMAGE_GEN_REF_REGEX_SOURCE}/gsi`;
}

export function buildImgGenRefFilterRegexString(): string {
  return buildImgGenRefRegexString();
}

export function hasImgGenRefs(text: string): boolean {
  return buildImgGenRefRegex('i').test(text);
}

export function matchImgGenRefs(text: string): ImgGenRefMatch[] {
  const matches = [...text.matchAll(buildImgGenRefRegex('gi'))];
  return matches
    .map((match, refIndex) => {
      const id = (match[1] ?? match[2] ?? '').trim();
      if (!id) {
        return undefined;
      }

      return {
        id,
        refIndex,
        index: match.index ?? 0,
        fullMatch: match[0],
      };
    })
    .filter((match): match is ImgGenRefMatch => Boolean(match));
}

export function stripImgGenBlocks(text: string): string {
  return text
    .replace(buildImgGenRefRegex('gi'), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

type FilterRule =
  | { kind: 'block'; pattern: RegExp }
  | { kind: 'before'; marker: RegExp }
  | { kind: 'after'; marker: RegExp }
  | { kind: 'pair'; pattern: RegExp }
  | { kind: 'text'; value: string };

function warnInvalidFilterRule(rule: string, reason: string) {
  logWarn(`忽略无效过滤规则 "${rule}": ${reason}`);
}

function createHtmlBlockRegex(tagName: string): RegExp {
  const escapedTag = escapeRegExp(tagName);
  return new RegExp(`<${escapedTag}(?=[\\s>])[^>]*>[\\s\\S]*?<\\/${escapedTag}\\s*>`, 'gi');
}

function createHtmlStartRegex(tagName: string): RegExp {
  const escapedTag = escapeRegExp(tagName);
  return new RegExp(`<${escapedTag}(?=[\\s>])[^>]*>`, 'i');
}

function createHtmlEndRegex(tagName: string): RegExp {
  return new RegExp(`<\\/${escapeRegExp(tagName)}\\s*>`, 'i');
}

function createBracketBlockRegex(tagName: string): RegExp {
  const escapedTag = escapeRegExp(tagName);
  return new RegExp(`\\[${escapedTag}\\][\\s\\S]*?\\[\\/${escapedTag}\\]`, 'gi');
}

function createBracketStartRegex(tagName: string): RegExp {
  return new RegExp(`\\[${escapeRegExp(tagName)}\\]`, 'i');
}

function createBracketEndRegex(tagName: string): RegExp {
  return new RegExp(`\\[\\/${escapeRegExp(tagName)}\\]`, 'i');
}

function parseBlockRule(value: string): FilterRule | undefined {
  const htmlMatch = value.match(/^<([^\s/>]+)>$/);
  if (htmlMatch) {
    return {
      kind: 'block',
      pattern: createHtmlBlockRegex(htmlMatch[1]),
    };
  }

  const bracketMatch = value.match(/^\[([^\]/]+)\]$/);
  if (bracketMatch && !bracketMatch[1]?.startsWith('/')) {
    return {
      kind: 'block',
      pattern: createBracketBlockRegex(bracketMatch[1]),
    };
  }

  return undefined;
}

function parseBeforeRule(value: string): FilterRule | undefined {
  const htmlMatch = value.match(/^<\/([^\s>]+)>$/);
  if (htmlMatch) {
    return {
      kind: 'before',
      marker: createHtmlEndRegex(htmlMatch[1]),
    };
  }

  const bracketMatch = value.match(/^\[\/([^\]]+)\]$/);
  if (bracketMatch) {
    return {
      kind: 'before',
      marker: createBracketEndRegex(bracketMatch[1]),
    };
  }

  return undefined;
}

function parseAfterRule(value: string): FilterRule | undefined {
  const htmlMatch = value.match(/^<([^\s/>]+)>$/);
  if (htmlMatch) {
    return {
      kind: 'after',
      marker: createHtmlStartRegex(htmlMatch[1]),
    };
  }

  const bracketMatch = value.match(/^\[([^\]/]+)\]$/);
  if (bracketMatch && !bracketMatch[1]?.startsWith('/')) {
    return {
      kind: 'after',
      marker: createBracketStartRegex(bracketMatch[1]),
    };
  }

  return undefined;
}

function parsePairRule(value: string): FilterRule | undefined {
  const separatorIndex = value.indexOf('|');
  if (separatorIndex <= 0 || separatorIndex >= value.length - 1) {
    return undefined;
  }

  const prefix = value.slice(0, separatorIndex).trim();
  const suffix = value.slice(separatorIndex + 1).trim();
  if (!prefix || !suffix) {
    return undefined;
  }

  return {
    kind: 'pair',
    pattern: new RegExp(`${escapeRegExp(prefix)}[\\s\\S]*?${escapeRegExp(suffix)}`, 'gi'),
  };
}

function parseTextRule(value: string): FilterRule | undefined {
  const literal = value.trim();
  if (!literal) {
    return undefined;
  }

  return {
    kind: 'text',
    value: literal,
  };
}

function parseFilterRule(rule: string): FilterRule | undefined {
  const separatorIndex = rule.indexOf(':');
  if (separatorIndex <= 0) {
    warnInvalidFilterRule(rule, '缺少规则类型前缀，请使用 block/before/after/pair/text');
    return undefined;
  }

  const kind = rule.slice(0, separatorIndex).trim().toLowerCase();
  const value = rule.slice(separatorIndex + 1).trim();

  if (!value) {
    warnInvalidFilterRule(rule, '规则内容不能为空');
    return undefined;
  }

  let parsed: FilterRule | undefined;

  switch (kind) {
    case 'block':
      parsed = parseBlockRule(value);
      break;
    case 'before':
      parsed = parseBeforeRule(value);
      break;
    case 'after':
      parsed = parseAfterRule(value);
      break;
    case 'pair':
      parsed = parsePairRule(value);
      break;
    case 'text':
      parsed = parseTextRule(value);
      break;
    default:
      warnInvalidFilterRule(rule, '不支持的规则类型');
      return undefined;
  }

  if (!parsed) {
    warnInvalidFilterRule(rule, '规则格式不正确');
  }

  return parsed;
}

function normalizeFilteredText(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

export function applyExtractTags(text: string, extractTags: string): string {
  if (!extractTags.trim()) {
    return text;
  }

  const tags = extractTags
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
  const parts: string[] = [];

  for (const tag of tags) {
    let regex: RegExp | undefined;

    if (tag.includes('|')) {
      const [prefix, suffix] = tag.split('|');
      if (prefix && suffix) {
        regex = new RegExp(`${escapeRegExp(prefix)}([\\s\\S]*?)${escapeRegExp(suffix)}`, 'gi');
      }
    } else if (tag.startsWith('<') && tag.endsWith('>')) {
      const tagName = tag.slice(1, -1);
      regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
    } else if (tag.startsWith('[') && tag.endsWith(']')) {
      const tagName = tag.slice(1, -1);
      regex = new RegExp(`\\[${escapeRegExp(tagName)}\\]([\\s\\S]*?)\\[\\/${escapeRegExp(tagName)}\\]`, 'gi');
    }

    if (!regex) {
      continue;
    }

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match[1]?.trim()) {
        parts.push(match[1].trim());
      }
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : text;
}

export function applyFilterTags(text: string, filterTags: string): string {
  if (!filterTags.trim()) {
    return text;
  }

  const rules = filterTags
    .split(/\r?\n/)
    .map(rule => rule.trim())
    .filter(Boolean)
    .map(parseFilterRule)
    .filter((rule): rule is FilterRule => Boolean(rule));

  if (rules.length === 0) {
    return text;
  }

  return normalizeFilteredText(
    rules.reduce((result, rule) => {
      switch (rule.kind) {
        case 'block':
        case 'pair':
          return result.replace(rule.pattern, '');
        case 'before': {
          const match = rule.marker.exec(result);
          if (!match || typeof match.index !== 'number') {
            return result;
          }

          return result.slice(match.index + match[0].length);
        }
        case 'after': {
          const match = rule.marker.exec(result);
          if (!match || typeof match.index !== 'number') {
            return result;
          }

          return result.slice(0, match.index);
        }
        case 'text':
          return result.replaceAll(rule.value, '');
        default:
          return result;
      }
    }, text),
  );
}
