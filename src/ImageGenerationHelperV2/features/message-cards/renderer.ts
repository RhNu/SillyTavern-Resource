import { clampCarouselIndex } from '@/ImageGenerationHelperV2/features/message-cards/ui-state';

export type RenderCardState = {
  id: string;
  prompt: string;
  mediaUrls: string[];
  preventAuto: boolean;
  isScheduled: boolean;
  messageId: number;
  blockOrder: number;
};

function encodeMediaUrl(url: string): string {
  try {
    return encodeURI(url);
  } catch {
    return url;
  }
}

function buildCardPositionText(mediaCount: number, currentIndex: number): string {
  return mediaCount > 0 ? `${currentIndex + 1} / ${mediaCount}` : '0 / 0';
}

function buildCardStatusText(state: RenderCardState, isGenerating: boolean): string {
  if (isGenerating) {
    return '生成中';
  }
  if (state.isScheduled) {
    return '已排队';
  }
  if (state.mediaUrls.length > 0) {
    return '已生成';
  }
  return state.preventAuto ? '等待触发生成' : '等待生成';
}

export function renderMessageCard(
  $card: JQuery<HTMLElement>,
  state: RenderCardState,
  options: { isGenerating: boolean; currentIndex?: number; collapsed?: boolean },
) {
  const currentIndex = clampCarouselIndex(options.currentIndex, state.mediaUrls.length);
  const currentUrl = state.mediaUrls[currentIndex] ?? '';
  const collapsed = options.collapsed ?? false;
  const $viewport = $('<div class="imggen-message-card__viewport">').attr('aria-expanded', String(!collapsed));
  const statusText = buildCardStatusText(state, options.isGenerating);
  const positionText = buildCardPositionText(state.mediaUrls.length, currentIndex);

  $card
    .attr('data-imggen-message-id', String(state.messageId))
    .attr('data-imggen-block-id', state.id)
    .toggleClass('is-collapsed', collapsed)
    .empty();

  if (currentUrl) {
    $viewport.append(
      $('<img class="imggen-message-card__image" />')
        .attr('src', encodeMediaUrl(currentUrl))
        .attr('alt', state.prompt || `图片块 ${state.blockOrder + 1}`),
    );
  } else {
    $viewport.append(
      $('<div class="imggen-message-card__placeholder">').text(
        state.isScheduled ? '请求中...' : state.preventAuto ? '等待触发生成...' : '等待生成...',
      ),
    );
  }

  $viewport.append(
    $('<div class="imggen-message-card__summary">')
      .append(
        $('<span class="imggen-message-card__title">').text(`消息 ${state.messageId} · 图片块 ${state.blockOrder + 1}`),
      )
      .append($('<span class="imggen-message-card__meta">').text(`${positionText} · ${statusText}`)),
  );

  $viewport
    .append(
      $('<button type="button" class="imggen-message-card__hotspot imggen-message-card__hotspot--top">')
        .attr('data-imggen-action', 'toggle-collapse')
        .attr('aria-label', collapsed ? '展开图片块' : '折叠图片块'),
    )
    .append(
      $('<button type="button" class="imggen-message-card__hotspot imggen-message-card__hotspot--left">')
        .attr('data-imggen-action', 'prev')
        .attr('aria-label', '上一张图片'),
    )
    .append(
      $('<button type="button" class="imggen-message-card__hotspot imggen-message-card__hotspot--right">')
        .attr('data-imggen-action', 'next-or-gen')
        .attr('aria-label', '下一张图片或生成图片'),
    )
    .append(
      $('<button type="button" class="imggen-message-card__hotspot imggen-message-card__hotspot--bottom">')
        .attr('data-imggen-action', 'edit-prompt')
        .attr('aria-label', '编辑提示词'),
    )
    .append(
      $('<button type="button" class="imggen-message-card__hotspot imggen-message-card__hotspot--center">')
        .attr('data-imggen-action', 'center-action')
        .attr('aria-label', currentUrl ? '放大预览图片' : '生成图片'),
    );

  $card.append($viewport);
}
