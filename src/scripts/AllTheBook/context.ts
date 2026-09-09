import type { Logger } from '@util/common';

import { normalizeWorldbookName } from './text';

type ContextWorldbookSource = 'global' | 'character-primary' | 'character-additional' | 'chat';

function addWorldbookName(
  names: Set<string>,
  sourceCounts: Record<ContextWorldbookSource, number>,
  source: ContextWorldbookSource,
  name: string | null | undefined,
): void {
  const normalized = normalizeWorldbookName(name ?? '');
  if (!normalized) {
    return;
  }

  names.add(normalized);
  sourceCounts[source] += 1;
}

export function createContextSignature(worldbookNames: string[]): string {
  return worldbookNames.join('\u0001');
}

export function collectContextWorldbookNames(logger: Logger): string[] {
  const worldbookNames = new Set<string>();
  const sourceCounts: Record<ContextWorldbookSource, number> = {
    global: 0,
    'character-primary': 0,
    'character-additional': 0,
    chat: 0,
  };

  try {
    for (const worldbookName of getGlobalWorldbookNames()) {
      addWorldbookName(worldbookNames, sourceCounts, 'global', worldbookName);
    }
  } catch (error) {
    logger.warn('Failed to read global worldbook bindings.', error);
  }

  let hasCurrentCharacter = false;
  try {
    hasCurrentCharacter = Boolean(getCharData('current'));
  } catch (error) {
    logger.warn('Failed to determine current character status.', error);
  }

  if (hasCurrentCharacter) {
    try {
      const charWorldbooks = getCharWorldbookNames('current');
      addWorldbookName(worldbookNames, sourceCounts, 'character-primary', charWorldbooks.primary);
      for (const worldbookName of charWorldbooks.additional) {
        addWorldbookName(worldbookNames, sourceCounts, 'character-additional', worldbookName);
      }
    } catch (error) {
      logger.warn('Failed to read current character worldbook bindings.', error);
    }
  } else {
    logger.debug('No current character is available while collecting worldbooks.');
  }

  try {
    addWorldbookName(worldbookNames, sourceCounts, 'chat', getChatWorldbookName('current'));
  } catch (error) {
    logger.warn('Failed to read current chat worldbook binding.', error);
  }

  const result = [...worldbookNames].sort((lhs, rhs) => lhs.localeCompare(rhs));
  logger.debug(`Collected ${result.length} context worldbook(s).`, sourceCounts);
  return result;
}
