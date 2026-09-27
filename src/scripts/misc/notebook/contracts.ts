export type NotebookScope = 'global' | 'character' | 'chat';

export type NotebookContext = {
  characterId: string | null;
  groupId: string | null;
  chatId: string | null;
};

export type NotebookNote = {
  id: string;
  title: string;
  html: string;
  tags: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
};

export type NotebookState = {
  version: 1;
  spaces: Record<string, NotebookNote[]>;
};

export type NotebookRepository = {
  list(scopeKey: string): NotebookNote[];
  get(scopeKey: string, id: string): NotebookNote | undefined;
  create(scopeKey: string, title?: string): NotebookNote;
  update(
    scopeKey: string,
    id: string,
    changes: Partial<Pick<NotebookNote, 'title' | 'html' | 'tags' | 'pinned'>>,
  ): NotebookNote | undefined;
  remove(scopeKey: string, id: string): boolean;
  move(scopeKey: string, id: string, offset: -1 | 1): boolean;
  search(scopeKey: string, query: string, tag?: string): NotebookNote[];
  subscribe(listener: () => void): () => void;
  flush(): void;
  destroy(): void;
};

export type NotebookPanelSession = {
  open(noteId?: string): void;
  close(): void;
  toggle(): void;
  selectScope(scope: NotebookScope): void;
  setContext(context: NotebookContext): void;
  destroy(): void;
};
