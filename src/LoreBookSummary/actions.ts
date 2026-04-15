import { POPUP_CONTENT_ID, sourceLabels } from './constants';
import { collectWorldbookTokenStats, updateGlobalStats } from './stats';
import type { BookStats, WorldbookTokenStats } from './types';

const toast = (type: 'info' | 'success' | 'warning' | 'error', message: string, title?: string): void => {
  toastr[type](message, title);
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, ch => {
    const table: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return table[ch] ?? ch;
  });

const formatNumber = (value: number): string => value.toLocaleString();

const renderLoading = (): string => `<div style="padding:12px 4px;">正在统计世界书…</div>`;

const renderError = (message: string): string =>
  `<div style="padding:12px 4px;color:var(--SmartThemeUnderlineColor,#ff8080);">${escapeHtml(message)}</div>`;

const renderBookRow = (name: string, book: BookStats): string => {
  const safeName = escapeHtml(name);
  return `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);">
        <div>${safeName}</div>
        <div style="font-size:0.8rem;opacity:0.7;">启用 ${book.enabledCount}/${book.entryCount}</div>
      </td>
      <td style="padding:6px 8px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);">${sourceLabels[book.source]}</td>
      <td style="padding:6px 8px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);text-align:right;">${formatNumber(
        book.total,
      )}</td>
      <td style="padding:6px 8px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);text-align:right;">${formatNumber(
        book.constant,
      )}</td>
      <td style="padding:6px 8px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);text-align:right;">${formatNumber(
        book.selective,
      )}</td>
      <td style="padding:6px 8px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);text-align:right;">${formatNumber(
        book.vectorized,
      )}</td>
    </tr>
  `;
};

const renderStats = (stats: WorldbookTokenStats): string => {
  const subtitle = `上次统计：${new Date(stats.generatedAt).toLocaleString()}`;
  const entries = Object.entries(stats.byWorldbook).sort((a, b) => b[1].total - a[1].total);
  const summaryCard = (label: string, value: number): string => `
    <div style="padding:8px 10px;border-radius:8px;border:1px solid var(--SmartThemeBorderColor,#333);background:var(--SmartThemeBlurTintColor,#232323);">
      <div style="font-size:0.75rem;opacity:0.75;">${label}</div>
      <div style="font-size:1.05rem;font-weight:600;margin-top:4px;">${formatNumber(value)}</div>
    </div>
  `;

  const table =
    entries.length === 0
      ? `<div style="padding:8px 4px;opacity:0.8;">当前没有绑定世界书。</div>`
      : `
        <div style="border:1px solid var(--SmartThemeBorderColor,#333);border-radius:8px;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:rgba(255,255,255,0.05);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em;">
                <th style="padding:6px 8px;text-align:left;">名称</th>
                <th style="padding:6px 8px;text-align:left;">来源</th>
                <th style="padding:6px 8px;text-align:right;">总数</th>
                <th style="padding:6px 8px;text-align:right;">常量</th>
                <th style="padding:6px 8px;text-align:right;">选择</th>
                <th style="padding:6px 8px;text-align:right;">向量</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(([name, book]) => renderBookRow(name, book)).join('')}
            </tbody>
          </table>
        </div>
      `;

  return `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-size:1.05rem;font-weight:600;">世界书统计</div>
          <div style="font-size:0.85rem;opacity:0.75;">${escapeHtml(subtitle)}</div>
        </div>
        <button class="menu_button" data-action="refresh" type="button">重新统计</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;">
        ${summaryCard('总 Tokens', stats.total)}
        ${summaryCard('常量', stats.constant)}
        ${summaryCard('选择', stats.selective)}
        ${summaryCard('向量', stats.vectorized)}
      </div>
      ${table}
    </div>
  `;
};

let statsInFlight = false;

const resolveContentTarget = ($content: JQuery<HTMLElement>): JQuery<HTMLElement> => {
  const $dialogContent = $(`dialog[open]:not([closing]) #${POPUP_CONTENT_ID}`);
  return $dialogContent.length ? $dialogContent : $content;
};

const setContent = ($content: JQuery<HTMLElement>, html: string): JQuery<HTMLElement> => {
  const $target = resolveContentTarget($content);
  $target.html(html);
  return $target;
};

const bindRefresh = ($content: JQuery<HTMLElement>): void => {
  const $target = resolveContentTarget($content);
  $target
    .find('[data-action="refresh"]')
    .off('click')
    .on('click', event => {
      event.preventDefault();
      void runStatsAndRender($content);
    });
};

const runStatsAndRender = async ($content: JQuery<HTMLElement>): Promise<void> => {
  if (statsInFlight) return;
  statsInFlight = true;
  setContent($content, renderLoading());

  const startAt = Date.now();
  console.info('[WorldbookTokenStats] Stats collection started.');
  try {
    const stats = await collectWorldbookTokenStats();
    updateGlobalStats(stats);
    setContent($content, renderStats(stats));
    bindRefresh($content);
    const duration = Date.now() - startAt;
    console.info('[WorldbookTokenStats] Stats collection finished.', {
      total: stats.total,
      books: Object.keys(stats.byWorldbook).length,
      durationMs: duration,
    });
    if (Object.keys(stats.byWorldbook).length === 0) {
      toast('info', '当前没有绑定世界书。', '世界书统计');
    } else {
      toast('success', `统计完成：${stats.total.toLocaleString()} Tokens`, '世界书统计');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '统计失败，请检查控制台日志。';
    console.error('[WorldbookTokenStats] Stats collection failed.', error);
    setContent($content, renderError(message));
    bindRefresh($content);
    toast('error', message, '世界书统计');
  } finally {
    statsInFlight = false;
  }
};

export const openPanel = async (): Promise<void> => {
  const $content = $(`<div id="${POPUP_CONTENT_ID}">${renderLoading()}</div>`);
  void SillyTavern.callGenericPopup($content, SillyTavern.POPUP_TYPE.DISPLAY, '世界书统计', {
    wide: true,
    large: true,
    allowVerticalScrolling: true,
    leftAlign: true,
  });

  console.info('[WorldbookTokenStats] Popup opened.');
  await runStatsAndRender($content);
};
