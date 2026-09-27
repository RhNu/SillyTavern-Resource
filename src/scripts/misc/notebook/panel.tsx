import { getHostDomContext } from '@util/st/dom/host';
import { mountDraggableFloatingSurface } from '@util/ui/floating/surface';
import type {
  NotebookContext,
  NotebookNote,
  NotebookPanelSession,
  NotebookRepository,
  NotebookScope,
} from './contracts';
import { resolveNotebookScopeKey, sortNotebookNotes } from './domain';
import { mountNotebookEditorFrame, normalizeNotebookCopiedText, type NotebookEditorFrame } from './editor-frame';
import './panel.css';

const PANEL_ID = 'script-notebook-panel';
function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`笔记面板缺少 ${selector}`);
  return element;
}

function plainTextFromHtml(html: string): string {
  const container = new DOMParser().parseFromString(html, 'text/html').body;
  const parsedDoc = container.ownerDocument;
  container.querySelectorAll('br').forEach(br => br.replaceWith(parsedDoc.createTextNode('\n')));
  container
    .querySelectorAll('p,div,li,h1,h2,h3,blockquote,pre')
    .forEach(block => block.append(parsedDoc.createTextNode('\n')));
  return normalizeNotebookCopiedText(container.textContent ?? '').trimEnd();
}

/** Mounts the notebook in the host page while Quill owns only its isolated editor document. */
export function mountNotebookPanel(options: {
  repository: NotebookRepository;
  context: NotebookContext;
  onInsert(text: string): void;
  onCopy(text: string, html?: string): Promise<void>;
}): NotebookPanelSession {
  const { doc, win } = getHostDomContext();
  doc.getElementById(PANEL_ID)?.remove();
  const root = doc.createElement('section');
  root.id = PANEL_ID;
  root.className = 'nb-panel';
  root.setAttribute('script_id', getScriptId());
  root.setAttribute('aria-label', '笔记本');
  root.hidden = true;
  root.innerHTML = `
    <header class="nb-header nb-drag-handle">
      <strong><i class="fa-solid fa-book-open" aria-hidden="true"></i> 笔记本</strong>
      <span class="nb-save-status" role="status">已保存</span>
      <div class="nb-header-actions">
        <button type="button" data-action="maximize" aria-label="最大化或还原" title="最大化或还原"><i class="fa-solid fa-expand" aria-hidden="true"></i></button>
        <button type="button" data-action="close" aria-label="关闭笔记本" title="关闭"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
      </div>
    </header>
    <div class="nb-topbar">
      <label>空间 <select class="nb-scope" aria-label="笔记空间"><option value="global">全局</option><option value="character">角色卡</option><option value="chat">聊天</option></select></label>
      <button type="button" data-action="new" title="新建笔记"><i class="fa-solid fa-plus" aria-hidden="true"></i> 新建</button>
    </div>
    <div class="nb-body">
      <aside class="nb-sidebar">
        <input class="nb-search" type="search" placeholder="搜索标题或正文" aria-label="搜索笔记">
        <select class="nb-tag-filter" aria-label="按标签筛选"><option value="">全部标签</option></select>
        <div class="nb-note-list" role="tablist" aria-label="笔记列表"></div>
      </aside>
      <main class="nb-main">
        <div class="nb-empty">选择或新建一篇笔记</div>
        <div class="nb-note-content" hidden>
          <div class="nb-note-header">
            <input class="nb-title" type="text" maxlength="200" placeholder="笔记标题" aria-label="笔记标题">
            <div class="nb-note-actions">
              <button type="button" data-action="pin" title="置顶"><i class="fa-solid fa-thumbtack" aria-hidden="true"></i></button>
              <button type="button" data-action="up" title="向上移动"><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button>
              <button type="button" data-action="down" title="向下移动"><i class="fa-solid fa-arrow-down" aria-hidden="true"></i></button>
              <button type="button" data-action="delete" title="删除笔记"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
            </div>
          </div>
          <input class="nb-tags" type="text" placeholder="标签，用逗号分隔" aria-label="笔记标签">
          <div class="nb-editor-slot"></div>
          <div class="nb-footer">
            <button type="button" data-action="insert"><i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i> 插入输入框</button>
            <button type="button" data-action="copy"><i class="fa-solid fa-copy" aria-hidden="true"></i> 复制全文</button>
            <button type="button" data-action="copy-block" title="复制光标所在段落">复制当前段</button>
          </div>
        </div>
      </main>
    </div>`;

  const scopeSelect = requireElement<HTMLSelectElement>(root, '.nb-scope');
  const searchInput = requireElement<HTMLInputElement>(root, '.nb-search');
  const tagFilter = requireElement<HTMLSelectElement>(root, '.nb-tag-filter');
  const list = requireElement<HTMLElement>(root, '.nb-note-list');
  const empty = requireElement<HTMLElement>(root, '.nb-empty');
  const content = requireElement<HTMLElement>(root, '.nb-note-content');
  const titleInput = requireElement<HTMLInputElement>(root, '.nb-title');
  const tagsInput = requireElement<HTMLInputElement>(root, '.nb-tags');
  const editorSlot = requireElement<HTMLElement>(root, '.nb-editor-slot');
  const status = requireElement<HTMLElement>(root, '.nb-save-status');
  const pinButton = requireElement<HTMLButtonElement>(root, '[data-action="pin"]');
  let context = options.context;
  let scope: NotebookScope = 'global';
  let selectedId: string | null = null;
  let renderedIdentity: string | null = null;
  let isOpen = false;
  let destroyed = false;
  let maximized = false;
  let editor: NotebookEditorFrame | null = null;
  let savedTimer: number | undefined;
  let filterQuery = '';
  let filterTag = '';

  const floating = mountDraggableFloatingSurface({
    doc,
    win,
    root,
    className: 'nb-panel',
    dragHandle: '.nb-drag-handle',
    ignoreDragWithin: 'button, input, select',
    fallbackWidth: 760,
    fallbackHeight: 550,
    padding: 8,
    getDefaultPosition: ({ win: hostWin }) => ({
      x: Math.max(8, Math.round((hostWin.innerWidth - 760) / 2)),
      y: Math.max(8, Math.round((hostWin.innerHeight - 550) / 2)),
    }),
  });

  function scopeKey(): string | null {
    return resolveNotebookScopeKey(scope, context);
  }

  function showError(message: string, error?: unknown): void {
    console.error('[Notebook]', message, error);
    toastr.error(message, '笔记本');
  }

  function markSaving(): void {
    status.textContent = '保存中…';
    if (savedTimer !== undefined) win.clearTimeout(savedTimer);
    savedTimer = win.setTimeout(() => {
      savedTimer = undefined;
      try {
        options.repository.flush();
        status.textContent = '已保存';
      } catch (error) {
        status.textContent = '保存失败';
        showError('保存笔记失败。', error);
      }
    }, 700);
  }

  function currentNote(): NotebookNote | undefined {
    const key = scopeKey();
    return key && selectedId ? options.repository.get(key, selectedId) : undefined;
  }

  function updateNote(changes: Partial<Pick<NotebookNote, 'title' | 'html' | 'tags' | 'pinned'>>): void {
    const key = scopeKey();
    const id = selectedId;
    if (!key || !id) return;
    try {
      if (options.repository.update(key, id, changes)) markSaving();
    } catch (error) {
      showError('更新笔记失败。', error);
    }
  }

  function refresh(): void {
    if (destroyed) return;
    const key = scopeKey();
    scopeSelect.value = scope;
    scopeSelect.querySelector<HTMLOptionElement>('option[value="character"]')!.disabled = !resolveNotebookScopeKey(
      'character',
      context,
    );
    scopeSelect.querySelector<HTMLOptionElement>('option[value="chat"]')!.disabled = !resolveNotebookScopeKey(
      'chat',
      context,
    );
    if (!key) {
      list.replaceChildren();
      empty.textContent = scope === 'chat' ? '当前没有可用聊天' : '当前没有可用角色卡';
      empty.hidden = false;
      content.hidden = true;
      renderedIdentity = null;
      return;
    }
    const all = sortNotebookNotes(options.repository.list(key));
    if (!selectedId || !options.repository.get(key, selectedId)) selectedId = all[0]?.id ?? null;
    const tags = [...new Set(all.flatMap(note => note.tags))].sort((a, b) => a.localeCompare(b, 'zh'));
    if (filterTag && !tags.includes(filterTag)) filterTag = '';
    tagFilter.replaceChildren(new Option('全部标签', '', false, !filterTag));
    for (const tag of tags) tagFilter.add(new Option(tag, tag, false, tag === filterTag));
    const matches =
      filterQuery || filterTag ? options.repository.search(key, filterQuery, filterTag || undefined) : all;
    const visible = sortNotebookNotes(matches);
    const fragment = doc.createDocumentFragment();
    for (const note of visible) {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'nb-tab';
      button.dataset.noteId = note.id;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(note.id === selectedId));
      button.title = note.title || '无标题';
      if (note.pinned) {
        const pin = doc.createElement('i');
        pin.className = 'fa-solid fa-thumbtack';
        pin.setAttribute('aria-hidden', 'true');
        button.append(pin);
      }
      const label = doc.createElement('span');
      label.textContent = (note.title || '无标题').slice(0, 10);
      button.append(label);
      fragment.append(button);
    }
    list.replaceChildren(fragment);
    const note = currentNote();
    const identity = note ? `${key}\u0000${note.id}` : null;
    if (!note) {
      empty.textContent = all.length ? '没有匹配的笔记' : '选择“新建”开始记录';
      empty.hidden = false;
      content.hidden = true;
      renderedIdentity = null;
      editor?.setHtml('');
      return;
    }
    empty.hidden = true;
    content.hidden = false;
    pinButton.classList.toggle('is-active', note.pinned);
    pinButton.title = note.pinned ? '取消置顶' : '置顶';
    if (identity !== renderedIdentity) {
      renderedIdentity = identity;
      titleInput.value = note.title;
      tagsInput.value = note.tags.join(', ');
      editor?.setHtml(note.html);
    }
  }

  function selectScope(nextScope: NotebookScope): void {
    if (destroyed) return;
    const key = resolveNotebookScopeKey(nextScope, context);
    if (!key) {
      showError(nextScope === 'chat' ? '当前没有可用聊天。' : '当前没有可用角色卡。');
      scopeSelect.value = scope;
      return;
    }
    if (scope === nextScope) return;
    scope = nextScope;
    selectedId = null;
    renderedIdentity = null;
    filterQuery = '';
    filterTag = '';
    searchInput.value = '';
    console.info('[Notebook] 切换空间', { scope, key });
    refresh();
  }

  function open(noteId?: string): void {
    if (destroyed) return;
    const key = scopeKey();
    if (noteId && key && options.repository.get(key, noteId)) {
      selectedId = noteId;
      filterQuery = '';
      filterTag = '';
      searchInput.value = '';
    }
    root.hidden = false;
    isOpen = true;
    refresh();
    floating.recalculatePosition(false);
    console.info('[Notebook] 打开面板', { scope });
  }

  function close(): void {
    if (destroyed || !isOpen) return;
    root.hidden = true;
    isOpen = false;
    console.info('[Notebook] 关闭面板');
  }

  async function copyCurrent(blockOnly: boolean): Promise<void> {
    const note = currentNote();
    if (!note) return;
    const contentToCopy = blockOnly ? editor?.getCurrentBlock() : null;
    if (blockOnly && !contentToCopy) {
      showError('请先把光标放在需要复制的段落中。');
      return;
    }
    const text = blockOnly ? contentToCopy!.text : editor?.getPlainText() || plainTextFromHtml(note.html);
    const html = blockOnly ? contentToCopy!.html : (editor?.getHtml() ?? note.html);
    try {
      await options.onCopy(text, html);
      toastr.success(blockOnly ? '已复制当前段' : '已复制整篇笔记', '笔记本');
    } catch (error) {
      showError('复制笔记失败。', error);
    }
  }

  function onRootClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const tab = target?.closest<HTMLElement>('[data-note-id]');
    if (tab?.dataset.noteId) {
      selectedId = tab.dataset.noteId;
      refresh();
      return;
    }
    const action = target?.closest<HTMLButtonElement>('[data-action]')?.dataset.action;
    if (!action) return;
    const key = scopeKey();
    const note = currentNote();
    try {
      switch (action) {
        case 'close':
          close();
          break;
        case 'maximize':
          maximized = !maximized;
          root.classList.toggle('is-maximized', maximized);
          if (!maximized) floating.recalculatePosition(false);
          break;
        case 'new':
          if (!key) return;
          selectedId = options.repository.create(key, '新笔记').id;
          filterQuery = '';
          filterTag = '';
          searchInput.value = '';
          renderedIdentity = null;
          markSaving();
          refresh();
          titleInput.focus();
          titleInput.select();
          console.info('[Notebook] 新建笔记', { scope });
          break;
        case 'pin':
          if (note) updateNote({ pinned: !note.pinned });
          break;
        case 'up':
        case 'down':
          if (key && note && options.repository.move(key, note.id, action === 'up' ? -1 : 1)) markSaving();
          break;
        case 'delete':
          if (!key || !note || !win.confirm(`删除笔记“${note.title || '无标题'}”？此操作无法撤销。`)) return;
          {
            const ordered = sortNotebookNotes(options.repository.list(key));
            const index = ordered.findIndex(item => item.id === note.id);
            selectedId = ordered[index + 1]?.id ?? ordered[index - 1]?.id ?? null;
          }
          options.repository.remove(key, note.id);
          renderedIdentity = null;
          markSaving();
          refresh();
          console.info('[Notebook] 删除笔记', { scope });
          break;
        case 'insert':
          if (note) options.onInsert(editor?.getPlainText() || plainTextFromHtml(note.html));
          break;
        case 'copy':
          void copyCurrent(false);
          break;
        case 'copy-block':
          void copyCurrent(true);
          break;
      }
    } catch (error) {
      showError('笔记操作失败。', error);
    }
  }

  function onTitleInput(): void {
    updateNote({ title: titleInput.value });
  }

  function parseTags(): string[] {
    const tags = [
      ...new Set(
        tagsInput.value
          .split(/[,，]/)
          .map(tag => tag.trim())
          .filter(Boolean),
      ),
    ];
    return tags;
  }

  function onTagsInput(): void {
    updateNote({ tags: parseTags() });
  }

  function onTagsChange(): void {
    const tags = parseTags();
    updateNote({ tags });
    tagsInput.value = tags.join(', ');
  }

  function onScopeChange(): void {
    selectScope(scopeSelect.value as NotebookScope);
  }

  function onSearch(): void {
    filterQuery = searchInput.value;
    refresh();
  }

  function onTagFilter(): void {
    filterTag = tagFilter.value;
    refresh();
  }

  function onPageHide(): void {
    destroy();
  }

  const unsubscribe = options.repository.subscribe(refresh);
  editor = mountNotebookEditorFrame(doc, {
    html: '',
    onChange: html => updateNote({ html }),
    onReady: () => {
      const note = currentNote();
      editor?.setHtml(note?.html ?? '');
      console.info('[Notebook] 富文本编辑器已就绪');
    },
    onError: message => showError(message),
  });
  editorSlot.append(editor.element);
  root.addEventListener('click', onRootClick);
  titleInput.addEventListener('input', onTitleInput);
  tagsInput.addEventListener('input', onTagsInput);
  tagsInput.addEventListener('change', onTagsChange);
  scopeSelect.addEventListener('change', onScopeChange);
  searchInput.addEventListener('input', onSearch);
  tagFilter.addEventListener('change', onTagFilter);
  window.addEventListener('pagehide', onPageHide);
  refresh();
  console.info('[Notebook] 笔记面板已挂载');

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    if (savedTimer !== undefined) win.clearTimeout(savedTimer);
    try {
      options.repository.flush();
    } catch (error) {
      showError('关闭笔记面板时保存失败。', error);
    }
    unsubscribe();
    root.removeEventListener('click', onRootClick);
    titleInput.removeEventListener('input', onTitleInput);
    tagsInput.removeEventListener('input', onTagsInput);
    tagsInput.removeEventListener('change', onTagsChange);
    scopeSelect.removeEventListener('change', onScopeChange);
    searchInput.removeEventListener('input', onSearch);
    tagFilter.removeEventListener('change', onTagFilter);
    window.removeEventListener('pagehide', onPageHide);
    editor?.destroy();
    floating.destroy();
    root.remove();
    console.info('[Notebook] 笔记面板已卸载');
  }

  return {
    open,
    close,
    toggle() {
      if (isOpen) close();
      else open();
    },
    selectScope,
    setContext(nextContext) {
      if (destroyed) return;
      const previousKey = scopeKey();
      context = nextContext;
      if (!scopeKey()) scope = 'global';
      if (scopeKey() !== previousKey) {
        selectedId = null;
        renderedIdentity = null;
        console.info('[Notebook] 上下文已切换', { scope });
      }
      refresh();
    },
    destroy,
  };
}
