export type ChatGateway = ReturnType<typeof createChatGateway>;

export function createChatGateway() {
  return {
    getMessage(messageId: number) {
      return getChatMessages(messageId)[0];
    },
    getMessages(range: number | string) {
      return getChatMessages(range);
    },
    setMessages(messages: Parameters<typeof setChatMessages>[0], options?: Parameters<typeof setChatMessages>[1]) {
      return setChatMessages(messages, options);
    },
    getLastMessageId() {
      return getLastMessageId();
    },
    getCharacterWorldbookNames() {
      return getCharWorldbookNames('current');
    },
    getChatWorldbookName() {
      return getChatWorldbookName('current');
    },
    getWorldbook(name: string) {
      return getWorldbook(name);
    },
  };
}
