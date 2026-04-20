import _ from 'lodash';
import { POPUP_CONTENT_ID, sourceLabels } from './constants';
import { collectWorldbookTokenStats, updateGlobalStats } from './stats';
import type { BookStats, WorldbookTokenStats } from './types';

type RenderContent = string | JQuery<HTMLElement>;

const toast = (type: 'info' | 'success' | 'warning' | 'error', message: string, title?: string): void => {
  toastr[type](message, title);
};

const formatNumber = (value: number): string => value.toLocaleString();

const renderLoading = (): JQuery<HTMLElement> => $('<div>').attr('style', 'padding:12px 4px;').text('正在统计世界书…');

const renderError = (message: string): JQuery<HTMLElement> =>
  $('<div>').attr('style', 'padding:12px 4px;color:var(--SmartThemeUnderlineColor,#ff8080);').text(message);

const createCell = (value: string, options?: { alignRight?: boolean }): JQuery<HTMLElement> => {
  const alignStyle = options?.alignRight ? 'text-align:right;' : '';
  return $('<td>')
    .attr('style', `padding:6px 8px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);${alignStyle}`)
    .text(value);
};

const renderBookRow = (name: string, book: BookStats): JQuery<HTMLElement> => {
  const $row = $('<tr>');
  const $nameCell = $('<td>').attr(
    'style',
    'padding:6px 8px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);',
  );

  $nameCell
    .append($('<div>').text(name))
    .append(
      $('<div>').attr('style', 'font-size:0.8rem;opacity:0.7;').text(`启用 ${book.enabledCount}/${book.entryCount}`),
    );

  $row
    .append($nameCell)
    .append(createCell(sourceLabels[book.source]))
    .append(createCell(formatNumber(book.total), { alignRight: true }))
    .append(createCell(formatNumber(book.constant), { alignRight: true }))
    .append(createCell(formatNumber(book.selective), { alignRight: true }))
    .append(createCell(formatNumber(book.vectorized), { alignRight: true }));

  return $row;
};

const createSummaryCard = (label: string, value: number): JQuery<HTMLElement> =>
  $('<div>')
    .attr(
      'style',
      'padding:8px 10px;border-radius:8px;border:1px solid var(--SmartThemeBorderColor,#333);background:var(--SmartThemeBlurTintColor,#232323);',
    )
    .append($('<div>').attr('style', 'font-size:0.75rem;opacity:0.75;').text(label))
    .append($('<div>').attr('style', 'font-size:1.05rem;font-weight:600;margin-top:4px;').text(formatNumber(value)));

const renderStats = (stats: WorldbookTokenStats): JQuery<HTMLElement> => {
  const subtitle = `上次统计：${new Date(stats.generatedAt).toLocaleString()}`;
  const entries = _.orderBy(
    Object.entries(stats.byWorldbook) as Array<[string, BookStats]>,
    ([, book]) => book.total,
    'desc',
  );

  const $root = $('<div>').attr('style', 'display:flex;flex-direction:column;gap:12px;');
  const $header = $('<div>').attr(
    'style',
    'display:flex;align-items:flex-start;justify-content:space-between;gap:12px;',
  );
  const $title = $('<div>')
    .append($('<div>').attr('style', 'font-size:1.05rem;font-weight:600;').text('世界书统计'))
    .append($('<div>').attr('style', 'font-size:0.85rem;opacity:0.75;').text(subtitle));

  const $refreshButton = $('<button>')
    .addClass('menu_button')
    .attr('data-action', 'refresh')
    .attr('type', 'button')
    .attr(
      'style',
      'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:auto;min-width:0;white-space:nowrap;writing-mode:horizontal-tb;text-orientation:mixed;',
    )
    .text('重新统计');

  $header.append($title, $refreshButton);

  const $summary = $('<div>').attr('style', 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;');
  $summary
    .append(createSummaryCard('总词符数', stats.total))
    .append(createSummaryCard('常量', stats.constant))
    .append(createSummaryCard('选择', stats.selective))
    .append(createSummaryCard('向量', stats.vectorized));

  let $table: JQuery<HTMLElement>;
  if (entries.length === 0) {
    $table = $('<div>').attr('style', 'padding:8px 4px;opacity:0.8;').text('当前没有绑定世界书。');
  } else {
    const $tableWrapper = $('<div>').attr(
      'style',
      'border:1px solid var(--SmartThemeBorderColor,#333);border-radius:8px;overflow:hidden;',
    );
    const $tableElement = $('<table>').attr('style', 'width:100%;border-collapse:collapse;');
    const $tableHeader = $('<thead>');
    const $tableHeaderRow = $('<tr>').attr(
      'style',
      'background:rgba(255,255,255,0.05);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em;',
    );
    const $tableBody = $('<tbody>');

    [
      { text: '名称', alignRight: false },
      { text: '来源', alignRight: false },
      { text: '总数', alignRight: true },
      { text: '常量', alignRight: true },
      { text: '选择', alignRight: true },
      { text: '向量', alignRight: true },
    ].forEach(({ text, alignRight }) => {
      $tableHeaderRow.append(
        $('<th>')
          .attr('style', `padding:6px 8px;text-align:${alignRight ? 'right' : 'left'};`)
          .text(text),
      );
    });

    entries.forEach(([name, book]) => {
      $tableBody.append(renderBookRow(name, book));
    });

    $tableHeader.append($tableHeaderRow);
    $tableElement.append($tableHeader, $tableBody);
    $tableWrapper.append($tableElement);
    $table = $tableWrapper;
  }

  $root.append($header, $summary, $table);
  return $root;
};

let statsInFlight = false;

const resolveContentTarget = ($content: JQuery<HTMLElement>): JQuery<HTMLElement> => {
  const $dialogContent = $(`dialog[open]:not([closing]) #${POPUP_CONTENT_ID}`);
  return $dialogContent.length ? $dialogContent : $content;
};

const setContent = ($content: JQuery<HTMLElement>, content: RenderContent): JQuery<HTMLElement> => {
  const $target = resolveContentTarget($content);
  if (typeof content === 'string') {
    $target.html(content);
  } else {
    $target.empty().append(content);
  }
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
    if (_.isEmpty(stats.byWorldbook)) {
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
  const $content = $('<div>').attr('id', POPUP_CONTENT_ID).append(renderLoading());
  void SillyTavern.callGenericPopup($content, SillyTavern.POPUP_TYPE.DISPLAY, '世界书统计', {
    wide: true,
    large: true,
    allowVerticalScrolling: true,
    leftAlign: true,
  });

  console.info('[WorldbookTokenStats] Popup opened.');
  await runStatsAndRender($content);
};
