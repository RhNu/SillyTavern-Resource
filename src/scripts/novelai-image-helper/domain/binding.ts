import type { BindingRef, CharacterBindings, CharacterLibraryEntry } from '../settings/schema.ts';

export type BindingContext = {
  character: BindingRef | null;
  chat: BindingRef | null;
  persona: BindingRef | null;
};

function matches(required: BindingRef | null, current: BindingRef | null): boolean {
  return required === null || required.key === current?.key;
}

/** All configured bindings are conjunctive; an unbound entry is globally active. */
export function characterMatchesContext(bindings: CharacterBindings, context: BindingContext): boolean {
  return (
    matches(bindings.character, context.character) &&
    matches(bindings.chat, context.chat) &&
    matches(bindings.persona, context.persona)
  );
}

export function resolveActiveCharacters(
  characters: CharacterLibraryEntry[],
  context: BindingContext,
): CharacterLibraryEntry[] {
  return characters.filter(character => character.enabled && characterMatchesContext(character.bindings, context));
}
