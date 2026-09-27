import { z } from 'zod';
import type { NotebookContext, NotebookNote, NotebookScope, NotebookState } from './contracts';

const TagSchema = z.string().trim().min(1);

export const NotebookNoteSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().catch(''),
  html: z.string().catch(''),
  tags: z
    .array(TagSchema)
    .catch([])
    .transform(tags => [...new Set(tags)]),
  pinned: z.boolean().catch(false),
  createdAt: z.number().int().nonnegative().catch(0),
  updatedAt: z.number().int().nonnegative().catch(0),
});

export const NotebookChangesSchema = z.object({
  title: z.string().optional(),
  html: z.string().optional(),
  tags: z
    .array(TagSchema)
    .transform(tags => [...new Set(tags)])
    .optional(),
  pinned: z.boolean().optional(),
});

const StoredStateSchema = z.object({
  spaces: z.record(z.string(), z.unknown()).catch({}),
});

/** Keys include the chat owner because chat IDs can recur across characters and groups. */
export function resolveNotebookScopeKey(scope: NotebookScope, context: NotebookContext): string | null {
  if (scope === 'global') return 'global';
  const characterId = context.characterId?.trim();
  const groupId = context.groupId?.trim();
  if (scope === 'character') return characterId ? `character:${encodeURIComponent(characterId)}` : null;
  const chatId = context.chatId?.trim();
  if (!chatId) return null;
  if (groupId) return `chat:group:${encodeURIComponent(groupId)}:${encodeURIComponent(chatId)}`;
  if (characterId) return `chat:character:${encodeURIComponent(characterId)}:${encodeURIComponent(chatId)}`;
  return null;
}

/** Recover valid entries within each space without allowing one damaged note to erase its neighbors. */
export function normalizeNotebookState(value: unknown): NotebookState {
  const source = StoredStateSchema.safeParse(value);
  const spaces: Record<string, NotebookNote[]> = Object.create(null) as Record<string, NotebookNote[]>;
  if (!source.success) return { version: 1, spaces };

  for (const [key, candidate] of Object.entries(source.data.spaces)) {
    if (!key || !Array.isArray(candidate)) continue;
    const seen = new Set<string>();
    const notes: NotebookNote[] = [];
    for (const raw of candidate) {
      const result = NotebookNoteSchema.safeParse(raw);
      if (!result.success || seen.has(result.data.id)) continue;
      seen.add(result.data.id);
      notes.push(result.data);
    }
    spaces[key] = notes;
  }
  return { version: 1, spaces };
}

/** Preserve stored manual order inside each pin group. */
export function sortNotebookNotes(notes: readonly NotebookNote[]): NotebookNote[] {
  return [...notes.filter(note => note.pinned), ...notes.filter(note => !note.pinned)];
}

export function removeNotebookNote(notes: readonly NotebookNote[], id: string): NotebookNote[] {
  return notes.filter(note => note.id !== id);
}

/** Move one place within the note's pin group, even when stored groups are interleaved. */
export function moveNotebookNote(notes: readonly NotebookNote[], id: string, offset: -1 | 1): NotebookNote[] | null {
  const index = notes.findIndex(note => note.id === id);
  if (index < 0) return null;
  const sameGroup = notes.flatMap((note, noteIndex) => (note.pinned === notes[index].pinned ? [noteIndex] : []));
  const position = sameGroup.indexOf(index);
  const destination = sameGroup[position + offset];
  if (destination === undefined) return null;
  const moved = [...notes];
  [moved[index], moved[destination]] = [moved[destination], moved[index]];
  return moved;
}

function htmlToSearchText(html: string): string {
  return html
    .replace(/<\/(?:p|div|li|h[1-6]|br)>|<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|quot|nbsp|#39);/gi, entity => {
      const replacements: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&nbsp;': ' ',
        '&#39;': "'",
      };
      return replacements[entity.toLowerCase()] ?? entity;
    });
}

/** Search visible text and tags, excluding HTML markup from matches. */
export function searchNotebookNotes(notes: readonly NotebookNote[], query: string, tag?: string): NotebookNote[] {
  const term = query.trim().toLocaleLowerCase();
  const selectedTag = tag?.trim().toLocaleLowerCase();
  return sortNotebookNotes(notes).filter(note => {
    if (selectedTag && !note.tags.some(value => value.toLocaleLowerCase() === selectedTag)) return false;
    if (!term) return true;
    return [note.title, htmlToSearchText(note.html), ...note.tags].some(value =>
      value.toLocaleLowerCase().includes(term),
    );
  });
}
