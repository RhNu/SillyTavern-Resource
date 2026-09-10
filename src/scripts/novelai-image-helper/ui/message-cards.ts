import { matchAnchors } from '../domain/anchor';
import { PromptBundleSchema } from '../domain/prompt';
import { BLOCKS_CHANGED_EVENT, type QueueSnapshot, type QueueTaskView } from '../image-generation/queue';
import { createLogger, serializeError } from '../app/logger';
import type { NovelAiImageService } from '../app/service';
import { previewRenderedText, renderedTextContains, replaceRenderedAnchor } from './message-anchor-dom';

const CARD_CLASS = 'nai-image-card';
const CARD_SELECTOR = `.${CARD_CLASS}`;
const EVENT_NAMESPACE = '.novelaiImageHelper';
const TITLE = 'NovelAI 图片助手';
const logger = createLogger('ui/message-cards');
type OutputViewState = { count: number; index: number };

const STATUS_LABELS: Record<string, string> = {
  prepared: '正在写入',
  draft: '等待生成',
  queued: '已排队',
  generating: '生成中',
  uploading: '上传中',
  ready: '已完成',
  failed: '失败',
};

const ENQUEUE_FAILURE_MESSAGES: Record<string, string> = {
  duplicate: '这个图片块已经在队列里了',
  missing: '图片块已不存在，无法生成',
  destroyed: '脚本已卸载，无法生成',
};

function outputStateKey(messageId: number, blockId: string): string {
  return `${messageId}:${blockId}`;
}

function emitBlocksChanged(messageId: number): void {
  try {
    void Promise.resolve(eventEmit(BLOCKS_CHANGED_EVENT, messageId)).catch(error => {
      logger.error('发送图片块变更事件失败', error, { messageId });
    });
  } catch (error) {
    logger.error('发送图片块变更事件失败', error, { messageId });
  }
}

function currentOutputIndex(
  outputViews: Map<string, OutputViewState>,
  messageId: number,
  blockId: string,
  outputCount: number,
): number {
  if (outputCount <= 0) return -1;
  const key = outputStateKey(messageId, blockId);
  const previous = outputViews.get(key);
  // A changed count means a newly appended image; make the new image the active one.
  const index =
    !previous || previous.count !== outputCount ? outputCount - 1 : Math.min(previous.index, outputCount - 1);
  outputViews.set(key, { count: outputCount, index });
  return index;
}

function statusLabel(status: string, task: QueueTaskView | undefined, throttled: boolean): string {
  if (task && status === 'queued') {
    if (task.attempt > 1) return `重试中 (${task.attempt}/${task.maxAttempts})`;
    if (throttled) return '等待节流';
  }
  return STATUS_LABELS[status] ?? status;
}

function findTaskView(snapshot: QueueSnapshot, messageId: number, blockId: string): QueueTaskView | undefined {
  if (snapshot.active?.messageId === messageId && snapshot.active.blockId === blockId) return snapshot.active;
  return snapshot.pending.find(task => task.messageId === messageId && task.blockId === blockId);
}

function renderCard(
  service: NovelAiImageService,
  messageId: number,
  blockId: string,
  $card: JQuery<HTMLElement>,
  outputViews: Map<string, OutputViewState>,
  snapshot: QueueSnapshot,
) {
  const block = service.repository.find(messageId, blockId);
  if (!block) {
    logger.warn('渲染图片卡片时找不到图片块', { messageId, blockId });
    $card.empty().append($('<div class="nai-image-card__error">').text('图片块数据缺失'));
    return;
  }

  const task = findTaskView(snapshot, messageId, blockId);
  const label = statusLabel(block.status, task, snapshot.nextDispatchAt > Date.now());
  const outputIndex = currentOutputIndex(outputViews, messageId, blockId, block.outputs.length);
  const output = outputIndex >= 0 ? block.outputs[outputIndex] : undefined;
  const title = block.summary || block.prompt.main.positive;
  $card
    .attr('data-message-id', String(messageId))
    .attr('data-block-id', blockId)
    .attr('data-status', block.status)
    .empty();

  const $viewport = $('<div class="nai-image-card__viewport">');
  if (output) {
    $viewport.append($('<img class="nai-image-card__image">').attr({ src: encodeURI(output.url), alt: title }));
  } else {
    $viewport.append(
      $('<div class="nai-image-card__placeholder">').text(
        block.error ? `${label}：${block.error.message}` : `${label} · 点击右侧生成`,
      ),
    );
  }
  const atFirstOutput = outputIndex <= 0;
  const atLastOutput = outputIndex < 0 || outputIndex === block.outputs.length - 1;
  $viewport
    .append(
      $('<button type="button" class="nai-image-card__hotspot nai-image-card__hotspot--left" data-action="previous">')
        .attr({ 'aria-label': '上一张图片', title: '上一张图片' })
        .prop('disabled', atFirstOutput),
    )
    .append(
      $(
        '<button type="button" class="nai-image-card__hotspot nai-image-card__hotspot--right" data-action="next-or-generate">',
      )
        .attr({
          'aria-label': atLastOutput ? '生成新图片' : '下一张图片',
          title: atLastOutput ? '生成新图片' : '下一张图片',
        })
        .prop('disabled', atLastOutput && service.queue.isBusy(messageId, blockId)),
    )
    .append(
      $(
        '<button type="button" class="nai-image-card__hotspot nai-image-card__hotspot--bottom" data-action="edit">',
      ).attr({ 'aria-label': '编辑提示词', title: '编辑提示词' }),
    );
  $card.append($viewport);
}

function openEditor(service: NovelAiImageService, messageId: number, blockId: string): void {
  const block = service.repository.find(messageId, blockId);
  if (!block) return;
  const $host = $('<div class="nai-image-editor">');
  const $positive = $('<textarea class="text_pole" rows="4">').val(block.prompt.main.positive);
  const $negative = $('<textarea class="text_pole" rows="2">').val(block.prompt.main.negative);
  const $characters = $('<textarea class="text_pole" rows="10">').val(JSON.stringify(block.prompt.characters, null, 2));
  const $save = $('<button type="button" class="menu_button">').text('保存');
  const $cancel = $('<button type="button" class="menu_button menu_button_cancel">').text('取消');
  $host
    .append($('<label>').text('主提示词'), $positive)
    .append($('<label>').text('主负面提示词'), $negative)
    .append($('<label>').text('角色提示词 JSON'), $characters)
    .append($('<div class="nai-image-editor__actions">').append($cancel, $save));

  const popup = new SillyTavern.Popup($host[0], SillyTavern.POPUP_TYPE.DISPLAY, '', {
    wide: true,
    wider: true,
    okButton: false,
    cancelButton: false,
  });
  $cancel.on('click', () => {
    void Promise.resolve(popup.completeCancelled()).catch(error => {
      logger.error('关闭图片提示词编辑弹窗失败', error, { messageId, blockId });
    });
  });
  $save.on('click', () => {
    try {
      const prompt = PromptBundleSchema.parse({
        main: { positive: String($positive.val() ?? ''), negative: String($negative.val() ?? '') },
        characters: JSON.parse(String($characters.val() ?? '[]')),
      });
      service.queue.cancel(messageId, blockId);
      service.repository.update(messageId, blockId, current => ({
        ...current,
        revision: current.revision + 1,
        prompt,
        status: 'draft',
        error: undefined,
      }));
      emitBlocksChanged(messageId);
      toastr.success('提示词已保存', 'NovelAI 图片助手');
      void Promise.resolve(popup.completeAffirmative()).catch(error => {
        logger.error('完成图片提示词编辑弹窗失败', error, { messageId, blockId });
      });
    } catch (error) {
      logger.warn('保存图片提示词失败', { messageId, blockId, error: serializeError(error) });
      toastr.error(error instanceof Error ? error.message : String(error), '提示词格式错误');
    }
  });
  void popup
    .show()
    .catch(error => logger.error('图片提示词编辑弹窗异常结束', error, { messageId, blockId }))
    .finally(() => $host.remove());
}

export function mountMessageCards(service: NovelAiImageService): { sync: () => void; destroy: () => void } {
  const mountedMessageIds = new Set<number>();
  const outputViews = new Map<string, OutputViewState>();
  const anchorRetries = new Map<string, { attempt: number; timer?: ReturnType<typeof setTimeout> }>();
  let syncTimer: ReturnType<typeof setTimeout> | undefined;
  let syncRequested = false;
  let syncRunning = false;
  let destroyed = false;

  const clearAnchorRetry = (messageId: number, blockId: string) => {
    const key = outputStateKey(messageId, blockId);
    const retry = anchorRetries.get(key);
    if (retry?.timer) clearTimeout(retry.timer);
    anchorRetries.delete(key);
  };

  const clearMessageRetries = (messageId: number) => {
    const prefix = `${messageId}:`;
    [...anchorRetries.keys()]
      .filter(key => key.startsWith(prefix))
      .forEach(key => {
        const retry = anchorRetries.get(key);
        if (retry?.timer) clearTimeout(retry.timer);
        anchorRetries.delete(key);
      });
  };

  const scheduleSync = () => {
    if (destroyed) return;
    syncRequested = true;
    if (syncTimer) return;
    syncTimer = setTimeout(() => {
      syncTimer = undefined;
      if (syncRunning || destroyed) return;
      syncRunning = true;
      try {
        while (syncRequested && !destroyed) {
          syncRequested = false;
          safeSync();
        }
      } finally {
        syncRunning = false;
      }
    }, 0);
  };

  const scheduleAnchorRetry = (messageId: number, blockId: string): boolean => {
    const key = outputStateKey(messageId, blockId);
    const previous = anchorRetries.get(key) ?? { attempt: 0 };
    if (previous.timer) return true;
    if (previous.attempt >= 3) return false;
    const attempt = previous.attempt + 1;
    const retry = {
      attempt,
      timer: setTimeout(() => {
        const current = anchorRetries.get(key);
        if (current) anchorRetries.set(key, { attempt: current.attempt });
        scheduleSync();
      }, attempt * 80),
    };
    anchorRetries.set(key, retry);
    return true;
  };

  const sync = () => {
    const snapshot = service.getQueueSnapshot();
    $('#chat')
      .children(".mes[is_user='false'][is_system='false']")
      .each((_index, element) => {
        const messageId = Number($(element).attr('mesid'));
        const message = getChatMessages(messageId)[0];
        if (!message) return;
        const $displayed = retrieveDisplayedMessage(messageId);
        if (!$displayed.length) return;
        const anchors = matchAnchors(message.message);
        const anchorIds = new Set(anchors.map(anchor => anchor.id));
        $displayed.find(`.${CARD_CLASS}`).each((_cardIndex, card) => {
          const blockId = String($(card).attr('data-block-id'));
          if (!anchorIds.has(blockId)) {
            clearAnchorRetry(messageId, blockId);
            outputViews.delete(outputStateKey(messageId, blockId));
            $(card).remove();
          }
        });
        anchors.forEach(anchor => {
          let $card = $displayed
            .find(`.${CARD_CLASS}`)
            .filter((_cardIndex, card) => $(card).attr('data-block-id') === anchor.id)
            .first() as JQuery<HTMLElement>;
          if (!$card.length) {
            $card = $(`<div class="${CARD_CLASS}">`) as JQuery<HTMLElement>;
            if (!replaceRenderedAnchor($displayed[0], anchor.fullMatch, $card[0], CARD_SELECTOR)) {
              if (!renderedTextContains($displayed[0], anchor.fullMatch) && scheduleAnchorRetry(messageId, anchor.id)) {
                return;
              }
              logger.warn('未能在聊天 DOM 中定位图片锚点', {
                messageId,
                blockId: anchor.id,
                anchor: anchor.fullMatch,
                textPreview: previewRenderedText($displayed[0]),
              });
              return;
            }
          }
          clearAnchorRetry(messageId, anchor.id);
          renderCard(service, messageId, anchor.id, $card, outputViews, snapshot);
          mountedMessageIds.add(messageId);
        });
      });
  };
  const safeSync = () => {
    try {
      sync();
    } catch (error) {
      logger.error('同步图片卡片失败', error);
    }
  };

  const $chat = $('#chat');
  $chat.off(EVENT_NAMESPACE);
  $chat.on(`click${EVENT_NAMESPACE}`, `.${CARD_CLASS} [data-action="previous"]`, event => {
    try {
      const $card = $(event.currentTarget).closest(`.${CARD_CLASS}`);
      const messageId = Number($card.attr('data-message-id'));
      const blockId = String($card.attr('data-block-id'));
      const block = service.repository.find(messageId, blockId);
      if (!block) return;
      const index = currentOutputIndex(outputViews, messageId, blockId, block.outputs.length);
      if (index <= 0) return;
      outputViews.set(outputStateKey(messageId, blockId), { count: block.outputs.length, index: index - 1 });
      renderCard(service, messageId, blockId, $card, outputViews, service.getQueueSnapshot());
    } catch (error) {
      logger.error('切换上一张图片失败', error);
    }
  });
  $chat.on(`click${EVENT_NAMESPACE}`, `.${CARD_CLASS} [data-action="next-or-generate"]`, event => {
    try {
      const $card = $(event.currentTarget).closest(`.${CARD_CLASS}`);
      const messageId = Number($card.attr('data-message-id'));
      const blockId = String($card.attr('data-block-id'));
      const block = service.repository.find(messageId, blockId);
      if (!block) return;
      const index = currentOutputIndex(outputViews, messageId, blockId, block.outputs.length);
      if (index >= 0 && index < block.outputs.length - 1) {
        outputViews.set(outputStateKey(messageId, blockId), { count: block.outputs.length, index: index + 1 });
        renderCard(service, messageId, blockId, $card, outputViews, service.getQueueSnapshot());
        return;
      }
      const result = service.generate(messageId, blockId);
      if (!result.ok) toastr.info(ENQUEUE_FAILURE_MESSAGES[result.reason] ?? '无法加入生成队列', TITLE);
    } catch (error) {
      logger.error('切换或生成下一张图片失败', error);
      toastr.error(error instanceof Error ? error.message : String(error), TITLE);
    }
  });
  $chat.on(`click${EVENT_NAMESPACE}`, `.${CARD_CLASS} [data-action="edit"]`, event => {
    try {
      const $card = $(event.currentTarget).closest(`.${CARD_CLASS}`);
      openEditor(service, Number($card.attr('data-message-id')), String($card.attr('data-block-id')));
    } catch (error) {
      logger.error('打开图片提示词编辑器失败', error);
      toastr.error(error instanceof Error ? error.message : String(error), TITLE);
    }
  });

  const stops = [
    eventOn('chatLoaded', () => scheduleSync()).stop,
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, () => scheduleSync()).stop,
    eventOn(tavern_events.MESSAGE_EDITED, () => scheduleSync()).stop,
    eventOn(tavern_events.MESSAGE_DELETED, () => scheduleSync()).stop,
    eventOn(tavern_events.MORE_MESSAGES_LOADED, () => scheduleSync()).stop,
    eventOn(BLOCKS_CHANGED_EVENT, () => scheduleSync()).stop,
  ];
  const unsubscribeQueue = service.queue.subscribe(() => scheduleSync());
  scheduleSync();
  logger.info('图片卡片界面已挂载');
  return {
    sync: safeSync,
    destroy: () => {
      destroyed = true;
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = undefined;
      stops.forEach(stop => stop());
      unsubscribeQueue();
      $chat.off(EVENT_NAMESPACE);
      mountedMessageIds.forEach(messageId => {
        clearMessageRetries(messageId);
        void Promise.resolve(refreshOneMessage(messageId)).catch(error => {
          logger.error('刷新消息显示失败', error, { messageId });
        });
      });
      mountedMessageIds.clear();
      anchorRetries.forEach(retry => {
        if (retry.timer) clearTimeout(retry.timer);
      });
      anchorRetries.clear();
      outputViews.clear();
      logger.debug('图片卡片界面已销毁');
    },
  };
}
