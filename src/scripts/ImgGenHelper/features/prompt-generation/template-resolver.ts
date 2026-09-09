import { BUILTIN_TEMPLATE_NAI_NAME, BUILTIN_TEMPLATES } from '@/ImgGenHelper/config/defaults';
import { getImageGenerationStore } from '@/ImgGenHelper/config/store';
import { buildPromptCharacterList } from '@/ImgGenHelper/features/prompt-generation/character-resolver';
import {
  PROMPT_TEMPLATE_CHARACTER_LIST_TOKEN,
  replacePromptToken,
} from '@/ImgGenHelper/features/prompt-generation/placeholders';

export function buildResolvedPromptTemplate(): string {
  const store = getImageGenerationStore();
  const template =
    store.config.prompt.templates.items[store.config.prompt.templates.selected] ??
    store.availableTemplates[BUILTIN_TEMPLATE_NAI_NAME] ??
    BUILTIN_TEMPLATES[BUILTIN_TEMPLATE_NAI_NAME] ??
    '';

  return replacePromptToken(template, PROMPT_TEMPLATE_CHARACTER_LIST_TOKEN, buildPromptCharacterList());
}
