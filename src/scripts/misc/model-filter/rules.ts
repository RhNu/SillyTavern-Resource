import { z } from 'zod';

export const ModelFilterRuleSchema = z
  .object({
    source: z.string().trim().min(1),
    endpoint: z.string(),
    mode: z.enum(['include', 'exclude']),
    match: z.enum(['exact', 'regex']),
    pattern: z.string().trim().min(1, '请输入模型 ID 或正则表达式'),
    ignoreCase: z.boolean(),
  })
  .superRefine((rule, context) => {
    if (rule.match !== 'regex') return;
    try {
      new RegExp(rule.pattern, rule.ignoreCase ? 'i' : '');
    } catch (error) {
      context.addIssue({ code: 'custom', path: ['pattern'], message: `正则表达式无效：${String(error)}` });
    }
  });

export const ModelFilterSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  rules: z.array(ModelFilterRuleSchema).default([]),
});

export type ModelFilterRule = z.infer<typeof ModelFilterRuleSchema>;
export type ModelFilterSettings = z.infer<typeof ModelFilterSettingsSchema>;
export type ModelFilterBinding = Pick<ModelFilterRule, 'source' | 'endpoint'>;

export function sameBinding(a: ModelFilterBinding, b: ModelFilterBinding): boolean {
  return a.source === b.source && a.endpoint === b.endpoint;
}

/** Compare model IDs only; providers may use a separate display name. */
export function modelMatchesRule(rule: ModelFilterRule, modelId: string): boolean {
  if (rule.match === 'regex') {
    return new RegExp(rule.pattern, rule.ignoreCase ? 'i' : '').test(modelId);
  }

  const candidate = rule.ignoreCase ? modelId.toLocaleLowerCase() : modelId;
  return rule.pattern
    .split(/\r?\n/)
    .map(value => value.trim())
    .filter(Boolean)
    .some(value => (rule.ignoreCase ? value.toLocaleLowerCase() : value) === candidate);
}

export function shouldDisplayModel(rule: ModelFilterRule, modelId: string): boolean {
  const matches = modelMatchesRule(rule, modelId);
  return rule.mode === 'include' ? matches : !matches;
}
