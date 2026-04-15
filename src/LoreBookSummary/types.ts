export type WorldbookSource = 'primary' | 'additional' | 'global' | 'chat';
export type EntryType = 'constant' | 'selective' | 'vectorized';

export type SourceStats = {
  total: number;
  constant: number;
  selective: number;
  vectorized: number;
  books: string[];
};

export type EntryStats = {
  uid: number;
  name: string;
  enabled: boolean;
  type: EntryType;
  tokens: number;
};

export type BookStats = {
  source: WorldbookSource;
  total: number;
  constant: number;
  selective: number;
  vectorized: number;
  entryCount: number;
  enabledCount: number;
  entries: EntryStats[];
};

export type WorldbookTokenStats = {
  total: number;
  constant: number;
  selective: number;
  vectorized: number;
  bySource: Record<WorldbookSource, SourceStats>;
  byWorldbook: Record<string, BookStats>;
  generatedAt: string;
  error?: string;
};

export type CollectOptions = {
  includeDisabled?: boolean;
  includeEntries?: boolean;
};
