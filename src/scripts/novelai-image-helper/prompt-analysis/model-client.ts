import type { StoryLayout } from '../anchors/story-layout';
import { PromptAnalysisResponseSchema, promptAnalysisJsonSchema, type PromptAnalysisResponse } from '../domain/prompt';
import { createLogger } from '../app/logger';
import type { Settings } from '../settings/schema';
import { assemblePromptAnalysisMessages } from './template-assembler';
import { LlmRequesterClient } from '../../../../util/llm-requester/client';

const logger = createLogger('prompt-analysis/model-client');

type AnalysisInput = {
  layout: StoryLayout;
  history: string;
  worldbook: string;
};

export class PromptModelClient {
  private readonly controllers = new Map<string, AbortController>();

  constructor(private readonly client = new LlmRequesterClient()) {}

  async analyze(input: AnalysisInput, settings: Settings, generationId: string): Promise<PromptAnalysisResponse> {
    const connection = settings.analysis.connection;
    const model = settings.analysis.model.trim();
    logger.info('开始请求提示词模型', {
      generationId,
      providerId: connection.providerId || '(empty)',
      model: model || '(empty)',
      anchorCount: input.layout.blocks.length,
      historyLength: input.history.length,
      worldbookLength: input.worldbook.length,
      maxTokens: settings.analysis.maxTokens,
    });
    try {
      if (!connection.providerId) throw new Error('请先在设置中选择 Provider');
      if (connection.providerId === 'custom' && !connection.baseUrl.trim()) {
        throw new Error('请先在设置中填写 OpenAI-compatible Base URL');
      }
      if (!model) throw new Error('请先在设置中填写提示词模型');

      const controller = new AbortController();
      this.controllers.set(generationId, controller);
      const result = await this.client.generate(
        {
          provider: {
            providerId: connection.providerId,
            ...(connection.credentialId ? { credentialId: connection.credentialId } : {}),
            ...(connection.providerId === 'custom' ? { baseUrl: connection.baseUrl.trim() } : {}),
          },
          model,
          messages: assemblePromptAnalysisMessages(input, settings),
          tools: [
            {
              name: 'submit_image_analysis',
              description: 'Submit the selected illustration points and their NovelAI prompts.',
              inputSchema: promptAnalysisJsonSchema(),
            },
          ],
          toolChoice: { type: 'tool', name: 'submit_image_analysis' },
          parameters: { maxOutputTokens: settings.analysis.maxTokens },
        },
        controller.signal,
      );
      logger.info('提示词模型请求返回', {
        generationId,
        requestId: result.requestId,
        model: result.model,
        finishReason: result.finishReason,
        toolCallCount: result.toolCalls.length,
        usage: result.usage,
        warningCount: result.warnings.length,
      });
      if (result.toolCalls.length !== 1 || result.toolCalls[0]?.name !== 'submit_image_analysis') {
        throw new Error(`提示词模型应返回一个 submit_image_analysis 工具调用，实际返回 ${result.toolCalls.length} 个`);
      }
      const response = PromptAnalysisResponseSchema.parse(result.toolCalls[0].input);
      logger.debug('提示词模型工具调用校验完成', {
        generationId,
        insertionCount: response.insertions.length,
      });
      return response;
    } catch (error) {
      logger.error('提示词模型请求失败', error, {
        generationId,
        providerId: connection.providerId || '(empty)',
        model: model || '(empty)',
      });
      throw error;
    } finally {
      this.controllers.delete(generationId);
      logger.debug('提示词模型请求已清理', { generationId });
    }
  }

  stop(generationId: string): void {
    const controller = this.controllers.get(generationId);
    if (!controller) {
      logger.debug('停止提示词模型请求被忽略：请求不存在', { generationId });
      return;
    }
    logger.info('中止提示词模型请求', { generationId });
    controller.abort();
  }
}
