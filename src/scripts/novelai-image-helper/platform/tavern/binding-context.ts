import type { BindingContext } from '../../domain/binding';
import type { BindingRef } from '../../settings/schema';

function nonEmpty(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function binding(key: string, label: string): BindingRef | null {
  return key ? { key, label: label || key } : null;
}

export function getCurrentBindingContext(): BindingContext {
  const character = getCharData('current');
  let characterKey = '';
  if (character) {
    try {
      characterKey = nonEmpty(new RawCharacter(character).getAvatarId());
    } catch (error) {
      console.warn('[NovelAI Image Helper] 读取角色卡标识失败', error);
    }
  }

  characterKey ||= nonEmpty(SillyTavern.characterId) || nonEmpty(character?.name);
  const characterLabel = nonEmpty(character?.name) || nonEmpty(SillyTavern.name2) || characterKey;
  const chatKey = nonEmpty(SillyTavern.getCurrentChatId?.());
  const metadata = SillyTavern.chatMetadata as Record<string, unknown> | undefined;
  const chatLabel = nonEmpty(metadata?.chat_name) || nonEmpty(metadata?.name) || nonEmpty(metadata?.title) || chatKey;
  const personaKey = nonEmpty(SillyTavern.name1);

  return {
    character: binding(characterKey, characterLabel),
    chat: binding(chatKey, chatLabel),
    persona: binding(personaKey, personaKey),
  };
}

export type { BindingContext } from '../../domain/binding';
