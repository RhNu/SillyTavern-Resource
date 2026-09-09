import { insertAnchors, type StoryParagraph } from '../domain/anchor';
import { createImageBlock, hashText, type ImageBlock } from '../domain/block';
import type { PromptAnalysisResponse } from '../domain/prompt';
import { MessageBlockRepository } from './repository';

export async function commitAnalysis(input: {
  messageId: number;
  originalText: string;
  paragraphs: StoryParagraph[];
  response: PromptAnalysisResponse;
  repository: MessageBlockRepository;
}): Promise<ImageBlock[]> {
  const latest = getChatMessages(input.messageId)[0];
  if (!latest || latest.role !== 'assistant' || latest.message !== input.originalText) {
    throw new Error('分析期间目标消息发生变化，已取消写回');
  }

  const sourceMessageHash = await hashText(input.originalText);
  const entries = input.response.insertions.map(insertion => ({
    insertion,
    blockId: `nai_${crypto.randomUUID().replace(/-/g, '')}`,
  }));
  const created = entries.map(entry =>
    createImageBlock({
      id: entry.blockId,
      sourceMessageHash,
      summary: entry.insertion.summary,
      prompt: entry.insertion.prompt,
    }),
  );
  const previous = Object.values(input.repository.read(input.messageId).blocks);

  input.repository.write(input.messageId, [...previous, ...created]);
  try {
    const anchoredText = insertAnchors(input.originalText, input.paragraphs, entries);
    await setChatMessages([{ message_id: input.messageId, message: anchoredText }], { refresh: 'affected' });
    const committed = created.map(block => ({ ...block, status: 'draft' as const }));
    input.repository.write(input.messageId, [...previous, ...committed]);
    return committed;
  } catch (error) {
    input.repository.write(input.messageId, previous);
    throw error;
  }
}
