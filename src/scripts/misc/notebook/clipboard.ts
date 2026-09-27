import { getHostDomContext } from '@util/st/dom/host';

/** 优先保留 HTML 与纯文本；权限或上下文不允许时退回到纯文本复制。 */
export async function copyNotebookContent(text: string, html?: string): Promise<void> {
  const { doc, win } = getHostDomContext();
  const clipboard = win.navigator.clipboard;
  const ClipboardItemConstructor = (win as Window & typeof globalThis).ClipboardItem;

  if (clipboard?.write && ClipboardItemConstructor && html) {
    try {
      await clipboard.write([
        new ClipboardItemConstructor({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' }),
        }),
      ]);
      return;
    } catch (error) {
      console.warn('[Notebook] 富文本剪贴板写入失败，尝试纯文本。', error);
    }
  }

  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return;
    } catch (error) {
      console.warn('[Notebook] 剪贴板 API 写入失败，尝试浏览器复制命令。', error);
    }
  }

  const temporary = doc.createElement('textarea');
  temporary.value = text;
  temporary.setAttribute('readonly', '');
  temporary.style.position = 'fixed';
  temporary.style.opacity = '0';
  temporary.style.pointerEvents = 'none';
  doc.body.append(temporary);
  temporary.select();
  try {
    if (!doc.execCommand('copy')) throw new Error('浏览器拒绝了复制操作。');
  } finally {
    temporary.remove();
  }
}
