import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { registerGeneratedChatBackground } from './chat-background-registry';

const saveMetadata = vi.fn<() => Promise<void>>();
const updateChatMetadata = vi.fn<(values: Record<string, unknown>, reset: boolean) => void>();

beforeEach(() => {
  vi.stubGlobal('SillyTavern', {
    chatMetadata: {},
    saveMetadata,
    updateChatMetadata,
  });
  saveMetadata.mockReset();
  saveMetadata.mockResolvedValue();
  updateChatMetadata.mockReset();
  updateChatMetadata.mockImplementation(values => Object.assign(SillyTavern.chatMetadata, values));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('registerGeneratedChatBackground', () => {
  test('appends a generated path without replacing existing chat backgrounds', async () => {
    SillyTavern.chatMetadata.chat_backgrounds = ['/images/existing.png'];

    await registerGeneratedChatBackground('/images/generated.png');

    expect(updateChatMetadata).toHaveBeenCalledWith(
      { chat_backgrounds: ['/images/existing.png', '/images/generated.png'] },
      false,
    );
    expect(saveMetadata).toHaveBeenCalledTimes(1);
  });

  test('deduplicates the registration but still persists again for a possible retry', async () => {
    SillyTavern.chatMetadata.chat_backgrounds = ['/images/generated.png'];

    await registerGeneratedChatBackground('/images/generated.png');

    expect(updateChatMetadata).not.toHaveBeenCalled();
    expect(saveMetadata).toHaveBeenCalledTimes(1);
  });

  test('normalizes a missing list when registering the first generated image', async () => {
    await registerGeneratedChatBackground('/images/generated.png');

    expect(updateChatMetadata).toHaveBeenCalledWith({ chat_backgrounds: ['/images/generated.png'] }, false);
  });

  test('wraps persistence errors as retryable association failures', async () => {
    saveMetadata.mockRejectedValueOnce(new Error('disk busy'));

    await expect(registerGeneratedChatBackground('/images/generated.png')).rejects.toMatchObject({
      code: 'ASSOCIATION_FAILED',
    });
  });
});
