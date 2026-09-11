import { applyInsertionPlan } from '../anchors/insertion-plan';
import type { StoryLayout } from '../anchors/story-layout';
import { createImageBlock, type ImageBlock } from '../domain/block';
import type { PromptAnalysisResponse } from '../domain/prompt';
import { createLogger } from '../app/logger';
import { ChatImageRepository } from './repository';

const logger = createLogger('message-blocks/commit-analysis');

export async function commitAnalysis(input: {
  messageId: number;
  originalText: string;
  layout: StoryLayout;
  assertCurrent: () => void;
  response: PromptAnalysisResponse;
  repository: ChatImageRepository;
}): Promise<ImageBlock[]> {
  const entries = input.response.insertions.map(insertion => ({
    insertion,
    imageId: `nai_${crypto.randomUUID().replace(/-/g, '')}`,
  }));
  // Validate the complete plan before making any persistent changes.
  const anchoredText = applyInsertionPlan(
    input.originalText,
    input.layout,
    entries.map(entry => ({ anchorId: entry.insertion.anchor_id, imageId: entry.imageId })),
  );
  const created = entries.map(entry =>
    createImageBlock({ id: entry.imageId, summary: entry.insertion.summary, prompt: entry.insertion.prompt }),
  );
  input.assertCurrent();
  if (getChatMessages(input.messageId)[0]?.message !== input.originalText)
    throw new Error('分析期间目标消息发生变化，已取消写回');
  input.repository.prepare(created);
  const ids = created.map(block => block.id);
  try {
    input.assertCurrent();
    await setChatMessages([{ message_id: input.messageId, message: anchoredText }], { refresh: 'affected' });
    input.repository.finalize(ids);
    return created.map(block => ({ ...block, status: 'draft' }));
  } catch (error) {
    // The host may have applied the text before rejecting. References decide recovery, not the exception.
    try {
      input.repository.reconcile(ids);
    } catch (recoveryError) {
      logger.error('提交恢复延后至下次加载', recoveryError, { messageId: input.messageId });
    }
    throw error;
  }
}
