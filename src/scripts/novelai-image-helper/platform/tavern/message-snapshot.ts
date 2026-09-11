/** The numeric floor is only a lookup address; async work is bound to the actual message page. */
export function captureMessageSnapshot(messageId: number): () => void {
  const chatId = SillyTavern.getCurrentChatId();
  const message = getChatMessages(messageId, { include_swipes: true })[0];
  if (!message) throw new Error('目标消息不存在');
  const { swipe_id: swipeId, role } = message;
  const text = message.swipes[swipeId];
  return () => {
    if (SillyTavern.getCurrentChatId() !== chatId) throw new Error('聊天已切换，已取消旧任务');
    const latest = getChatMessages(messageId, { include_swipes: true })[0];
    if (!latest || latest.role !== role || latest.swipe_id !== swipeId || latest.swipes[swipeId] !== text) {
      throw new Error('目标消息页发生变化，已取消旧任务');
    }
  };
}
