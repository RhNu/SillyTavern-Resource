import { insertAnchors, type StoryParagraph } from '../domain/anchor';
import { createImageBlock, hashText, type ImageBlock } from '../domain/block';
import type { PromptAnalysisResponse } from '../domain/prompt';
import { createLogger } from '../app/logger';
import { MessageBlockRepository } from './repository';

const logger = createLogger('message-blocks/commit-analysis');

export async function commitAnalysis(input: {
  messageId: number;
  originalText: string;
  paragraphs: StoryParagraph[];
  response: PromptAnalysisResponse;
  repository: MessageBlockRepository;
}): Promise<ImageBlock[]> {
  logger.info('开始提交提示词分析结果', {
    messageId: input.messageId,
    paragraphCount: input.paragraphs.length,
    insertionCount: input.response.insertions.length,
  });
  const latest = getChatMessages(input.messageId)[0];
  if (!latest || latest.role !== 'assistant' || latest.message !== input.originalText) {
    logger.warn('取消提交分析结果：目标消息已变化', { messageId: input.messageId });
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
  logger.debug('已预写入图片块，准备写回消息锚点', {
    messageId: input.messageId,
    createdCount: created.length,
    previousCount: previous.length,
  });
  try {
    const anchoredText = insertAnchors(input.originalText, input.paragraphs, entries);
    await setChatMessages([{ message_id: input.messageId, message: anchoredText }], { refresh: 'affected' });
    const committed = created.map(block => ({ ...block, status: 'draft' as const }));
    input.repository.write(input.messageId, [...previous, ...committed]);
    logger.info('提示词分析结果提交完成', {
      messageId: input.messageId,
      createdCount: committed.length,
    });
    return committed;
  } catch (error) {
    logger.error('写回消息锚点失败，准备回滚图片块', error, { messageId: input.messageId });
    try {
      input.repository.write(input.messageId, previous);
      logger.info('分析结果回滚完成', { messageId: input.messageId, restoredCount: previous.length });
    } catch (rollbackError) {
      logger.error('分析结果回滚失败', rollbackError, { messageId: input.messageId });
    }
    throw error;
  }
}
