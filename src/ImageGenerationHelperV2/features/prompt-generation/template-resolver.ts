import { getImageGenerationStore } from '@/ImageGenerationHelperV2/config/store';
import { BUILTIN_TEMPLATE_NAI_NAME, BUILTIN_TEMPLATES } from '@/ImageGenerationHelperV2/config/defaults';
import { buildPromptCharacterList } from '@/ImageGenerationHelperV2/features/prompt-generation/character-resolver';
import {
  PROMPT_TEMPLATE_CHARACTER_LIST_TOKEN,
  replacePromptToken,
} from '@/ImageGenerationHelperV2/features/prompt-generation/placeholders';

export function buildResolvedPromptTemplate(): string {
  const store = getImageGenerationStore();
  const template =
    store.config.prompt.templates.items[store.config.prompt.templates.selected] ??
    store.availableTemplates[BUILTIN_TEMPLATE_NAI_NAME] ??
    BUILTIN_TEMPLATES[BUILTIN_TEMPLATE_NAI_NAME] ??
    '';

  return replacePromptToken(template, PROMPT_TEMPLATE_CHARACTER_LIST_TOKEN, buildPromptCharacterList());
}
