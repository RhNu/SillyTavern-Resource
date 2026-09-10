export type ProviderDefinition = {
  id: string;
  label: string;
  secretKey: string;
  baseUrl: { mode: 'fixed'; value: string } | { mode: 'custom'; placeholder: string };
  credentialRequired: boolean;
};

export const PROVIDERS: readonly ProviderDefinition[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    secretKey: 'OPENAI',
    baseUrl: { mode: 'fixed', value: 'https://api.openai.com/v1' },
    credentialRequired: true,
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    secretKey: 'OPENROUTER',
    baseUrl: { mode: 'fixed', value: 'https://openrouter.ai/api/v1' },
    credentialRequired: true,
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    secretKey: 'MISTRALAI',
    baseUrl: { mode: 'fixed', value: 'https://api.mistral.ai/v1' },
    credentialRequired: true,
  },
  {
    id: 'groq',
    label: 'Groq',
    secretKey: 'GROQ',
    baseUrl: { mode: 'fixed', value: 'https://api.groq.com/openai/v1' },
    credentialRequired: true,
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    secretKey: 'DEEPSEEK',
    baseUrl: { mode: 'fixed', value: 'https://api.deepseek.com' },
    credentialRequired: true,
  },
  {
    id: 'xai',
    label: 'xAI',
    secretKey: 'XAI',
    baseUrl: { mode: 'fixed', value: 'https://api.x.ai/v1' },
    credentialRequired: true,
  },
  {
    id: 'chutes',
    label: 'Chutes',
    secretKey: 'CHUTES',
    baseUrl: { mode: 'fixed', value: 'https://llm.chutes.ai/v1' },
    credentialRequired: true,
  },
  {
    id: 'electronhub',
    label: 'Electron Hub',
    secretKey: 'ELECTRONHUB',
    baseUrl: { mode: 'fixed', value: 'https://api.electronhub.ai/v1' },
    credentialRequired: true,
  },
  {
    id: 'nanogpt',
    label: 'NanoGPT',
    secretKey: 'NANOGPT',
    baseUrl: { mode: 'fixed', value: 'https://nano-gpt.com/api/v1' },
    credentialRequired: true,
  },
  {
    id: 'aimlapi',
    label: 'AI/ML API',
    secretKey: 'AIMLAPI',
    baseUrl: { mode: 'fixed', value: 'https://api.aimlapi.com/v1' },
    credentialRequired: true,
  },
  {
    id: 'moonshot',
    label: 'Moonshot AI',
    secretKey: 'MOONSHOT',
    baseUrl: { mode: 'fixed', value: 'https://api.moonshot.ai/v1' },
    credentialRequired: true,
  },
  {
    id: 'fireworks',
    label: 'Fireworks AI',
    secretKey: 'FIREWORKS',
    baseUrl: { mode: 'fixed', value: 'https://api.fireworks.ai/inference/v1' },
    credentialRequired: true,
  },
  {
    id: 'zai',
    label: 'Z.AI',
    secretKey: 'ZAI',
    baseUrl: { mode: 'fixed', value: 'https://api.z.ai/api/paas/v4' },
    credentialRequired: true,
  },
  {
    id: 'siliconflow',
    label: 'SiliconFlow',
    secretKey: 'SILICONFLOW',
    baseUrl: { mode: 'fixed', value: 'https://api.siliconflow.com/v1' },
    credentialRequired: true,
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    secretKey: 'CUSTOM',
    baseUrl: { mode: 'custom', placeholder: 'https://example.com/v1' },
    credentialRequired: false,
  },
];

export function findProvider(id: string): ProviderDefinition | undefined {
  return PROVIDERS.find(provider => provider.id === id);
}
