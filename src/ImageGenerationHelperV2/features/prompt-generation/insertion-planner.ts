import {
  createImgGenBlockId,
  createImgGenMessageBlockState,
  type ImgGenResolvedBlockState,
} from '@/ImageGenerationHelperV2/features/image-generation/block-repository';
import { buildImgGenRef } from '@/ImageGenerationHelperV2/features/image-generation/ref-codec';
import type { PromptGenerationInsertion } from '@/ImageGenerationHelperV2/features/prompt-generation/protocol';
import { stripXmlComments } from '@/ImageGenerationHelperV2/shared/text';

function sanitizeInsertionPrompt(prompt: string): string {
  return stripXmlComments(prompt).trim();
}

export function locateParagraphEndPositions(originalText: string, paragraphs: string[]): number[] {
  const positions: number[] = [];

  for (const [index, paragraph] of paragraphs.entries()) {
    const searchFrom = positions[index - 1] ?? 0;
    const prefix = paragraph.slice(0, Math.min(30, paragraph.length));
    const suffix = paragraph.slice(Math.max(0, paragraph.length - 30));
    let startIndex = originalText.indexOf(prefix, searchFrom);

    if (startIndex < 0) {
      startIndex = originalText.indexOf(prefix.slice(0, Math.min(15, prefix.length)), searchFrom);
    }

    if (startIndex < 0) {
      positions.push(Math.min(originalText.length, searchFrom + paragraph.length));
      continue;
    }

    let endIndex = originalText.indexOf(suffix, startIndex);
    if (endIndex >= 0) {
      endIndex += suffix.length;
    } else {
      endIndex = startIndex + paragraph.length;
    }

    positions.push(Math.min(endIndex, originalText.length));
  }

  return positions;
}

export function prepareInsertions(
  originalText: string,
  paragraphs: string[],
  insertions: PromptGenerationInsertion[],
  manual: boolean,
): {
  nextText: string;
  nextBlocks: ImgGenResolvedBlockState[];
} {
  const paragraphEndPositions = locateParagraphEndPositions(originalText, paragraphs);

  if (paragraphEndPositions.length === 0) {
    return {
      nextText: originalText,
      nextBlocks: [],
    };
  }

  const insertionsByParagraph = new Map<number, ImgGenResolvedBlockState[]>();
  const maxIndex = paragraphEndPositions.length - 1;

  for (const insertion of insertions) {
    const sanitizedPrompt = sanitizeInsertionPrompt(insertion.prompt);
    if (!sanitizedPrompt) {
      continue;
    }

    const targetIndex = Math.min(Math.max(insertion.after_paragraph - 1, 0), maxIndex);
    const blockState: ImgGenResolvedBlockState = {
      ...createImgGenMessageBlockState(createImgGenBlockId(), sanitizedPrompt),
      preventAuto: manual,
    };
    const current = insertionsByParagraph.get(targetIndex) ?? [];
    current.push(blockState);
    insertionsByParagraph.set(targetIndex, current);
  }

  let nextText = '';
  let cursor = 0;
  const nextBlocks: ImgGenResolvedBlockState[] = [];

  for (let paragraphIndex = 0; paragraphIndex < paragraphEndPositions.length; paragraphIndex += 1) {
    const endPosition = paragraphEndPositions[paragraphIndex];
    nextText += originalText.slice(cursor, endPosition);
    cursor = endPosition;

    const paragraphBlocks = insertionsByParagraph.get(paragraphIndex) ?? [];
    if (paragraphBlocks.length === 0) {
      continue;
    }

    nextText += paragraphBlocks.map(block => `\n\n${buildImgGenRef(block.id)}`).join('');
    nextBlocks.push(...paragraphBlocks);
  }

  nextText += originalText.slice(cursor);

  return {
    nextText,
    nextBlocks,
  };
}
