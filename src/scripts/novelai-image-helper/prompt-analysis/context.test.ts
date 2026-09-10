import { describe, expect, test, vi } from 'vitest';
import { buildHistory, buildWorldbook } from './context';

describe('prompt analysis context boundaries', () => {
  test('applies the internal cleanup rules to history messages', () => {
    vi.stubGlobal('getChatMessages', () => [
      { role: 'assistant', message: 'visible <think>do not send</think>' },
      { role: 'user', message: 'question' },
    ]);

    expect(
      buildHistory(2, 2, {
        extractRules: [],
        filterRules: ['block:<think>'],
      }),
    ).toBe('AI: visible\n\nUser: question');
  });

  test('passes enabled worldbook content through without story cleanup', async () => {
    vi.stubGlobal('getCharWorldbookNames', () => ({ primary: 'character-book', additional: [] }));
    vi.stubGlobal('getChatWorldbookName', () => undefined);
    vi.stubGlobal(
      'getWorldbook',
      vi.fn(async () => [
        {
          uid: 1,
          name: 'raw entry',
          enabled: true,
          content: '  <!-- keep this -->\n[[NovelAIImage id="keep-this"]]  ',
        },
      ]),
    );

    await expect(buildWorldbook()).resolves.toContain('  <!-- keep this -->\n[[NovelAIImage id="keep-this"]]  ');
  });
});
