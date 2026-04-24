export function normalizeWorldbookName(name: string): string {
  return name.trim();
}

export function normalizeDisplayName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

export function normalizeTriggerToken(token: string): string {
  return token.trim();
}

export function getStringKeys(keys: (string | RegExp)[]): string[] {
  return keys
    .filter((key): key is string => typeof key === 'string')
    .map(normalizeTriggerToken)
    .filter(Boolean);
}
