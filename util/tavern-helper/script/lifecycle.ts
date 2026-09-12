export function reloadOnChatChange(): EventOnReturn {
  let chatId = SillyTavern.getCurrentChatId();
  return eventOn(tavern_events.CHAT_CHANGED, newChatId => {
    if (chatId === newChatId) return;
    chatId = newChatId;
    window.location.reload();
  });
}
