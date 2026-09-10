import { parsePromptAnalysisResponse, promptAnalysisJsonSchema, type PromptAnalysisResponse } from '../domain/prompt';
import type { Settings } from '../settings/schema';
import { assemblePromptAnalysisMessages } from './template-assembler';

type AnalysisInput = {
  paragraphs: string[];
  history: string;
  worldbook: string;
};

function customApi(settings: Settings): CustomApiConfig {
  const analysis = settings.analysis;
  if (analysis.proxyPreset.trim()) {
    return {
      proxy_preset: analysis.proxyPreset.trim(),
      model: analysis.model.trim() || undefined,
      max_tokens: analysis.maxTokens,
    };
  }
  if (!analysis.apiUrl.trim()) {
    throw new Error('请先在设置中填写独立模型代理预设或 API 地址');
  }
  return {
    apiurl: analysis.apiUrl.trim(),
    key: analysis.apiKey.trim() || undefined,
    model: analysis.model.trim() || undefined,
    source: 'openai',
    max_tokens: analysis.maxTokens,
  };
}

export class PromptModelClient {
  async analyze(input: AnalysisInput, settings: Settings, generationId: string): Promise<PromptAnalysisResponse> {
    const result = await generateRaw({
      generation_id: generationId,
      should_silence: true,
      should_stream: false,
      custom_api: customApi(settings),
      ordered_prompts: assemblePromptAnalysisMessages(input, settings),
      json_schema: {
        name: 'novelai_image_analysis_v2',
        description: 'Image insertion points with a main prompt and separate prompt for every character.',
        value: promptAnalysisJsonSchema(),
        strict: true,
      },
    });
    const text = typeof result === 'string' ? result : result.content;
    return parsePromptAnalysisResponse(text);
  }

  stop(generationId: string): void {
    stopGenerationById(generationId);
  }
}
