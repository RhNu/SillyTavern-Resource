export function buildCardTaskKey(messageId: number, blockId: string) {
  return `${messageId}::${blockId}`;
}

export function normalizeAnchorSearchText(value: string): string {
  return value.replace(/\u00a0/g, ' ');
}
