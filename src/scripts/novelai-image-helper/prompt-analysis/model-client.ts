import { PromptAnalysisResponseSchema, promptAnalysisJsonSchema, type PromptAnalysisResponse } from '../domain/prompt';
import type { Settings } from '../settings/schema';
import { assemblePromptAnalysisMessages } from './template-assembler';
import { LlmRequesterClient } from '../../../../util/llm-requester/client';

type AnalysisInput = {
  paragraphs: string[];
  history: string;
  worldbook: string;
};

export class PromptModelClient {
  private readonly client = new LlmRequesterClient();
  private readonly controllers = new Map<string, AbortController>();

  async analyze(input: AnalysisInput, settings: Settings, generationId: string): Promise<PromptAnalysisResponse> {
    const baseUrl = settings.analysis.baseUrl.trim();
    const model = settings.analysis.model.trim();
    if (!baseUrl) throw new Error('请先在设置中填写 OpenAI-compatible Base URL');
    if (!model) throw new Error('请先在设置中填写提示词模型');

    const controller = new AbortController();
    this.controllers.set(generationId, controller);
    try {
      const result = await this.client.generate(
        {
          provider: { type: 'openai-compatible', baseUrl },
          model,
          messages: assemblePromptAnalysisMessages(input, settings),
          tools: [
            {
              name: 'submit_image_analysis',
              description: 'Submit the selected illustration points and their NovelAI prompts.',
              inputSchema: promptAnalysisJsonSchema(),
              strict: true,
            },
          ],
          toolChoice: { type: 'tool', name: 'submit_image_analysis' },
          parameters: { maxOutputTokens: settings.analysis.maxTokens },
          providerOptions: { llmRequester: { parallel_tool_calls: false } },
        },
        controller.signal,
      );
      if (result.toolCalls.length !== 1 || result.toolCalls[0]?.name !== 'submit_image_analysis') {
        throw new Error(`提示词模型应返回一个 submit_image_analysis 工具调用，实际返回 ${result.toolCalls.length} 个`);
      }
      return PromptAnalysisResponseSchema.parse(result.toolCalls[0].input);
    } finally {
      this.controllers.delete(generationId);
    }
  }

  stop(generationId: string): void {
    this.controllers.get(generationId)?.abort();
  }
}
