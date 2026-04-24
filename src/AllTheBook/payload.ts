import type { Logger } from '@util/common';

import { MAX_TOKENS_PER_PROMPT } from './constants';
import { getStringKeys, normalizeDisplayName } from './text';
import type { PreparedScanPayload, SelectiveTargetEntry, TriggerTokenResult } from './types';

function includesInsensitive(haystack: string, needle: string): boolean {
  return haystack.toLocaleLowerCase().includes(needle.toLocaleLowerCase());
}

function wouldTriggerNegatedSecondary(
  primaryKey: string,
  secondaryKeys: string[],
  logic: WorldbookEntry['strategy']['keys_secondary']['logic'],
): boolean {
  const matchedSecondaryCount = secondaryKeys.filter(key => includesInsensitive(primaryKey, key)).length;

  if (logic === 'not_any') {
    return matchedSecondaryCount > 0;
  }

  if (logic === 'not_all') {
    return secondaryKeys.length > 0 && matchedSecondaryCount === secondaryKeys.length;
  }

  return false;
}

function choosePrimaryKey(entry: SelectiveTargetEntry, primaryKeys: string[]): {
  key: string;
  warningReason?: string;
} {
  const secondary = entry.strategy.keys_secondary;
  if (!secondary?.keys?.length || (secondary.logic !== 'not_any' && secondary.logic !== 'not_all')) {
    return { key: primaryKeys[0] };
  }

  const secondaryStringKeys = getStringKeys(secondary.keys);
  const safePrimaryKey = primaryKeys.find(key => !wouldTriggerNegatedSecondary(key, secondaryStringKeys, secondary.logic));
  if (safePrimaryKey) {
    return {
      key: safePrimaryKey,
      warningReason: secondaryStringKeys.length < secondary.keys.length ? 'negated_secondary_contains_regex_key' : undefined,
    };
  }

  return {
    key: primaryKeys[0],
    warningReason: 'primary_key_may_match_negated_secondary_key',
  };
}

export async function collectSelectiveEntries(worldbookNames: string[], logger: Logger): Promise<SelectiveTargetEntry[]> {
  const targets: SelectiveTargetEntry[] = [];

  for (const worldbookName of worldbookNames) {
    try {
      const worldbook = await getWorldbook(worldbookName);
      let selectiveCount = 0;

      for (const entry of worldbook) {
        if (!entry.enabled || entry.strategy.type !== 'selective') {
          continue;
        }

        selectiveCount += 1;
        targets.push({
          worldbookName,
          uid: entry.uid,
          name: normalizeDisplayName(entry.name || `UID:${entry.uid}`),
          strategy: entry.strategy,
        });
      }

      logger.debug(`Read worldbook '${worldbookName}'.`, {
        entries: worldbook.length,
        enabledSelectiveEntries: selectiveCount,
      });
    } catch (error) {
      logger.warn(`Failed to read worldbook '${worldbookName}'.`, error);
    }
  }

  logger.info(`Collected ${targets.length} enabled selective entrie(s) from ${worldbookNames.length} worldbook(s).`);
  return targets;
}

export function buildEntryTriggerTokens(entry: SelectiveTargetEntry): TriggerTokenResult {
  const primaryKeys = getStringKeys(entry.strategy.keys);
  if (primaryKeys.length === 0) {
    return {
      tokens: [],
      unresolvedReason: 'missing_primary_string_key',
    };
  }

  const primary = choosePrimaryKey(entry, primaryKeys);
  const tokens = [primary.key];
  const secondary = entry.strategy.keys_secondary;
  if (!secondary?.keys?.length) {
    return { tokens, warningReason: primary.warningReason };
  }

  const secondaryStringKeys = getStringKeys(secondary.keys);
  if (secondary.logic === 'and_any') {
    if (secondaryStringKeys.length === 0) {
      return {
        tokens: [],
        unresolvedReason: 'missing_secondary_string_key_for_and_any',
      };
    }

    tokens.push(secondaryStringKeys[0]);
    return { tokens, warningReason: primary.warningReason };
  }

  if (secondary.logic === 'and_all') {
    if (secondaryStringKeys.length === 0) {
      return {
        tokens: [],
        unresolvedReason: 'missing_secondary_string_key_for_and_all',
      };
    }

    if (secondaryStringKeys.length < secondary.keys.length) {
      return {
        tokens: [],
        unresolvedReason: 'contains_regex_secondary_key_for_and_all',
      };
    }

    tokens.push(...secondaryStringKeys);
    return { tokens, warningReason: primary.warningReason };
  }

  return { tokens, warningReason: primary.warningReason };
}

function chunkTokens(tokens: string[]): string[] {
  if (tokens.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  for (let index = 0; index < tokens.length; index += MAX_TOKENS_PER_PROMPT) {
    chunks.push(tokens.slice(index, index + MAX_TOKENS_PER_PROMPT).join('\n'));
  }

  return chunks;
}

export function buildPreparedScanPayload(signature: string, entries: SelectiveTargetEntry[]): PreparedScanPayload {
  const expectedActivatedKeys: string[] = [];
  const unresolvedEntries: string[] = [];
  const warningEntries: string[] = [];
  const tokenSet = new Set<string>();

  for (const entry of entries) {
    const entryKey = `${entry.worldbookName}.${entry.uid}`;
    const triggerTokens = buildEntryTriggerTokens(entry);
    if (triggerTokens.unresolvedReason) {
      unresolvedEntries.push(`${entryKey}:${entry.name}:${triggerTokens.unresolvedReason}`);
      continue;
    }

    if (triggerTokens.warningReason) {
      warningEntries.push(`${entryKey}:${entry.name}:${triggerTokens.warningReason}`);
    }

    expectedActivatedKeys.push(entryKey);
    for (const token of triggerTokens.tokens) {
      tokenSet.add(token);
    }
  }

  return {
    signature,
    expectedActivatedKeys,
    promptContents: chunkTokens([...tokenSet]),
    unresolvedEntries,
    warningEntries,
  };
}
