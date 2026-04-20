import type {
  BookStats,
  CollectOptions,
  EntryStats,
  EntryType,
  SourceStats,
  WorldbookSource,
  WorldbookTokenStats,
} from './types';

const createSourceStats = (): SourceStats => ({
  total: 0,
  constant: 0,
  selective: 0,
  vectorized: 0,
  books: [],
});

const normalizeEntryType = (entry: WorldbookEntry): EntryType => {
  const type = entry?.strategy?.type;
  if (type === 'constant' || type === 'selective' || type === 'vectorized') {
    return type;
  }
  console.warn('[WorldbookTokenStats] Unknown entry type, fallback to selective.', entry);
  return 'selective';
};

const getTokenCount = async (text: string): Promise<number> => {
  if (!text) return 0;
  try {
    return await SillyTavern.getTokenCountAsync(text);
  } catch (error) {
    console.error('[WorldbookTokenStats] getTokenCount error:', error);
  }
  return 0;
};

const collectWorldbookSources = (): Map<string, WorldbookSource> => {
  const sources = new Map<string, WorldbookSource>();

  let hasCurrentCharacter = false;
  try {
    hasCurrentCharacter = Boolean(getCharData('current'));
  } catch (error) {
    console.warn('[WorldbookTokenStats] Failed to read current character status.', error);
  }

  if (!hasCurrentCharacter) {
    console.info('[WorldbookTokenStats] No current character opened, skip character worldbooks.');
  } else {
    try {
      const charWorldbooks = getCharWorldbookNames('current');
      if (charWorldbooks.primary) {
        sources.set(charWorldbooks.primary, 'primary');
      }
      for (const name of charWorldbooks.additional) {
        if (!sources.has(name)) sources.set(name, 'additional');
      }
    } catch (error) {
      console.warn(
        '[WorldbookTokenStats] Failed to resolve current character worldbooks, continue without them.',
        error,
      );
    }
  }

  for (const name of getGlobalWorldbookNames()) {
    if (!sources.has(name)) sources.set(name, 'global');
  }

  try {
    const chatWorldbook = getChatWorldbookName('current');
    if (chatWorldbook && !sources.has(chatWorldbook)) {
      sources.set(chatWorldbook, 'chat');
    }
  } catch (error) {
    console.warn('[WorldbookTokenStats] Failed to resolve current chat worldbook, continue without it.', error);
  }

  return sources;
};

export const collectWorldbookTokenStats = async (options: CollectOptions = {}): Promise<WorldbookTokenStats> => {
  const includeDisabled = options.includeDisabled ?? false;
  const includeEntries = options.includeEntries ?? false;
  const stats: WorldbookTokenStats = {
    total: 0,
    constant: 0,
    selective: 0,
    vectorized: 0,
    bySource: {
      primary: createSourceStats(),
      additional: createSourceStats(),
      global: createSourceStats(),
      chat: createSourceStats(),
    },
    byWorldbook: {},
    generatedAt: new Date().toISOString(),
  };

  const sources = collectWorldbookSources();
  if (sources.size === 0) {
    console.info('[WorldbookTokenStats] No worldbooks bound to current context.');
    return stats;
  }

  for (const [name, source] of sources.entries()) {
    try {
      const worldbook = await getWorldbook(name);
      const bookStats: BookStats = {
        source,
        total: 0,
        constant: 0,
        selective: 0,
        vectorized: 0,
        entryCount: worldbook.length,
        enabledCount: 0,
        entries: [],
      };

      for (const entry of worldbook) {
        if (!entry.enabled && !includeDisabled) continue;
        if (entry.enabled) bookStats.enabledCount += 1;
        const entryTokens = await getTokenCount(entry.content ?? '');
        const type = normalizeEntryType(entry);
        const entryStats: EntryStats = {
          uid: entry.uid,
          name: entry.name || `UID:${entry.uid}`,
          enabled: entry.enabled,
          type,
          tokens: entryTokens,
        };

        bookStats.total += entryTokens;
        stats.total += entryTokens;
        stats.bySource[source].total += entryTokens;
        if (type === 'constant') {
          bookStats.constant += entryTokens;
          stats.constant += entryTokens;
          stats.bySource[source].constant += entryTokens;
        } else if (type === 'selective') {
          bookStats.selective += entryTokens;
          stats.selective += entryTokens;
          stats.bySource[source].selective += entryTokens;
        } else {
          bookStats.vectorized += entryTokens;
          stats.vectorized += entryTokens;
          stats.bySource[source].vectorized += entryTokens;
        }

        if (includeEntries) {
          bookStats.entries.push(entryStats);
        }
      }

      stats.byWorldbook[name] = bookStats;
      if (!stats.bySource[source].books.includes(name)) {
        stats.bySource[source].books.push(name);
      }
    } catch (error) {
      console.error(`[WorldbookTokenStats] Failed to read worldbook "${name}".`, error);
    }
  }

  return stats;
};

export const updateGlobalStats = (stats: WorldbookTokenStats): void => {
  (
    globalThis as {
      worldbookTokenStats?: { collect: typeof collectWorldbookTokenStats; last: WorldbookTokenStats };
    }
  ).worldbookTokenStats = { collect: collectWorldbookTokenStats, last: stats };
};
