import { IMGGEN_BLOCK_STATE_UPDATED_EVENT, SCRIPT_DISPLAY_NAME } from '@/ImgGenHelper/app/ids';
import { getImageGenerationStore, subscribeImageGenerationStore } from '@/ImgGenHelper/config/store';
import { getResolvedImgGenMessageState } from '@/ImgGenHelper/features/image-generation/resolved-state';
import '@/ImgGenHelper/features/message-cards/runtime.css';
import {
  clampCarouselIndex,
  removeMediaUrlAtIndex,
  resolveRenderableRefMessageIds,
} from '@/ImgGenHelper/features/message-cards/ui-state';
import { logError, logWarn } from '@/ImgGenHelper/shared/log';
import { showErrorToast, showInfoToast, showSuccessToast, showWarningToast } from '@/ImgGenHelper/shared/toast';
import { teleportStyle } from '@util/script';
import { createTemporaryHost } from '@util/ui';

const CARD_SELECTOR = '.imggen-message-card';
const CHAT_EVENT_NAMESPACE = '.imggen-message-ui';
const BLOCK_UI_STATE = new Map<string, { currentIndex: number; collapsed: boolean }>();
const MOUNTED_MESSAGE_IDS = new Set<number>();
const ANCHOR_RETRY_COUNTS = new Map<string, number>();

export type RenderBlockState = {
  id: string;
  prompt: string;
  mediaUrls: string[];
  preventAuto: boolean;
  isScheduled: boolean;
  messageId: number;
  blockOrder: number;
};

type MessageUiApi = {
  getBlockState: (messageId: number, blockId: string) => RenderBlockState | undefined;
  isBlockGenerating: (messageId: number, blockId: string) => boolean;
  updateBlockData: (
    messageId: number,
    blockId: string,
    payload: { prompt: string; mediaUrls: string[]; preventAuto: boolean; isScheduled: boolean },
  ) => Promise<boolean>;
  cancelPendingAutomaticGenerationForBlock: (
    messageId: number,
    blockId: string,
  ) => Promise<{ cancelled: boolean; active: boolean }>;
  generateBlock: (messageId: number, blockId: string) => Promise<void>;
};

function buildTaskKey(messageId: number, blockId: string) {
  return `${messageId}::${blockId}`;
}

function normalizeAnchorSearchText(value: string): string {
  return value.replace(/\u00a0/g, ' ');
}

function getOrCreateBlockUiState(messageId: number, blockId: string, mediaCount: number) {
  const taskKey = buildTaskKey(messageId, blockId);
  const current = BLOCK_UI_STATE.get(taskKey);
  const nextState = {
    collapsed: current?.collapsed ?? false,
    currentIndex: clampCarouselIndex(current?.currentIndex, mediaCount),
  };
  BLOCK_UI_STATE.set(taskKey, nextState);
  return nextState;
}

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

function buildCardStatusText(state: RenderBlockState, isGenerating: boolean): string {
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

function renderMessageCard($card: JQuery<HTMLElement>, state: RenderBlockState, options: { isGenerating: boolean }) {
  const uiState = getOrCreateBlockUiState(state.messageId, state.id, state.mediaUrls.length);
  const currentUrl = state.mediaUrls[uiState.currentIndex] ?? '';
  const $viewport = $('<div class="imggen-message-card__viewport">').attr('aria-expanded', String(!uiState.collapsed));
  const statusText = buildCardStatusText(state, options.isGenerating);
  const positionText = buildCardPositionText(state.mediaUrls.length, uiState.currentIndex);

  $card
    .attr('data-imggen-message-id', String(state.messageId))
    .attr('data-imggen-block-id', state.id)
    .toggleClass('is-collapsed', uiState.collapsed)
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
        .attr('aria-label', uiState.collapsed ? '展开图片块' : '折叠图片块'),
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

function findRenderedMessageCard($message: JQuery, messageId: number, blockId: string) {
  return $message
    .find(CARD_SELECTOR)
    .filter(
      (_index, node) =>
        Number($(node).attr('data-imggen-message-id')) === messageId &&
        $(node).attr('data-imggen-block-id') === blockId,
    )
    .first();
}

function findExactAnchorElement(root: HTMLElement, fullMatch: string): HTMLElement | undefined {
  const normalizedMatch = normalizeAnchorSearchText(fullMatch).trim();
  const candidates = [...root.querySelectorAll<HTMLElement>('*')].filter(
    element =>
      $(element).closest(CARD_SELECTOR).length === 0 &&
      normalizeAnchorSearchText(element.textContent ?? '').trim() === normalizedMatch,
  );

  return candidates.sort((left, right) => $(right).parents().length - $(left).parents().length)[0];
}

function collectSearchableTextNodes(root: HTMLElement) {
  const nodeFilter = root.ownerDocument.defaultView?.NodeFilter ?? NodeFilter;
  const segments: Array<{ node: Text; start: number; end: number; text: string }> = [];
  let content = '';
  const walker = root.ownerDocument.createTreeWalker(root, nodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      const parentElement = node.parentElement;
      if (!parentElement || $(parentElement).closest(CARD_SELECTOR).length > 0) {
        return nodeFilter.FILTER_REJECT;
      }

      const normalizedText = normalizeAnchorSearchText(node.nodeValue ?? '');
      return normalizedText ? nodeFilter.FILTER_ACCEPT : nodeFilter.FILTER_SKIP;
    },
  });

  let currentNode = walker.nextNode();
  while (currentNode) {
    const textNode = currentNode as Text;
    const text = normalizeAnchorSearchText(textNode.nodeValue ?? '');
    segments.push({
      node: textNode,
      start: content.length,
      end: content.length + text.length,
      text,
    });
    content += text;
    currentNode = walker.nextNode();
  }

  return {
    content,
    segments,
  };
}

function resolveTextBoundary(
  segments: Array<{ node: Text; start: number; end: number; text: string }>,
  index: number,
): { node: Text; offset: number } | undefined {
  for (const segment of segments) {
    if (index < segment.start || index > segment.end) {
      continue;
    }

    return {
      node: segment.node,
      offset: Math.max(0, Math.min(segment.text.length, index - segment.start)),
    };
  }

  return undefined;
}

function findAnchorRange(root: HTMLElement, fullMatch: string): Range | undefined {
  const normalizedMatch = normalizeAnchorSearchText(fullMatch);
  const { content, segments } = collectSearchableTextNodes(root);
  const startIndex = content.indexOf(normalizedMatch);
  if (startIndex < 0) {
    return undefined;
  }

  const endIndex = startIndex + normalizedMatch.length;
  const startBoundary = resolveTextBoundary(segments, startIndex);
  const endBoundary = resolveTextBoundary(segments, endIndex);
  if (!startBoundary || !endBoundary) {
    return undefined;
  }

  const range = root.ownerDocument.createRange();
  range.setStart(startBoundary.node, startBoundary.offset);
  range.setEnd(endBoundary.node, endBoundary.offset);
  return range;
}

function previewMessageText(root: HTMLElement): string {
  const preview = normalizeAnchorSearchText(root.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  return preview.length > 160 ? `${preview.slice(0, 160)}...` : preview;
}

function clearAnchorRetry(messageId: number, blockId: string) {
  ANCHOR_RETRY_COUNTS.delete(buildTaskKey(messageId, blockId));
}

function scheduleAnchorRetry(messageId: number, blockId: string, callback: () => void) {
  const taskKey = buildTaskKey(messageId, blockId);
  const nextCount = (ANCHOR_RETRY_COUNTS.get(taskKey) ?? 0) + 1;
  if (nextCount > 3) {
    return false;
  }

  ANCHOR_RETRY_COUNTS.set(taskKey, nextCount);
  setTimeout(callback, nextCount * 80);
  return true;
}

function replaceAnchorWithCard(root: HTMLElement, fullMatch: string, card: HTMLElement): boolean {
  const exactElement = findExactAnchorElement(root, fullMatch);
  if (exactElement) {
    exactElement.replaceWith(card);
    return true;
  }

  const range = findAnchorRange(root, fullMatch);
  if (range) {
    range.deleteContents();
    range.insertNode(card);
    return true;
  }

  return false;
}

function getVisibleAssistantMessageIds(): number[] {
  return $('#chat')
    .children(".mes[is_user='false'][is_system='false']")
    .map((_index, node) => Number($(node).attr('mesid')))
    .get()
    .filter(messageId => Number.isFinite(messageId));
}

function getRenderableVisibleMessageIds() {
  const visibleRefMessageIds = getVisibleAssistantMessageIds().filter(
    messageId => (getResolvedImgGenMessageState(messageId)?.refs.length ?? 0) > 0,
  );
  const { generation } = getImageGenerationStore().config;
  return resolveRenderableRefMessageIds(
    visibleRefMessageIds,
    generation.renderLatestRefMessagesEnabled,
    generation.renderLatestRefMessagesCount,
  );
}

function getCardActionContext($target: JQuery) {
  const $card = $target.closest(CARD_SELECTOR) as JQuery<HTMLElement>;
  if (!$card.length) {
    return undefined;
  }

  const messageId = Number($card.attr('data-imggen-message-id'));
  const blockId = ($card.attr('data-imggen-block-id') ?? '').trim();
  return Number.isFinite(messageId) && blockId ? { $card, messageId, blockId } : undefined;
}

export function createImageGenerationMessageUi(api: MessageUiApi) {
  let destroyed = false;
  let syncScheduled = false;
  let syncRunning = false;
  let syncTimer: ReturnType<typeof setTimeout> | undefined;
  const { destroy: destroyTeleportedStyle } = teleportStyle();
  const renderBlockCard = ($card: JQuery<HTMLElement>, state: RenderBlockState) =>
    renderMessageCard($card, state, {
      isGenerating: api.isBlockGenerating(state.messageId, state.id),
    });

  const clearSync = () => {
    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = undefined;
    }
    syncScheduled = false;
  };

  const restoreMountedMessages = async (messageIds = [...MOUNTED_MESSAGE_IDS]) => {
    await Promise.allSettled(
      messageIds.map(async messageId => {
        [...ANCHOR_RETRY_COUNTS.keys()]
          .filter(taskKey => taskKey.startsWith(`${messageId}::`))
          .forEach(taskKey => ANCHOR_RETRY_COUNTS.delete(taskKey));
        if (!MOUNTED_MESSAGE_IDS.has(messageId)) {
          return;
        }
        MOUNTED_MESSAGE_IDS.delete(messageId);
        try {
          await refreshOneMessage(messageId);
        } catch (error) {
          logError('恢复原始楼层显示失败', { messageId }, error);
          retrieveDisplayedMessage(messageId)
            .find(CARD_SELECTOR)
            .filter((_index, node) => Number($(node).attr('data-imggen-message-id')) === messageId)
            .remove();
        }
      }),
    );
  };

  const syncOneMessage = (messageId: number) => {
    const resolved = getResolvedImgGenMessageState(messageId);
    const $message = retrieveDisplayedMessage(messageId);
    if (!$message.length || !resolved || resolved.refs.length === 0) {
      MOUNTED_MESSAGE_IDS.delete(messageId);
      return;
    }

    const validBlockIds = new Set(resolved.blocks.map(block => block.id));
    $message.find(CARD_SELECTOR).each((_index, node) => {
      const $node = $(node);
      if (
        Number($node.attr('data-imggen-message-id')) === messageId &&
        !validBlockIds.has(($node.attr('data-imggen-block-id') ?? '').trim())
      ) {
        $node.remove();
      }
    });

    let mountedAny = false;
    const blockCount = Math.min(resolved.refs.length, resolved.blocks.length);
    for (let blockOrder = 0; blockOrder < blockCount; blockOrder += 1) {
      const ref = resolved.refs[blockOrder];
      const block = api.getBlockState(messageId, resolved.blocks[blockOrder]!.id);
      if (!ref || !block) {
        continue;
      }

      let $card = findRenderedMessageCard($message, messageId, block.id);
      if (!$card.length) {
        $card = $('<div class="imggen-message-card">');
        if (!replaceAnchorWithCard($message[0] as HTMLElement, ref.fullMatch, $card[0] as HTMLElement)) {
          if (
            !normalizeAnchorSearchText($message.text()).includes(normalizeAnchorSearchText(ref.fullMatch)) &&
            scheduleAnchorRetry(messageId, block.id, scheduleSync)
          ) {
            continue;
          }

          logWarn('未能在聊天 DOM 中定位图片锚点', {
            messageId,
            blockId: block.id,
            anchor: ref.fullMatch,
            textPreview: previewMessageText($message[0] as HTMLElement),
          });
          continue;
        }
      }

      clearAnchorRetry(messageId, block.id);
      renderBlockCard($card, block);
      mountedAny = true;
    }

    if (mountedAny) {
      MOUNTED_MESSAGE_IDS.add(messageId);
    } else {
      MOUNTED_MESSAGE_IDS.delete(messageId);
    }
  };

  const syncAll = async () => {
    if (destroyed) {
      return;
    }
    if (!getImageGenerationStore().config.enabled) {
      await restoreMountedMessages();
      return;
    }

    const targetIds = new Set(getRenderableVisibleMessageIds());
    await restoreMountedMessages([...MOUNTED_MESSAGE_IDS].filter(messageId => !targetIds.has(messageId)));
    targetIds.forEach(syncOneMessage);
  };

  const flushSync = async () => {
    if (syncRunning || destroyed) {
      return;
    }
    syncRunning = true;
    try {
      while (syncScheduled && !destroyed) {
        syncScheduled = false;
        await syncAll();
      }
    } finally {
      syncRunning = false;
    }
  };

  const scheduleSync = () => {
    if (destroyed || !getImageGenerationStore().config.enabled) {
      return;
    }
    syncScheduled = true;
    if (syncTimer) {
      return;
    }
    syncTimer = setTimeout(() => {
      syncTimer = undefined;
      void flushSync();
    }, 0);
  };

  const savePromptForBlock = async (messageId: number, blockId: string, prompt: string) => {
    const nextPrompt = prompt.trim();
    if (!nextPrompt) {
      showWarningToast('提示词不能为空', '图片生成');
      return false;
    }

    const pendingState = await api.cancelPendingAutomaticGenerationForBlock(messageId, blockId);
    if (pendingState.active) {
      showInfoToast('当前块正在生成中，请稍后再编辑', '图片生成');
      return false;
    }

    const state = api.getBlockState(messageId, blockId);
    if (!state) {
      showWarningToast('目标图片块不存在，可能消息已刷新', '图片生成');
      scheduleSync();
      return false;
    }

    return api.updateBlockData(messageId, blockId, {
      prompt: nextPrompt,
      mediaUrls: state.mediaUrls,
      preventAuto: state.preventAuto,
      isScheduled: false,
    });
  };

  const openEditor = (messageId: number, blockId: string) => {
    const state = api.getBlockState(messageId, blockId);
    if (!state) {
      showWarningToast('目标图片块不存在，可能消息已刷新', '图片生成');
      scheduleSync();
      return;
    }

    if (typeof SillyTavern?.Popup !== 'function' || typeof SillyTavern?.POPUP_TYPE === 'undefined') {
      showErrorToast('弹窗接口不可用，请检查酒馆版本。', SCRIPT_DISPLAY_NAME);
      return;
    }

    const hostHandle = createTemporaryHost({
      className: 'imggen-edit-popup',
    });
    const $host = hostHandle.$host;
    const $textarea = $('<textarea class="text_pole" rows="6">').val(state.prompt);
    const $deleteButton = $(
      '<button type="button" class="menu_button redWarningBG imggen-button">删除当前图片</button>',
    );
    const $saveButton = $('<button type="button" class="menu_button imggen-button">仅修改</button>');
    const $generateButton = $('<button type="button" class="menu_button imggen-button">生成</button>');
    const $cancelButton = $('<button type="button" class="menu_button menu_button_cancel imggen-button">取消</button>');
    let cleaned = false;
    let busy = false;

    $host
      .append($('<div class="imggen-edit-popup__hint">').text(`消息 ${messageId} · 图片块 ${state.blockOrder + 1}`))
      .append($textarea)
      .append(
        $('<div class="imggen-edit-popup__actions">')
          .append($cancelButton)
          .append($deleteButton)
          .append($saveButton)
          .append($generateButton),
      );
    const popup = new SillyTavern.Popup($host[0], SillyTavern.POPUP_TYPE.DISPLAY, '', {
      wide: false,
      wider: true,
      leftAlign: true,
      okButton: false,
      cancelButton: false,
    });

    const cleanup = () => {
      if (cleaned) {
        return;
      }
      cleaned = true;
      $cancelButton.off('click');
      $saveButton.off('click');
      $generateButton.off('click');
      $deleteButton.off('click');
      hostHandle.destroy();
    };

    const withBusyState = async (handler: () => Promise<void>) => {
      if (busy) {
        return;
      }
      busy = true;
      $saveButton.prop('disabled', true);
      $generateButton.prop('disabled', true);
      $cancelButton.prop('disabled', true);
      $deleteButton.prop('disabled', true);
      try {
        await handler();
      } finally {
        if (!cleaned) {
          busy = false;
          $saveButton.prop('disabled', false);
          $generateButton.prop('disabled', false);
          $cancelButton.prop('disabled', false);
          $deleteButton.prop('disabled', false);
        }
      }
    };

    $cancelButton.on('click', () => void popup.completeCancelled());
    $deleteButton.on(
      'click',
      () =>
        void withBusyState(async () => {
          const pendingState = await api.cancelPendingAutomaticGenerationForBlock(messageId, blockId);
          if (pendingState.active) {
            showInfoToast('当前块正在生成中，暂时不能删除图片', '图片生成');
            return;
          }
          const currentState = api.getBlockState(messageId, blockId);
          if (!currentState || currentState.mediaUrls.length === 0) {
            showInfoToast('当前块没有可删除的图片', '图片生成');
            return;
          }
          if (!window.confirm('确定删除当前图片吗？')) {
            return;
          }
          const uiState = getOrCreateBlockUiState(messageId, blockId, currentState.mediaUrls.length);
          const nextMediaUrls = removeMediaUrlAtIndex(currentState.mediaUrls, uiState.currentIndex);
          uiState.currentIndex = clampCarouselIndex(uiState.currentIndex, nextMediaUrls.length);
          BLOCK_UI_STATE.set(buildTaskKey(messageId, blockId), uiState);
          await api.updateBlockData(messageId, blockId, {
            prompt: currentState.prompt,
            mediaUrls: nextMediaUrls,
            preventAuto: nextMediaUrls.length === 0,
            isScheduled: false,
          });
          showSuccessToast(nextMediaUrls.length > 0 ? '已删除当前图片' : '已删除最后一张图片', '图片生成');
          await popup.completeAffirmative();
        }),
    );
    $saveButton.on(
      'click',
      () =>
        void withBusyState(async () => {
          if (!(await savePromptForBlock(messageId, blockId, String($textarea.val() ?? '')))) {
            return;
          }
          showSuccessToast('提示词已保存', '图片生成');
          await popup.completeAffirmative();
        }),
    );
    $generateButton.on(
      'click',
      () =>
        void withBusyState(async () => {
          if (!(await savePromptForBlock(messageId, blockId, String($textarea.val() ?? '')))) {
            return;
          }
          await popup.completeAffirmative();
          await api.generateBlock(messageId, blockId);
        }),
    );

    void popup.show().finally(cleanup);
  };

  const openPreview = (messageId: number, blockId: string) => {
    const state = api.getBlockState(messageId, blockId);
    if (!state) {
      showWarningToast('目标图片块不存在，可能消息已刷新', '图片生成');
      scheduleSync();
      return;
    }

    const uiState = getOrCreateBlockUiState(messageId, blockId, state.mediaUrls.length);
    const currentUrl = state.mediaUrls[uiState.currentIndex] ?? '';
    if (!currentUrl) {
      showInfoToast('当前块还没有可预览的图片', '图片生成');
      return;
    }

    if (typeof SillyTavern?.Popup !== 'function' || typeof SillyTavern?.POPUP_TYPE === 'undefined') {
      showErrorToast('弹窗接口不可用，请检查酒馆版本。', SCRIPT_DISPLAY_NAME);
      return;
    }

    const hostHandle = createTemporaryHost({
      className: 'imggen-preview-popup',
    });
    const $host = hostHandle.$host;
    const $closeButton = $('<button type="button" class="menu_button menu_button_cancel imggen-button">关闭</button>');
    let cleaned = false;

    $host
      .append(
        $('<div class="imggen-preview-popup__hint">').text(
          `消息 ${messageId} · 图片块 ${state.blockOrder + 1} · 第 ${uiState.currentIndex + 1} 张`,
        ),
      )
      .append(
        $('<div class="imggen-preview-popup__frame">').append(
          $('<img class="imggen-preview-popup__image" />')
            .attr('src', encodeMediaUrl(currentUrl))
            .attr('alt', state.prompt || `图片块 ${state.blockOrder + 1}`),
        ),
      )
      .append($('<div class="imggen-preview-popup__actions">').append($closeButton));

    const popup = new SillyTavern.Popup($host[0], SillyTavern.POPUP_TYPE.DISPLAY, '', {
      wide: true,
      wider: true,
      leftAlign: true,
      okButton: false,
      cancelButton: false,
    });

    const cleanup = () => {
      if (cleaned) {
        return;
      }
      cleaned = true;
      $closeButton.off('click');
      hostHandle.destroy();
    };

    $closeButton.on('click', () => void popup.completeCancelled());
    void popup.show().finally(cleanup);
  };

  const $chat = $('#chat');
  if ($chat.length) {
    $chat.off(CHAT_EVENT_NAMESPACE);

    // Left zone: Previous image
    $chat.on(`click${CHAT_EVENT_NAMESPACE}`, `${CARD_SELECTOR} [data-imggen-action="prev"]`, event => {
      const context = getCardActionContext($(event.currentTarget));
      const state = context && api.getBlockState(context.messageId, context.blockId);
      if (!context || !state || state.mediaUrls.length <= 1) return;
      const uiState = getOrCreateBlockUiState(context.messageId, context.blockId, state.mediaUrls.length);
      uiState.currentIndex = clampCarouselIndex(uiState.currentIndex - 1, state.mediaUrls.length);
      BLOCK_UI_STATE.set(buildTaskKey(context.messageId, context.blockId), uiState);
      renderBlockCard(context.$card, state);
    });

    // Right zone: Next image OR Generate new image
    $chat.on(`click${CHAT_EVENT_NAMESPACE}`, `${CARD_SELECTOR} [data-imggen-action="next-or-gen"]`, event => {
      const context = getCardActionContext($(event.currentTarget));
      const state = context && api.getBlockState(context.messageId, context.blockId);
      if (!context || !state) return;

      const mediaCount = state.mediaUrls.length;
      const uiState = getOrCreateBlockUiState(context.messageId, context.blockId, mediaCount);

      // If we're at the last image, or there are no images, trigger generation
      if (mediaCount === 0 || uiState.currentIndex === mediaCount - 1) {
        void api.generateBlock(context.messageId, context.blockId);
      } else {
        // Just go to next image
        uiState.currentIndex = clampCarouselIndex(uiState.currentIndex + 1, mediaCount);
        BLOCK_UI_STATE.set(buildTaskKey(context.messageId, context.blockId), uiState);
        renderBlockCard(context.$card, state);
      }
    });

    $chat.on(`click${CHAT_EVENT_NAMESPACE}`, `${CARD_SELECTOR} [data-imggen-action="toggle-collapse"]`, event => {
      const context = getCardActionContext($(event.currentTarget));
      const state = context && api.getBlockState(context.messageId, context.blockId);
      if (!context || !state) return;

      const uiState = getOrCreateBlockUiState(context.messageId, context.blockId, state.mediaUrls.length);
      uiState.collapsed = !uiState.collapsed;
      BLOCK_UI_STATE.set(buildTaskKey(context.messageId, context.blockId), uiState);
      renderBlockCard(context.$card, state);
    });

    $chat.on(`click${CHAT_EVENT_NAMESPACE}`, `${CARD_SELECTOR} [data-imggen-action="edit-prompt"]`, event => {
      const context = getCardActionContext($(event.currentTarget));
      if (!context) return;
      openEditor(context.messageId, context.blockId);
    });

    $chat.on(`click${CHAT_EVENT_NAMESPACE}`, `${CARD_SELECTOR} [data-imggen-action="center-action"]`, event => {
      const context = getCardActionContext($(event.currentTarget));
      const state = context && api.getBlockState(context.messageId, context.blockId);
      if (!context || !state) return;

      if (state.mediaUrls.length === 0) {
        void api.generateBlock(context.messageId, context.blockId);
        return;
      }

      openPreview(context.messageId, context.blockId);
    });
  }

  const stops = [
    eventOn('chatLoaded', scheduleSync).stop,
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, scheduleSync).stop,
    eventOn(tavern_events.MESSAGE_EDITED, scheduleSync).stop,
    eventOn(tavern_events.MESSAGE_DELETED, scheduleSync).stop,
    eventOn(tavern_events.MORE_MESSAGES_LOADED, scheduleSync).stop,
    eventOn(IMGGEN_BLOCK_STATE_UPDATED_EVENT, scheduleSync).stop,
    subscribeImageGenerationStore(
      state =>
        [
          state.config.enabled,
          state.config.generation.renderLatestRefMessagesEnabled,
          state.config.generation.renderLatestRefMessagesCount,
        ] as const,
      ([enabled]) => {
        if (!enabled) {
          clearSync();
          void restoreMountedMessages();
          return;
        }
        scheduleSync();
      },
      {
        equalityFn: _.isEqual,
        fireImmediately: true,
      },
    ),
  ];

  scheduleSync();

  return {
    destroy: () => {
      destroyed = true;
      clearSync();
      stops.forEach(stop => stop());
      $chat.off(CHAT_EVENT_NAMESPACE);
      void restoreMountedMessages();
      BLOCK_UI_STATE.clear();
      destroyTeleportedStyle();
    },
    process: scheduleSync,
  };
}
