import { getImageGenerationStore } from '../core/store';
import { BUILTIN_TEMPLATE_NAI_NAME, BUILTIN_TEMPLATES } from './defaults';
import { PROMPT_TEMPLATE_CHARACTER_LIST_TOKEN, replacePromptToken } from './placeholders';

function buildCharacterList(): string {
  const store = getImageGenerationStore();
  const enabledCharacters = store.getActiveCharacters();

  if (enabledCharacters.length === 0) {
    return '';
  }

  return enabledCharacters.map(character => `**${character.name || '未命名人物'}**: ${character.content}`).join('\n');
}

export function buildResolvedPromptTemplate(): string {
  const store = getImageGenerationStore();
  const template =
    store.config.prompt.templates.items[store.config.prompt.templates.selected] ??
    store.availableTemplates[BUILTIN_TEMPLATE_NAI_NAME] ??
    BUILTIN_TEMPLATES[BUILTIN_TEMPLATE_NAI_NAME] ??
    '';

  return replacePromptToken(template, PROMPT_TEMPLATE_CHARACTER_LIST_TOKEN, buildCharacterList());
}
