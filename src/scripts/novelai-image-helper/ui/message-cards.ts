import { matchAnchors } from '../domain/anchor';
import { PromptBundleSchema } from '../domain/prompt';
import { BLOCKS_CHANGED_EVENT, type QueueSnapshot, type QueueTaskView } from '../image-generation/queue';
import { createLogger, serializeError } from '../app/logger';
import type { NovelAiImageService } from '../app/service';

const CARD_CLASS = 'nai-image-card';
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

function findAnchorNode(root: HTMLElement, anchor: string): Text | undefined {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if ((node.nodeValue ?? '').includes(anchor)) return node as Text;
    node = walker.nextNode();
  }
  return undefined;
}

function replaceAnchor(node: Text, anchor: string, card: HTMLElement): void {
  const text = node.nodeValue ?? '';
  const index = text.indexOf(anchor);
  const before = text.slice(0, index);
  const after = text.slice(index + anchor.length);
  const fragment = node.ownerDocument.createDocumentFragment();
  if (before) fragment.append(before);
  fragment.append(card);
  if (after) fragment.append(after);
  node.replaceWith(fragment);
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

  if (output) {
    $card.append($('<img class="nai-image-card__image">').attr({ src: encodeURI(output.url), alt: title }));
  } else {
    $card.append($('<div class="nai-image-card__placeholder">').text(label));
  }
  if (block.outputs.length > 1) {
    const $gallery = $('<div class="nai-image-card__gallery" role="list" aria-label="已生成图片">');
    block.outputs.forEach((item, index) => {
      $gallery.append(
        $('<button type="button" class="nai-image-card__thumbnail" data-action="output-select">')
          .attr({
            'data-output-index': String(index),
            'aria-label': `查看第 ${index + 1} 张图片`,
            'aria-pressed': String(index === outputIndex),
            title: `第 ${index + 1} 张 · seed ${item.seed}`,
          })
          .toggleClass('is-active', index === outputIndex)
          .append($('<img>').attr({ src: encodeURI(item.url), alt: `第 ${index + 1} 张图片` })),
      );
    });
    $card.append($gallery);
  }
  $card.append(
    $('<div class="nai-image-card__body">')
      .append($('<div class="nai-image-card__title">').text(title))
      .append(
        $('<div class="nai-image-card__meta">').text(
          `${label} · ${block.prompt.characters.length} 个角色${
            output ? ` · 图片 ${outputIndex + 1}/${block.outputs.length} · seed ${output.seed}` : ''
          }`,
        ),
      )
      .append(block.error ? $('<div class="nai-image-card__error">').text(block.error.message) : $())
      .append(
        $('<div class="nai-image-card__actions">')
          .append($('<button type="button" class="menu_button" data-action="edit">').text('编辑提示词'))
          .append(
            $('<button type="button" class="menu_button" data-action="generate">')
              .prop('disabled', service.queue.isBusy(messageId, blockId))
              .text(block.status === 'failed' ? '重试' : output ? '再生成' : '生成'),
          ),
      ),
  );
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
            const node = findAnchorNode($displayed[0], anchor.fullMatch);
            if (!node) return;
            $card = $(`<div class="${CARD_CLASS}">`) as JQuery<HTMLElement>;
            replaceAnchor(node, anchor.fullMatch, $card[0]);
          }
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
  $chat.on(`click${EVENT_NAMESPACE}`, `.${CARD_CLASS} [data-action="generate"]`, event => {
    try {
      const $card = $(event.currentTarget).closest(`.${CARD_CLASS}`);
      const result = service.generate(Number($card.attr('data-message-id')), String($card.attr('data-block-id')));
      if (!result.ok) toastr.info(ENQUEUE_FAILURE_MESSAGES[result.reason] ?? '无法加入生成队列', TITLE);
    } catch (error) {
      logger.error('点击生成图片时发生异常', error);
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
  $chat.on(`click${EVENT_NAMESPACE}`, `.${CARD_CLASS} [data-action="output-select"]`, event => {
    try {
      const $card = $(event.currentTarget).closest(`.${CARD_CLASS}`);
      const messageId = Number($card.attr('data-message-id'));
      const blockId = String($card.attr('data-block-id'));
      const outputIndex = Number($(event.currentTarget).attr('data-output-index'));
      const block = service.repository.find(messageId, blockId);
      if (!block || !Number.isInteger(outputIndex) || outputIndex < 0 || outputIndex >= block.outputs.length) return;
      outputViews.set(outputStateKey(messageId, blockId), { count: block.outputs.length, index: outputIndex });
      renderCard(service, messageId, blockId, $card, outputViews, service.getQueueSnapshot());
    } catch (error) {
      logger.error('切换图片输出失败', error);
    }
  });

  const stops = [
    eventOn('chatLoaded', safeSync).stop,
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, safeSync).stop,
    eventOn(tavern_events.MESSAGE_EDITED, safeSync).stop,
    eventOn(tavern_events.MESSAGE_DELETED, safeSync).stop,
    eventOn(tavern_events.MORE_MESSAGES_LOADED, safeSync).stop,
    eventOn(BLOCKS_CHANGED_EVENT, safeSync).stop,
  ];
  const unsubscribeQueue = service.queue.subscribe(safeSync);
  safeSync();
  logger.info('图片卡片界面已挂载');
  return {
    sync: safeSync,
    destroy: () => {
      stops.forEach(stop => stop());
      unsubscribeQueue();
      $chat.off(EVENT_NAMESPACE);
      mountedMessageIds.forEach(messageId => {
        void Promise.resolve(refreshOneMessage(messageId)).catch(error => {
          logger.error('刷新消息显示失败', error, { messageId });
        });
      });
      mountedMessageIds.clear();
      outputViews.clear();
      logger.debug('图片卡片界面已销毁');
    },
  };
}
