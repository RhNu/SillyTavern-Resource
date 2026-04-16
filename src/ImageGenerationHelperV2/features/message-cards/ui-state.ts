import { DEFAULT_RENDER_LATEST_REF_MESSAGES_COUNT } from '@/ImageGenerationHelperV2/config/defaults';

export function normalizeRenderLatestRefMessagesCount(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_RENDER_LATEST_REF_MESSAGES_COUNT;
  }

  return Math.max(1, Math.min(999, Math.floor(value!)));
}

export function resolveRenderableRefMessageIds(messageIds: number[], enabled: boolean, count: number): number[] {
  const uniqueIds = [...new Set(messageIds.filter(messageId => Number.isFinite(messageId)))];
  if (!enabled) {
    return uniqueIds;
  }

  return uniqueIds.slice(-normalizeRenderLatestRefMessagesCount(count));
}

export function clampCarouselIndex(index: number | undefined, total: number): number {
  if (total <= 0) {
    return 0;
  }

  if (!Number.isFinite(index)) {
    return total - 1;
  }

  return Math.max(0, Math.min(total - 1, Math.floor(index!)));
}

export function removeMediaUrlAtIndex(urls: string[], index: number): string[] {
  if (!Array.isArray(urls) || urls.length === 0) {
    return [];
  }

  const normalizedIndex = clampCarouselIndex(index, urls.length);
  return urls.filter((_, currentIndex) => currentIndex !== normalizedIndex);
}
