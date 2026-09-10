import { matchAnchors } from '../domain/anchor';
import type { ImageBlock } from '../domain/block';
import { GenerationQueue } from '../image-generation/queue';
import { commitAnalysis } from '../message-blocks/commit-analysis';
import { MessageBlockRepository } from '../message-blocks/repository';
import { buildHistory, buildWorldbook, paragraphTexts } from '../prompt-analysis/context';
import { collectCleanedStoryParagraphs } from '../prompt-analysis/context-cleaner';
import { PromptModelClient } from '../prompt-analysis/model-client';
import { NovelAiClient } from '../platform/imggen-novelai/client';
import { SettingsStore } from '../settings/store';
import { LlmRequesterClient } from '../../../../util/llm-requester/client';

export class NovelAiImageService {
  readonly settings = new SettingsStore();
  readonly repository = new MessageBlockRepository();
  readonly backend = new NovelAiClient();
  readonly llmRequester = new LlmRequesterClient();
  readonly queue = new GenerationQueue(this.repository, this.settings, this.backend);
  private readonly promptModel = new PromptModelClient(this.llmRequester);
  private activeAnalysis?: { generationId: string; messageId: number };

  recoverInterruptedBlocks(): void {
    getChatMessages('0-{{lastMessageId}}').forEach(message => {
      const anchorIds = new Set(matchAnchors(message.message).map(anchor => anchor.id));
      const payload = this.repository.read(message.message_id);
      let changed = false;
      const blocks = Object.values(payload.blocks).flatMap(block => {
        if (block.status === 'prepared' && !anchorIds.has(block.id)) {
          changed = true;
          return [];
        }
        if (!['prepared', 'queued', 'generating', 'uploading'].includes(block.status)) return block;
        changed = true;
        return [
          {
            ...block,
            revision: block.revision + 1,
            status: 'failed' as const,
            error: {
              code: 'INTERRUPTED',
              message: '上次任务在脚本卸载或页面重载时中断，可手动重试',
              retryable: true,
            },
          },
        ];
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
      void eventEmit('novelai_image_helper_blocks_changed', messageId);
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

  generate(messageId: number, blockId: string): boolean {
    return this.queue.enqueue(messageId, blockId);
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
