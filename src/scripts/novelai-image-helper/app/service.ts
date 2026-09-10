import { matchAnchors } from '../domain/anchor';
import type { ImageBlock } from '../domain/block';
import {
  BLOCKS_CHANGED_EVENT,
  GenerationQueue,
  type GenerationQueueOptions,
  type QueueEnqueueResult,
  type QueueSnapshot,
} from '../image-generation/queue';
import { commitAnalysis } from '../message-blocks/commit-analysis';
import { MessageBlockRepository } from '../message-blocks/repository';
import { buildHistory, buildWorldbook, paragraphTexts } from '../prompt-analysis/context';
import { collectCleanedStoryParagraphs } from '../prompt-analysis/context-cleaner';
import { PromptModelClient } from '../prompt-analysis/model-client';
import { NovelAiClient } from '../platform/imggen-novelai/client';
import { SettingsStore } from '../settings/store';
import { LlmRequesterClient } from '../../../../util/llm-requester/client';

export type NovelAiImageServiceOptions = {
  onGenerationQueueFinished?: GenerationQueueOptions['onQueueFinished'];
};

export class NovelAiImageService {
  readonly settings = new SettingsStore();
  readonly repository = new MessageBlockRepository();
  readonly backend = new NovelAiClient();
  readonly llmRequester = new LlmRequesterClient();
  readonly queue: GenerationQueue;
  private readonly promptModel = new PromptModelClient(this.llmRequester);
  private activeAnalysis?: { generationId: string; messageId: number };

  constructor(options: NovelAiImageServiceOptions = {}) {
    this.queue = new GenerationQueue(this.repository, this.settings, this.backend, {
      onQueueFinished: options.onGenerationQueueFinished,
    });
  }

  recoverInterruptedBlocks(): void {
    getChatMessages('0-{{lastMessageId}}').forEach(message => {
      const anchorIds = new Set(matchAnchors(message.message).map(anchor => anchor.id));
      const payload = this.repository.read(message.message_id);
      let changed = false;
      const blocks: ImageBlock[] = [];
      Object.values(payload.blocks).forEach(block => {
        if (block.status === 'prepared' && !anchorIds.has(block.id)) {
          changed = true;
          return;
        }
        if (!['prepared', 'queued', 'generating', 'uploading'].includes(block.status)) {
          blocks.push(block);
          return;
        }
        changed = true;
        blocks.push({
          ...block,
          revision: block.revision + 1,
          status: 'failed',
          error: {
            code: 'INTERRUPTED',
            message: '上次任务在脚本卸载或页面重载时中断，可手动重试',
            retryable: true,
          },
        });
      });
      if (changed) this.repository.write(message.message_id, blocks);
    });
  }

  async analyzeMessage(messageId: number, generateAfterAnalysis: boolean): Promise<ImageBlock[]> {
    if (this.activeAnalysis) throw new Error(`消息 ${this.activeAnalysis.messageId} 正在分析中`);
    const settings = this.settings.get();
    if (!settings.enabled) throw new Error('脚本当前已关闭');

    const message = getChatMessages(messageId)[0];
    if (!message || message.role !== 'assistant') throw new Error('只能分析 AI 消息');
    if (matchAnchors(message.message).length > 0) throw new Error('这条消息已经包含 NovelAI 图片块');

    const cleanedStory = collectCleanedStoryParagraphs(
      message.message,
      settings.analysis.minimumParagraphLength,
      settings.analysis.cleanup,
    );
    const paragraphs = cleanedStory.paragraphs;
    if (cleanedStory.diagnostics.length > 0) {
      console.warn('[NovelAI Image Helper] 忽略无效正文清洗规则', cleanedStory.diagnostics);
    }
    if (paragraphs.length === 0) throw new Error('没有找到达到最小长度的剧情段落');

    const generationId = `nai-analysis-${crypto.randomUUID()}`;
    this.activeAnalysis = { generationId, messageId };
    try {
      const response = await this.promptModel.analyze(
        {
          paragraphs: paragraphTexts(paragraphs),
          history: buildHistory(messageId, settings.analysis.historyCount, settings.analysis.cleanup),
          worldbook: await buildWorldbook(),
        },
        settings,
        generationId,
      );
      if (response.insertions.length === 0) return [];

      response.insertions.forEach(insertion => {
        if (insertion.after_paragraph > paragraphs.length) {
          throw new Error(`模型返回的段落 P${insertion.after_paragraph} 不存在`);
        }
      });

      const blocks = await commitAnalysis({
        messageId,
        originalText: message.message,
        paragraphs,
        response,
        repository: this.repository,
      });
      if (generateAfterAnalysis) blocks.forEach(block => this.queue.enqueue(messageId, block.id));
      void eventEmit(BLOCKS_CHANGED_EVENT, messageId);
      return blocks;
    } finally {
      this.activeAnalysis = undefined;
    }
  }

  async analyzeLatest(generateAfterAnalysis: boolean): Promise<ImageBlock[]> {
    for (let messageId = getLastMessageId(); messageId >= 0; messageId -= 1) {
      const message = getChatMessages(messageId)[0];
      if (message?.role === 'assistant') return this.analyzeMessage(messageId, generateAfterAnalysis);
    }
    throw new Error('当前聊天没有可分析的 AI 消息');
  }

  generate(messageId: number, blockId: string): QueueEnqueueResult {
    return this.queue.enqueue(messageId, blockId);
  }

  getQueueSnapshot(): QueueSnapshot {
    return this.queue.snapshot();
  }

  pauseQueue(): void {
    this.queue.pause();
  }

  resumeQueue(): void {
    this.queue.resume();
  }

  /** 取消全部排队与执行中的任务。 */
  cancelQueue(): number {
    return this.queue.cancelAll();
  }

  /**
   * 重新入队当前聊天里所有可重试的失败图片块。
   * 只处理正文里仍有锚点的块，避免重试已经被用户删掉的图片位。
   */
  retryFailedBlocks(): { enqueued: number; skipped: number } {
    let enqueued = 0;
    let skipped = 0;
    getChatMessages('0-{{lastMessageId}}').forEach(message => {
      const anchorIds = new Set(matchAnchors(message.message).map(anchor => anchor.id));
      Object.values(this.repository.read(message.message_id).blocks).forEach(block => {
        if (block.status !== 'failed' || block.error?.retryable === false || !anchorIds.has(block.id)) return;
        if (this.queue.enqueue(message.message_id, block.id).ok) enqueued += 1;
        else skipped += 1;
      });
    });
    return { enqueued, skipped };
  }

  cancelAnalysis(): void {
    if (this.activeAnalysis) this.promptModel.stop(this.activeAnalysis.generationId);
  }

  destroy(): void {
    this.cancelAnalysis();
    this.queue.destroy();
    this.settings.destroy();
  }
}
