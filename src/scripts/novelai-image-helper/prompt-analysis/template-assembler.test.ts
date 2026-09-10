import { describe, expect, test, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../settings/schema';
import { assemblePromptAnalysisMessages } from './template-assembler';

describe('prompt analysis message boundaries', () => {
  test('keeps supporting context separate from the latest-story insertion target', () => {
    vi.stubGlobal('getCharData', () => undefined);
    vi.stubGlobal('SillyTavern', {
      characterId: '',
      name1: '',
      name2: '',
      chatMetadata: {},
      getCurrentChatId: () => '',
    });

    const messages = assemblePromptAnalysisMessages(
      { paragraphs: ['clean latest paragraph'], history: 'history', worldbook: 'worldbook' },
      DEFAULT_SETTINGS,
    );

    expect(messages).toHaveLength(3);
    expect(messages[0]?.content).toContain('only in the latest story');
    expect(messages[0]?.content).toContain('reference-only');
    expect(messages[0]?.content).toContain('Prefer at least 3 insertions');
    expect(messages[0]?.content).toContain('early, middle, and late portions');
    expect(messages[0]?.content).toContain('Do not cluster all insertions');
    expect(messages[1]?.content).toContain('Wait for the next user message');
    expect(messages[2]?.content).toContain('[P1] clean latest paragraph');
  });
});
