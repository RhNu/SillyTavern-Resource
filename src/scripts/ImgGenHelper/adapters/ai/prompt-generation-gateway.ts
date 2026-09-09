import type { ApiConfig } from '@/ImgGenHelper/config/schema';

export type PromptGenerationGateway = ReturnType<typeof createPromptGenerationGateway>;

export function createPromptGenerationGateway(options: { getConfig: () => ApiConfig }) {
  return {
    generate(generationId: string, orderedPrompts: NonNullable<GenerateRawConfig['ordered_prompts']>) {
      const config = options.getConfig();
      return generateRaw({
        should_silence: true,
        generation_id: generationId,
        custom_api: {
          apiurl: config.apiurl,
          key: config.key || undefined,
          model: config.model,
          source: 'openai',
          max_tokens: config.max_tokens,
          temperature: config.temperature,
          top_p: config.top_p,
          frequency_penalty: config.frequency_penalty,
          presence_penalty: config.presence_penalty,
        },
        ordered_prompts: orderedPrompts,
      });
    },
    stop(generationId: string) {
      stopGenerationById(generationId);
    },
  };
}
