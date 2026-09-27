import { getHostDomContext } from '@util/st/dom/host';

/** 将笔记纯文本插入酒馆输入框当前选区，不触发发送。 */
export function insertNotebookTextIntoChat(text: string): void {
  const { doc } = getHostDomContext();
  const input = doc.querySelector<HTMLTextAreaElement>('#send_textarea');
  if (!input) throw new Error('找不到酒馆输入框。');

  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  input.setRangeText(text, start, end, 'end');
  input.dispatchEvent(new (doc.defaultView?.Event ?? Event)('input', { bubbles: true }));
  input.focus();
}
