import { vi } from 'vitest';
import { createImageBlock } from '../../domain/block';

export function imageBlock(id: string) {
  return createImageBlock({
    id,
    summary: '场景',
    prompt: { main: { positive: 'scene', negative: '' }, characters: [] },
  });
}

/** Host mock deliberately rejects message-variable access: the new store must never touch it. */
export function mockTavern() {
  const state = {
    chatId: 'chat-one',
    variables: { unrelated: { keep: true } } as Record<string, any>,
    messages: [] as Array<{ message_id: number; role: string; swipe_id: number; swipes: string[] }>,
  };
  vi.stubGlobal('SillyTavern', { getCurrentChatId: () => state.chatId });
  vi.stubGlobal(
    'getVariables',
    vi.fn((option: { type: string }) => {
      if (option.type !== 'chat') throw new Error('Message variables must not be accessed');
      return structuredClone(state.variables);
    }),
  );
  const write = vi.fn((updater: (variables: Record<string, any>) => Record<string, any>, option: { type: string }) => {
    if (option.type !== 'chat') throw new Error('Message variables must not be accessed');
    state.variables = structuredClone(updater(structuredClone(state.variables)));
    return structuredClone(state.variables);
  });
  vi.stubGlobal('updateVariablesWith', write);
  vi.stubGlobal('getChatMessages', (range: string | number, options?: { include_swipes: boolean }) => {
    const messages = state.messages.filter(message => typeof range === 'string' || message.message_id === range);
    return messages.map(message =>
      options?.include_swipes
        ? structuredClone(message)
        : {
            message_id: message.message_id,
            role: message.role,
            message: message.swipes[message.swipe_id],
          },
    );
  });
  const setMessages = vi.fn(async (updates: Array<{ message_id: number; message: string }>) => {
    updates.forEach(update => {
      const message = state.messages.find(message => message.message_id === update.message_id)!;
      message.swipes[message.swipe_id] = update.message;
    });
  });
  vi.stubGlobal('setChatMessages', setMessages);
  const addMessage = (text: string, swipes = [text]) => {
    const message = { message_id: state.messages.length, role: 'assistant', swipe_id: 0, swipes };
    state.messages.push(message);
    return message;
  };
  return { state, write, setMessages, addMessage };
}
