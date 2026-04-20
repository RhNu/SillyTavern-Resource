import { IMAGE_GEN_REF_NAME } from '@/ImgGenHelper/app/ids';

const IMAGE_GEN_REF_REGEX_SOURCE = String.raw`\[\[${IMAGE_GEN_REF_NAME}\s+id=(?:"([^"\]]+)"|'([^'\]]+)')\s*\]\]`;

export type ImgGenRefMatch = {
  id: string;
  refIndex: number;
  index: number;
  fullMatch: string;
};

function buildImgGenRefRegex(flags = 'g'): RegExp {
  return new RegExp(IMAGE_GEN_REF_REGEX_SOURCE, flags);
}

export function buildImgGenRef(id: string): string {
  return `[[${IMAGE_GEN_REF_NAME} id="${id.trim()}"]]`;
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
