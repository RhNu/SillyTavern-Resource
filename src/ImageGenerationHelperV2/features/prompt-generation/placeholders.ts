export const PROMPT_TEMPLATE_CHARACTER_LIST_TOKEN = '<<CHARACTER_LIST>>';
export const PROMPT_GENERATION_HISTORY_CONTEXT_TOKEN = '<<HISTORY_CONTEXT>>';
export const PROMPT_GENERATION_WORLDBOOK_CONTEXT_TOKEN = '<<WORLDBOOK_CONTEXT>>';
export const PROMPT_GENERATION_PROMPT_TEMPLATE_TOKEN = '<<PROMPT_TEMPLATE>>';
export const PROMPT_GENERATION_LATEST_STORY_TOKEN = '<<LATEST_STORY>>';

export function replacePromptToken(content: string, token: string, value: string): string {
  return content.replaceAll(token, value);
}
