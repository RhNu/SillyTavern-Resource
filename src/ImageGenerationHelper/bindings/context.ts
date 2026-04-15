import { logWarn } from '@/ImageGenerationHelper/core/log';

export type BindingRef = {
  key: string;
  label: string;
};

export type CharacterBindings = {
  character: BindingRef | null;
  chat: BindingRef | null;
  persona: BindingRef | null;
};

export type PromptCharacter = {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
  bindings: CharacterBindings;
};

export type BindingContext = {
  character: BindingRef | null;
  chat: BindingRef | null;
  persona: BindingRef | null;
  personaAvailable: boolean;
};

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function pickFirstString(...values: unknown[]): string {
  for (const value of values) {
    const next = readString(value);
    if (next) {
      return next;
    }
  }

  return '';
}

export function createBindingRef(key: string, label?: string): BindingRef {
  const trimmedKey = key.trim();
  return {
    key: trimmedKey,
    label: label?.trim() || trimmedKey,
  };
}

export function createEmptyBindings(): CharacterBindings {
  return {
    character: null,
    chat: null,
    persona: null,
  };
}

export function createPromptCharacter(
  partial?: Partial<Omit<PromptCharacter, 'id' | 'bindings'>> & { bindings?: Partial<CharacterBindings> },
): PromptCharacter {
  return {
    id: crypto.randomUUID(),
    name: partial?.name ?? '',
    content: partial?.content ?? '',
    enabled: partial?.enabled ?? true,
    bindings: {
      ...createEmptyBindings(),
      ...partial?.bindings,
    },
  };
}

function readCurrentCharacterBinding(): BindingRef | null {
  const currentCharacter = getCharData('current');
  if (!currentCharacter) {
    return null;
  }

  let key = '';

  try {
    key = readString(new RawCharacter(currentCharacter).getAvatarId());
  } catch (error) {
    logWarn('读取当前角色卡标识失败', error);
  }

  key ||= pickFirstString(SillyTavern.characterId, currentCharacter.name);
  if (!key) {
    return null;
  }

  return createBindingRef(key, pickFirstString(currentCharacter.name, SillyTavern.name2, key));
}

function readCurrentChatBinding(): BindingRef | null {
  const chatKey = pickFirstString(
    typeof SillyTavern.getCurrentChatId === 'function' ? SillyTavern.getCurrentChatId() : '',
  );
  if (!chatKey) {
    return null;
  }

  const metadata = SillyTavern.chatMetadata as Record<string, unknown> | undefined;
  return createBindingRef(
    chatKey,
    pickFirstString(metadata?.chat_name, metadata?.name, metadata?.title, metadata?.file_name, chatKey),
  );
}

function readCurrentPersonaBinding(): BindingRef | null {
  const personaName = pickFirstString(SillyTavern.name1);
  if (!personaName) {
    return null;
  }

  return createBindingRef(personaName, personaName);
}

export function getCurrentBindingContext(): BindingContext {
  const persona = readCurrentPersonaBinding();

  return {
    character: readCurrentCharacterBinding(),
    chat: readCurrentChatBinding(),
    persona,
    personaAvailable: Boolean(persona),
  };
}

function matchesBinding(required: BindingRef | null, current: BindingRef | null): boolean {
  if (!required) {
    return true;
  }

  return Boolean(current && required.key === current.key);
}

export function matchesBindingContext(bindings: CharacterBindings, context: BindingContext): boolean {
  return (
    matchesBinding(bindings.character, context.character) &&
    matchesBinding(bindings.chat, context.chat) &&
    matchesBinding(bindings.persona, context.persona)
  );
}

export function resolvePromptCharacters(
  characters: PromptCharacter[],
  context = getCurrentBindingContext(),
): PromptCharacter[] {
  return characters.filter(character => character.enabled && matchesBindingContext(character.bindings, context));
}
