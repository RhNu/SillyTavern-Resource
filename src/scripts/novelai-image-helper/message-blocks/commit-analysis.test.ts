import { afterEach, expect, test, vi } from 'vitest';
import { commitAnalysis } from './commit-analysis';
import { ChatImageRepository, VARIABLE_KEY } from './repository';
import { mockTavern } from './fixtures/tavern';
import { matchAnchors } from '../domain/anchor';

afterEach(() => vi.unstubAllGlobals());
function setup() {
  const host = mockTavern();
  const message = host.addMessage('短对白。');
  const input = {
    messageId: 0,
    originalText: message.swipes[0]!,
    layout: { blocks: [{ text: '短对白。', sourceEnd: 4, anchorId: 'A1' }] },
    assertCurrent: vi.fn(),
    repository: new ChatImageRepository(),
    response: {
      insertions: [
        { anchor_id: 'A1', summary: '场景', prompt: { main: { positive: 'scene', negative: '' }, characters: [] } },
      ],
    },
  };
  return { ...host, message, input };
}

test('validates all candidate IDs before persistence', async () => {
  const { input, write, setMessages } = setup();
  input.response.insertions[0]!.anchor_id = 'A999';
  await expect(commitAnalysis(input)).rejects.toThrow('不存在');
  expect(write).not.toHaveBeenCalled();
  expect(setMessages).not.toHaveBeenCalled();
});

test('keeps referenced records when finalization fails after the text was committed', async () => {
  const { input, message, state } = setup();
  vi.spyOn(input.repository, 'finalize').mockImplementationOnce(() => {
    throw new Error('disk unavailable');
  });
  await expect(commitAnalysis(input)).rejects.toThrow('disk unavailable');
  const id = matchAnchors(message.swipes[0]!)[0]!.id;
  expect(state.variables[VARIABLE_KEY].images[id]).toBeDefined();
  expect(state.variables[VARIABLE_KEY].images[id].pending).toBeUndefined();
});

test('keeps records if the host changes the text then rejects', async () => {
  const { input, message, setMessages } = setup();
  setMessages.mockImplementationOnce(async updates => {
    message.swipes[0] = updates[0]!.message;
    throw new Error('render failed');
  });
  await expect(commitAnalysis(input)).rejects.toThrow('render failed');
  const id = matchAnchors(message.swipes[0]!)[0]!.id;
  expect(input.repository.find(0, id)?.status).toBe('draft');
});

test('removes only its own prewrites when the host rejects without writing', async () => {
  const { input, state, setMessages } = setup();
  setMessages.mockRejectedValueOnce(new Error('write failed'));
  await expect(commitAnalysis(input)).rejects.toThrow('write failed');
  expect(state.variables[VARIABLE_KEY].images).toEqual({});
  expect(state.variables.unrelated).toEqual({ keep: true });
});

test('rechecks the target immediately before writing text', async () => {
  const { input, state, setMessages } = setup();
  input.assertCurrent
    .mockImplementationOnce(() => {})
    .mockImplementationOnce(() => {
      throw new Error('swipe changed');
    });
  await expect(commitAnalysis(input)).rejects.toThrow('swipe changed');
  expect(setMessages).not.toHaveBeenCalled();
  expect(state.variables[VARIABLE_KEY].images).toEqual({});
});
