import { describe, expect, it } from 'vitest';
import type { NotebookNote } from './contracts';
import {
  NotebookChangesSchema,
  moveNotebookNote,
  normalizeNotebookState,
  removeNotebookNote,
  resolveNotebookScopeKey,
  searchNotebookNotes,
  sortNotebookNotes,
} from './domain';

const note = (id: string, changes: Partial<NotebookNote> = {}): NotebookNote => ({
  id,
  title: id,
  html: '',
  tags: [],
  pinned: false,
  createdAt: 1,
  updatedAt: 1,
  ...changes,
});

describe('notebook scope keys', () => {
  it('isolates global, character, and owner-specific chat spaces', () => {
    const character = { characterId: '12', groupId: null, chatId: 'same.jsonl' };
    const group = { characterId: null, groupId: '12', chatId: 'same.jsonl' };
    expect(resolveNotebookScopeKey('global', character)).toBe('global');
    expect(resolveNotebookScopeKey('character', character)).toBe('character:12');
    expect(resolveNotebookScopeKey('chat', character)).not.toBe(resolveNotebookScopeKey('chat', group));
    expect(resolveNotebookScopeKey('chat', character)).not.toBe(
      resolveNotebookScopeKey('chat', { ...character, characterId: '13' }),
    );
  });

  it('does not make inaccessible character or chat spaces', () => {
    const absent = { characterId: null, groupId: null, chatId: null };
    expect(resolveNotebookScopeKey('character', absent)).toBeNull();
    expect(resolveNotebookScopeKey('chat', absent)).toBeNull();
    expect(resolveNotebookScopeKey('chat', { ...absent, characterId: '1' })).toBeNull();
    expect(resolveNotebookScopeKey('chat', { ...absent, chatId: 'chat' })).toBeNull();
  });

  it('escapes separators in IDs so different identities stay distinct', () => {
    const first = { characterId: 'a:b', groupId: null, chatId: 'c' };
    const second = { characterId: 'a', groupId: null, chatId: 'b:c' };
    expect(resolveNotebookScopeKey('chat', first)).not.toBe(resolveNotebookScopeKey('chat', second));
  });
});

describe('notebook note operations', () => {
  it('orders pinned notes first and moves within the same pin group', () => {
    const notes = [
      note('normal-a'),
      note('pinned-a', { pinned: true }),
      note('normal-b'),
      note('pinned-b', { pinned: true }),
    ];
    expect(sortNotebookNotes(notes).map(item => item.id)).toEqual(['pinned-a', 'pinned-b', 'normal-a', 'normal-b']);
    expect(moveNotebookNote(notes, 'pinned-b', -1)?.map(item => item.id)).toEqual([
      'normal-a',
      'pinned-b',
      'normal-b',
      'pinned-a',
    ]);
    expect(moveNotebookNote(notes, 'pinned-a', -1)).toBeNull();
    expect(moveNotebookNote(notes, 'missing', 1)).toBeNull();
    expect(notes[1].id).toBe('pinned-a');
  });

  it('removes only the requested note', () => {
    const notes = [note('a'), note('b'), note('c')];
    expect(removeNotebookNote(notes, 'b').map(item => item.id)).toEqual(['a', 'c']);
    expect(removeNotebookNote(notes, 'missing')).toHaveLength(3);
    expect(notes).toHaveLength(3);
  });

  it('rejects invalid edits while deduplicating valid tags', () => {
    expect(NotebookChangesSchema.safeParse({ pinned: 'yes' }).success).toBe(false);
    expect(NotebookChangesSchema.safeParse({ tags: ['valid', ''] }).success).toBe(false);
    expect(NotebookChangesSchema.parse({ tags: ['plot', 'plot', 'cast'] }).tags).toEqual(['plot', 'cast']);
  });

  it('searches visible content and tags without matching markup', () => {
    const notes = [
      note('a', { title: 'Alpha', html: '<p>Hello <strong>World</strong> &amp; friends</p>', tags: ['plot'] }),
      note('b', { title: 'Other', html: '<p>Nothing</p>', tags: ['cast'], pinned: true }),
    ];
    expect(searchNotebookNotes(notes, 'world').map(item => item.id)).toEqual(['a']);
    expect(searchNotebookNotes(notes, 'strong')).toEqual([]);
    expect(searchNotebookNotes(notes, '& friends').map(item => item.id)).toEqual(['a']);
    expect(searchNotebookNotes(notes, '', 'PLOT').map(item => item.id)).toEqual(['a']);
    expect(searchNotebookNotes(notes, '', 'missing')).toEqual([]);
    expect(searchNotebookNotes(notes, '').map(item => item.id)).toEqual(['b', 'a']);
  });
});

describe('notebook storage recovery', () => {
  it('keeps valid neighbors and distinct IDs while repairing malformed fields', () => {
    const state = normalizeNotebookState({
      version: 1,
      spaces: {
        global: [
          note('good', { tags: ['tag', 'tag'] }),
          { id: 'bad-fields', title: 7, html: null, tags: ['tag', 12], pinned: 'true', createdAt: -1 },
          note('good', { title: 'duplicate' }),
          { title: 'missing ID' },
        ],
        'character:one': 'corrupt',
      },
    });
    expect(state.version).toBe(1);
    expect(state.spaces.global.map(item => item.id)).toEqual(['good', 'bad-fields']);
    expect(state.spaces.global[0].tags).toEqual(['tag']);
    expect(state.spaces.global[1]).toMatchObject({ title: '', html: '', tags: [], pinned: false, createdAt: 0 });
    expect(state.spaces['character:one']).toBeUndefined();
  });

  it('recovers from missing or non-object state', () => {
    expect(normalizeNotebookState(undefined)).toEqual({ version: 1, spaces: {} });
    expect(normalizeNotebookState('corrupt')).toEqual({ version: 1, spaces: {} });
    expect(normalizeNotebookState({ spaces: null })).toEqual({ version: 1, spaces: {} });
  });
});
