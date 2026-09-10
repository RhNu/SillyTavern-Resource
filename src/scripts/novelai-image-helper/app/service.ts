import { matchAnchors } from '../domain/anchor';
import type { ImageBlock } from '../domain/block';
import { createLogger } from './logger';
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
import { queueSnapshotToProgress, WorkProgressStore } from './work-progress';

const logger = createLogger('app/service');

export type NovelAiImageServiceOptions = {
  onGenerationQueueFinished?: GenerationQueueOptions['onQueueFinished'];
};

export class NovelAiImageService {
  readonly settings = new SettingsStore();
  readonly repository = new MessageBlockRepository();
  readonly backend = new NovelAiClient();
  readonly llmRequester = new LlmRequesterClient();
  readonly queue: GenerationQueue;
  readonly progress = new WorkProgressStore();
  private readonly promptModel = new PromptModelClient(this.llmRequester);
  private activeAnalysis?: { generationId: string; messageId: number; cancelled: boolean };
  private readonly unsubscribeQueueProgress: () => void;

  constructor(options: NovelAiImageServiceOptions = {}) {
    this.queue = new GenerationQueue(this.repository, this.settings, this.backend, {
      onQueueFinished: options.onGenerationQueueFinished,
    });
    this.unsubscribeQueueProgress = this.queue.subscribe(snapshot => {
      const item = queueSnapshotToProgress(snapshot, () => this.cancelQueue());
      if (item) this.progress.upsert(item);
      else this.progress.remove('generation-queue');
    });
    logger.info('图片助手服务已创建');
  }

  recoverInterruptedBlocks(): void {
    let messages;
    try {
      messages = getChatMessages('0-{{lastMessageId}}');
    } catch (error) {
      logger.error('恢复中断图片块失败：读取聊天消息异常', error);
      return;
    }

    let changedMessages = 0;
    let interruptedBlocks = 0;
    let removedPreparedBlocks = 0;
    messages.forEach(message => {
      try {
        const anchorIds = new Set(matchAnchors(message.message).map(anchor => anchor.id));
        const payload = this.repository.read(message.message_id);
        let changed = false;
        const blocks: ImageBlock[] = [];
        Object.values(payload.blocks).forEach(block => {
          if (block.status === 'prepared' && !anchorIds.has(block.id)) {
            changed = true;
            removedPreparedBlocks += 1;
            return;
          }
          if (!['prepared', 'queued', 'generating', 'uploading'].includes(block.status)) {
            blocks.push(block);
            return;
          }
          changed = true;
          interruptedBlocks += 1;
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
        if (changed) {
          this.repository.write(message.message_id, blocks);
          changedMessages += 1;
        }
      } catch (error) {
        logger.error('恢复单条消息中的图片块失败', error, { messageId: message.message_id });
      }
    });
    logger.info('中断任务恢复检查完成', {
      messageCount: messages.length,
      changedMessages,
      interruptedBlocks,
      removedPreparedBlocks,
    });
  }

  async analyzeMessage(messageId: number, generateAfterAnalysis: boolean): Promise<ImageBlock[]> {
    logger.info('开始分析消息', { messageId, generateAfterAnalysis });
    if (this.activeAnalysis) {
      logger.warn('拒绝开始分析：已有分析任务执行中', {
        messageId,
        activeMessageId: this.activeAnalysis.messageId,
        activeGenerationId: this.activeAnalysis.generationId,
      });
      throw new Error(`消息 ${this.activeAnalysis.messageId} 正在分析中`);
    }
    const settings = this.settings.get();
    if (!settings.enabled) {
      logger.warn('拒绝分析：脚本当前已关闭', { messageId });
      throw new Error('脚本当前已关闭');
    }

    const message = (() => {
      try {
        return getChatMessages(messageId)[0];
      } catch (error) {
        logger.error('读取待分析消息失败', error, { messageId });
        throw error;
      }
    })();
    if (!message || message.role !== 'assistant') {
      logger.warn('拒绝分析：目标消息不是 AI 消息', { messageId, found: Boolean(message), role: message?.role });
      throw new Error('只能分析 AI 消息');
    }
    const existingAnchors = matchAnchors(message.message);
    if (existingAnchors.length > 0) {
      logger.warn('拒绝分析：消息已经包含图片锚点', { messageId, anchorCount: existingAnchors.length });
      throw new Error('这条消息已经包含 NovelAI 图片块');
    }

    const cleanedStory = collectCleanedStoryParagraphs(
      message.message,
      settings.analysis.minimumParagraphLength,
      settings.analysis.cleanup,
    );
    const paragraphs = cleanedStory.paragraphs;
    if (cleanedStory.diagnostics.length > 0) {
      logger.warn('忽略无效正文清洗规则', {
        messageId,
        count: cleanedStory.diagnostics.length,
        diagnostics: cleanedStory.diagnostics,
      });
    }
    if (paragraphs.length === 0) {
      logger.warn('拒绝分析：没有找到达到最小长度的剧情段落', { messageId });
      throw new Error('没有找到达到最小长度的剧情段落');
    }

    const generationId = `nai-analysis-${crypto.randomUUID()}`;
    const analysis = { generationId, messageId, cancelled: false };
    this.activeAnalysis = analysis;
    this.progress.upsert({
      id: generationId,
      kind: 'analysis',
      status: 'running',
      title: `分析消息 ${messageId}`,
      detail: '正在整理剧情上下文',
      completed: 0,
      cancel: { label: '中断提示词分析', run: () => this.cancelAnalysis() },
    });
    try {
      logger.debug('开始构建提示词分析上下文', {
        messageId,
        generationId,
        paragraphCount: paragraphs.length,
        historyCount: settings.analysis.historyCount,
      });
      const worldbook = await buildWorldbook();
      if (analysis.cancelled) throw new AnalysisCancelledError(messageId);
      this.progress.upsert({
        id: generationId,
        kind: 'analysis',
        status: 'running',
        title: `分析消息 ${messageId}`,
        detail: '正在请求提示词模型',
        completed: 0,
        cancel: { label: '中断提示词分析', run: () => this.cancelAnalysis() },
      });
      const response = await this.promptModel.analyze(
        {
          paragraphs: paragraphTexts(paragraphs),
          history: buildHistory(messageId, settings.analysis.historyCount, settings.analysis.cleanup),
          worldbook,
        },
        settings,
        generationId,
      );
      logger.info('提示词模型分析完成', {
        messageId,
        generationId,
        insertionCount: response.insertions.length,
      });
      if (response.insertions.length === 0) return [];

      response.insertions.forEach(insertion => {
        if (insertion.after_paragraph > paragraphs.length) {
          logger.error('提示词模型返回了不存在的段落编号', new Error(`P${insertion.after_paragraph}`), {
            messageId,
            generationId,
            paragraphCount: paragraphs.length,
            afterParagraph: insertion.after_paragraph,
          });
          throw new Error(`模型返回的段落 P${insertion.after_paragraph} 不存在`);
        }
      });

      if (analysis.cancelled) throw new AnalysisCancelledError(messageId);
      this.progress.upsert({
        id: generationId,
        kind: 'analysis',
        status: 'running',
        title: `分析消息 ${messageId}`,
        detail: '正在写入图片块',
        completed: 0,
        cancel: { label: '中断提示词分析', run: () => this.cancelAnalysis() },
      });
      const blocks = await commitAnalysis({
        messageId,
        originalText: message.message,
        paragraphs,
        response,
        repository: this.repository,
      });
      if (generateAfterAnalysis) blocks.forEach(block => this.queue.enqueue(messageId, block.id));
      try {
        void Promise.resolve(eventEmit(BLOCKS_CHANGED_EVENT, messageId)).catch(error => {
          logger.error('发送分析结果变更事件失败', error, { messageId, generationId });
        });
      } catch (error) {
        logger.error('发送分析结果变更事件失败', error, { messageId, generationId });
      }
      logger.info('消息分析结果已写回', {
        messageId,
        generationId,
        blockCount: blocks.length,
        generateAfterAnalysis,
      });
      return blocks;
    } catch (error) {
      if (analysis.cancelled) throw new AnalysisCancelledError(messageId);
      logger.error('消息分析失败', error, { messageId, generationId });
      throw error;
    } finally {
      this.activeAnalysis = undefined;
      this.progress.remove(generationId);
      logger.debug('消息分析任务已清理', { messageId, generationId });
    }
  }

  async analyzeLatest(generateAfterAnalysis: boolean): Promise<ImageBlock[]> {
    logger.info('开始分析最新 AI 消息', { generateAfterAnalysis });
    try {
      for (let messageId = getLastMessageId(); messageId >= 0; messageId -= 1) {
        const message = getChatMessages(messageId)[0];
        if (message?.role === 'assistant') return this.analyzeMessage(messageId, generateAfterAnalysis);
      }
    } catch (error) {
      logger.error('查找最新 AI 消息失败', error);
      throw error;
    }
    logger.warn('分析最新消息失败：当前聊天没有 AI 消息');
    throw new Error('当前聊天没有可分析的 AI 消息');
  }

  generate(messageId: number, blockId: string): QueueEnqueueResult {
    try {
      const result = this.queue.enqueue(messageId, blockId);
      logger.debug('请求生成图片块', { messageId, blockId, result });
      return result;
    } catch (error) {
      logger.error('请求生成图片块失败', error, { messageId, blockId });
      throw error;
    }
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
    const cancelled = this.queue.cancelAll();
    logger.info('请求取消全部生成任务', { cancelled });
    return cancelled;
  }

  /**
   * 重新入队当前聊天里所有可重试的失败图片块。
   * 只处理正文里仍有锚点的块，避免重试已经被用户删掉的图片位。
   */
  retryFailedBlocks(): { enqueued: number; skipped: number } {
    let enqueued = 0;
    let skipped = 0;
    try {
      getChatMessages('0-{{lastMessageId}}').forEach(message => {
        try {
          const anchorIds = new Set(matchAnchors(message.message).map(anchor => anchor.id));
          Object.values(this.repository.read(message.message_id).blocks).forEach(block => {
            if (block.status !== 'failed' || block.error?.retryable === false || !anchorIds.has(block.id)) return;
            if (this.queue.enqueue(message.message_id, block.id).ok) enqueued += 1;
            else skipped += 1;
          });
        } catch (error) {
          logger.error('重试单条消息中的失败图片块失败', error, { messageId: message.message_id });
        }
      });
    } catch (error) {
      logger.error('扫描失败图片块失败', error);
    }
    logger.info('失败图片块重试扫描完成', { enqueued, skipped });
    return { enqueued, skipped };
  }

  cancelAnalysis(): void {
    if (!this.activeAnalysis) {
      logger.debug('取消分析请求被忽略：当前没有分析任务');
      return;
    }
    logger.info('请求取消消息分析', this.activeAnalysis);
    this.activeAnalysis.cancelled = true;
    this.progress.upsert({
      id: this.activeAnalysis.generationId,
      kind: 'analysis',
      status: 'cancelling',
      title: `分析消息 ${this.activeAnalysis.messageId}`,
      detail: '正在中断提示词模型请求',
      completed: 0,
      cancel: { label: '正在中断…', run: () => undefined },
    });
    this.promptModel.stop(this.activeAnalysis.generationId);
  }

  destroy(): void {
    logger.info('开始销毁图片助手服务');
    this.cancelAnalysis();
    this.unsubscribeQueueProgress();
    this.queue.destroy();
    this.progress.destroy();
    this.settings.destroy();
    logger.debug('图片助手服务已销毁');
  }
}

export class AnalysisCancelledError extends Error {
  constructor(readonly messageId: number) {
    super(`消息 ${messageId} 的提示词分析已中断`);
    this.name = 'AnalysisCancelledError';
  }
}

export function isAnalysisCancelledError(error: unknown): error is AnalysisCancelledError {
  return error instanceof AnalysisCancelledError;
}
