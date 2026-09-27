import { klona } from 'klona';
import { createLogger } from '@util/core/logger';
import { createScriptSettingsSync } from '@util/tavern-helper/state/script-settings';
import type { NotebookNote, NotebookRepository, NotebookState } from './contracts';
import {
  NotebookChangesSchema,
  moveNotebookNote,
  normalizeNotebookState,
  removeNotebookNote,
  searchNotebookNotes,
  sortNotebookNotes,
} from './domain';

const logger = createLogger('笔记本');

/** Keep all spaces under one script variable, leaving sibling script variables intact. */
export function createNotebookRepository(): NotebookRepository {
  const sync = createScriptSettingsSync<NotebookState>({
    key: 'notebook',
    parse: normalizeNotebookState,
    defaultValue: () => ({ version: 1, spaces: {} }),
    debounceMs: 500,
  });
  let state = sync.load();
  let destroyed = false;
  const listeners = new Set<() => void>();
  logger.info(`已加载 ${Object.keys(state.spaces).length} 个笔记空间。`);

  const ensureActive = () => {
    if (destroyed) throw new Error('笔记本已卸载');
  };
  const ensureScopeKey = (scopeKey: string) => {
    if (!scopeKey.trim()) throw new Error('笔记空间键不能为空');
    if (scopeKey === '__proto__' || scopeKey === 'constructor' || scopeKey === 'prototype') {
      throw new Error('笔记空间键无效');
    }
  };
  const emit = () => {
    listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        logger.error('笔记变更监听器执行失败。', error);
      }
    });
  };
  const commit = (draft: NotebookState) => {
    try {
      state = sync.schedule(draft);
      emit();
    } catch (error) {
      logger.error('安排保存笔记失败。', error);
      throw error;
    }
  };
  const inSpace = (scopeKey: string): NotebookNote[] => {
    ensureActive();
    ensureScopeKey(scopeKey);
    return Object.hasOwn(state.spaces, scopeKey) ? state.spaces[scopeKey] : [];
  };

  return {
    list(scopeKey) {
      return klona(sortNotebookNotes(inSpace(scopeKey)));
    },
    get(scopeKey, id) {
      const note = inSpace(scopeKey).find(item => item.id === id);
      return note && klona(note);
    },
    create(scopeKey, title = '') {
      const notes = inSpace(scopeKey);
      const now = Date.now();
      let id: string;
      do {
        id = globalThis.crypto?.randomUUID?.() ?? `${now.toString(36)}-${Math.random().toString(36).slice(2)}`;
      } while (notes.some(note => note.id === id));
      const note: NotebookNote = { id, title, html: '', tags: [], pinned: false, createdAt: now, updatedAt: now };
      const draft = klona(state);
      draft.spaces[scopeKey] = [...notes, note];
      commit(draft);
      logger.info('已创建笔记。', { scopeKey, id });
      return klona(note);
    },
    update(scopeKey, id, changes) {
      const notes = inSpace(scopeKey);
      const index = notes.findIndex(note => note.id === id);
      if (index < 0) return undefined;
      const parsed = NotebookChangesSchema.parse(changes);
      if (Object.keys(parsed).length === 0) return klona(notes[index]);
      const updated = { ...notes[index], ...parsed, updatedAt: Date.now() };
      const draft = klona(state);
      draft.spaces[scopeKey][index] = updated;
      commit(draft);
      logger.debug('已更新笔记。', { scopeKey, id, fields: Object.keys(parsed) });
      return klona(updated);
    },
    remove(scopeKey, id) {
      const notes = inSpace(scopeKey);
      const remaining = removeNotebookNote(notes, id);
      if (remaining.length === notes.length) return false;
      const draft = klona(state);
      draft.spaces[scopeKey] = remaining;
      commit(draft);
      logger.info('已删除笔记。', { scopeKey, id });
      return true;
    },
    move(scopeKey, id, offset) {
      const notes = inSpace(scopeKey);
      const moved = moveNotebookNote(notes, id, offset);
      if (!moved) return false;
      const draft = klona(state);
      draft.spaces[scopeKey] = moved;
      commit(draft);
      logger.info('已调整笔记顺序。', { scopeKey, id, offset });
      return true;
    },
    search(scopeKey, query, tag) {
      return klona(searchNotebookNotes(inSpace(scopeKey), query, tag));
    },
    subscribe(listener) {
      ensureActive();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    flush() {
      ensureActive();
      sync.flush();
      logger.debug('待保存笔记已写入脚本变量。');
    },
    destroy() {
      if (destroyed) return;
      try {
        sync.destroy();
      } finally {
        destroyed = true;
        listeners.clear();
        logger.info('笔记数据层已卸载。');
      }
    },
  };
}
