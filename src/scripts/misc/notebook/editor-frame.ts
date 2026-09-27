/** Quill runs inside this iframe so its editor, selection, and clipboard share one document. */
const QUILL_SCRIPT = 'https://testingcf.jsdelivr.net/npm/quill@2.0.2/dist/quill.js';
const QUILL_STYLE = 'https://testingcf.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css';

type QuillRange = { index: number; length: number };
type QuillEditor = {
  root: HTMLElement;
  clipboard: { dangerouslyPasteHTML(index: number, html: string, source: string): void };
  getSelection(focus?: boolean): QuillRange | null;
  getText(index?: number, length?: number): string;
  getLength(): number;
  getSemanticHTML(index?: number, length?: number): string;
  setSelection(index: number, length: number, source: string): void;
  format(name: string, value: string, source: string): void;
  formatText(index: number, length: number, name: string, value: string, source: string): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
  enable(enabled: boolean): void;
};
type QuillConstructor = {
  new (container: Element, options: Record<string, unknown>): QuillEditor;
  import(path: string): { whitelist?: string[] };
  register(target: unknown, overwrite?: boolean): void;
};

export type NotebookEditorFrame = {
  element: HTMLIFrameElement;
  setHtml(html: string): void;
  getHtml(): string;
  getPlainText(): string;
  getCurrentBlock(): { text: string; html: string } | null;
  focus(): void;
  destroy(): void;
};

export function normalizeNotebookCopiedText(text: string): string {
  // Quill already gives one newline per paragraph, including intentional empty paragraphs.
  return text.replace(/\r\n?/g, '\n');
}

const frameHtml = `<!doctype html>
<html><head><meta charset="utf-8"><link rel="stylesheet" href="${QUILL_STYLE}">
<style>
  html,body{height:100%;margin:0;background:transparent;color:inherit;font:inherit}
  body{display:flex;flex-direction:column;overflow:hidden}
  #toolbar{flex:none;border:0;border-bottom:1px solid currentColor;background:color-mix(in srgb,currentColor 8%,transparent);padding:5px 6px;display:flex;flex-wrap:wrap;align-items:center;gap:2px}
  #toolbar button,#toolbar select{width:auto!important;min-width:22px!important;height:28px!important;color:inherit!important;background:transparent!important;border:0!important;white-space:nowrap!important;writing-mode:horizontal-tb!important}
  #toolbar .ql-formats{margin:0 6px 0 0!important;display:flex;align-items:center;gap:2px}
  #toolbar input{width:58px!important;height:26px!important;margin:0 2px!important;padding:2px 4px!important;color:inherit!important;background:transparent!important;border:1px solid currentColor!important;border-radius:4px!important}
  #toolbar .nb-size-apply{width:auto!important;font-size:12px!important;padding:0 5px!important;border:1px solid currentColor!important;border-radius:4px!important}
  .ql-toolbar.ql-snow{font-family:inherit}.ql-snow .ql-stroke{stroke:currentColor}.ql-snow .ql-fill{fill:currentColor}
  .ql-container.ql-snow{border:0;min-height:0;flex:1;font:inherit;overflow:auto}
  .ql-editor{min-height:100%;padding:14px;overflow-wrap:anywhere;color:inherit}
  .ql-editor p{min-height:1em}.ql-editor p:empty::before{content:'\\00a0'}
  .ql-editor.ql-blank::before{color:inherit;opacity:.6;font-style:normal}
</style><script src="${QUILL_SCRIPT}"></script></head><body>
<div id="toolbar">
 <span class="ql-formats"><select class="ql-header" title="标题"><option selected></option><option value="1">标题 1</option><option value="2">标题 2</option><option value="3">标题 3</option></select></span>
 <span class="ql-formats"><button class="ql-bold" title="粗体"></button><button class="ql-italic" title="斜体"></button><button class="ql-underline" title="下划线"></button><button class="ql-strike" title="删除线"></button></span>
 <span class="ql-formats"><button class="ql-blockquote" title="引用"></button><button class="ql-code-block" title="代码块"></button></span>
 <span class="ql-formats"><button class="ql-list" value="ordered" title="编号列表"></button><button class="ql-list" value="bullet" title="项目符号列表"></button><button class="ql-link" title="链接"></button></span>
 <span class="ql-formats"><select class="ql-color" title="文字颜色"></select><select class="ql-background" title="背景颜色"></select><button class="ql-clean" title="清除格式"></button></span>
 <input id="exact-size" type="number" min="8" max="96" step="1" value="16" aria-label="字号（像素）" title="精确字号（像素）"><button id="apply-size" class="nb-size-apply" type="button" title="应用字号">px</button>
</div><div id="editor"></div></body></html>`;

/** Mount an isolated Quill editor and bridge only serializable note content to the host panel. */
export function mountNotebookEditorFrame(
  doc: Document,
  options: { html: string; onChange(html: string): void; onReady(): void; onError(message: string): void },
): NotebookEditorFrame {
  const frame = doc.createElement('iframe');
  frame.className = 'nb-editor-frame';
  frame.title = '笔记富文本编辑器';
  frame.srcdoc = frameHtml;
  let pendingHtml = options.html;
  let quill: QuillEditor | null = null;
  let destroyed = false;
  let lastRange: QuillRange | null = null;
  let textChange: ((...args: unknown[]) => void) | null = null;
  let selectionChange: ((...args: unknown[]) => void) | null = null;
  let removeListeners: (() => void) | null = null;

  const onLoad = () => {
    if (destroyed) return;
    const frameDoc = frame.contentDocument;
    const frameWin = frame.contentWindow as (Window & { Quill?: QuillConstructor }) | null;
    const Quill = frameWin?.Quill;
    const editor = frameDoc?.getElementById('editor');
    if (!frameDoc || !Quill || !editor) {
      options.onError('富文本编辑器加载失败，请检查网络连接后重新打开笔记。');
      return;
    }
    try {
      const hostStyle = doc.defaultView?.getComputedStyle(frame.parentElement ?? doc.body);
      if (hostStyle) {
        frameDoc.documentElement.style.color = hostStyle.color;
        frameDoc.documentElement.style.fontFamily = hostStyle.fontFamily;
        frameDoc.documentElement.style.fontSize = hostStyle.fontSize;
      }
      // Quill's style attributor accepts the exact pixel sizes exposed in our small size input.
      const sizeStyle = Quill.import('attributors/style/size');
      sizeStyle.whitelist = Array.from({ length: 89 }, (_, index) => `${index + 8}px`);
      Quill.register(sizeStyle, true);
      quill = new Quill(editor, { theme: 'snow', modules: { toolbar: '#toolbar' }, placeholder: '在这里写下笔记…' });
      quill.clipboard.dangerouslyPasteHTML(0, pendingHtml, 'silent');
      textChange = (_delta, _old, source) => {
        if (source === 'user' && quill) options.onChange(quill.root.innerHTML);
      };
      selectionChange = range => {
        if (range && typeof range === 'object') lastRange = range as QuillRange;
      };
      quill.on('text-change', textChange);
      quill.on('selection-change', selectionChange);

      const sizeInput = frameDoc.getElementById('exact-size') as HTMLInputElement;
      const sizeButton = frameDoc.getElementById('apply-size') as HTMLButtonElement;
      const applySize = () => {
        if (!quill) return;
        const pixels = Number(sizeInput.value);
        if (!Number.isInteger(pixels) || pixels < 8 || pixels > 96) {
          options.onError('字号请输入 8–96 之间的整数。');
          return;
        }
        const range = quill.getSelection() ?? lastRange;
        if (range?.length) quill.formatText(range.index, range.length, 'size', `${pixels}px`, 'user');
        else {
          if (range) quill.setSelection(range.index, 0, 'silent');
          quill.format('size', `${pixels}px`, 'user');
        }
      };
      const onSizeKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          applySize();
        }
      };
      const onCopy = (event: ClipboardEvent) => {
        if (!quill || !event.clipboardData) return;
        const range = quill.getSelection();
        if (!range?.length) return;
        event.clipboardData.setData(
          'text/plain',
          normalizeNotebookCopiedText(quill.getText(range.index, range.length)),
        );
        event.clipboardData.setData('text/html', quill.getSemanticHTML(range.index, range.length));
        event.preventDefault();
      };
      sizeButton.addEventListener('click', applySize);
      sizeInput.addEventListener('keydown', onSizeKeyDown);
      quill.root.addEventListener('copy', onCopy);
      removeListeners = () => {
        sizeButton.removeEventListener('click', applySize);
        sizeInput.removeEventListener('keydown', onSizeKeyDown);
        quill?.root.removeEventListener('copy', onCopy);
      };
      options.onReady();
    } catch (error) {
      options.onError(error instanceof Error ? error.message : String(error));
    }
  };
  frame.addEventListener('load', onLoad);

  return {
    element: frame,
    setHtml(html) {
      pendingHtml = html;
      if (!quill) return;
      quill.clipboard.dangerouslyPasteHTML(0, html, 'silent');
      lastRange = null;
    },
    getHtml: () => quill?.root.innerHTML ?? pendingHtml,
    getPlainText: () => normalizeNotebookCopiedText(quill?.getText() ?? ''),
    getCurrentBlock() {
      if (!quill) return null;
      const selection = quill.getSelection() ?? lastRange;
      if (!selection) return null;
      const all = quill.getText();
      const start = all.lastIndexOf('\n', Math.max(0, selection.index - 1)) + 1;
      const nextNewline = all.indexOf('\n', selection.index);
      const end = nextNewline < 0 ? all.length : nextNewline + 1;
      return {
        text: normalizeNotebookCopiedText(quill.getText(start, end - start)).trimEnd(),
        html: quill.getSemanticHTML(start, end - start),
      };
    },
    focus: () => quill?.root.focus(),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      frame.removeEventListener('load', onLoad);
      removeListeners?.();
      if (quill && textChange) quill.off('text-change', textChange);
      if (quill && selectionChange) quill.off('selection-change', selectionChange);
      quill?.enable(false);
      frame.remove();
      quill = null;
    },
  };
}
