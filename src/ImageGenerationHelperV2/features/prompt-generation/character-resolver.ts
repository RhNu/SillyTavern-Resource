import { getImageGenerationStore } from '@/ImageGenerationHelperV2/config/store';

export function buildPromptCharacterList(): string {
  const store = getImageGenerationStore();
  const enabledCharacters = store.getActiveCharacters();

  if (enabledCharacters.length === 0) {
    return '';
  }

  return enabledCharacters.map(character => `**${character.name || '未命名人物'}**: ${character.content}`).join('\n');
}
