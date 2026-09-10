import { matchAnchors } from '../domain/anchor';
import { PromptBundleSchema } from '../domain/prompt';
import { BLOCKS_CHANGED_EVENT } from '../image-generation/queue';
import type { NovelAiImageService } from '../app/service';

const CARD_CLASS = 'nai-image-card';
const EVENT_NAMESPACE = '.novelaiImageHelper';
type OutputViewState = { count: number; index: number };

function outputStateKey(messageId: number, blockId: string): string {
  return `${messageId}:${blockId}`;
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

function statusLabel(status: string): string {
  return (
    {
      prepared: '正在写入',
      draft: '等待生成',
      queued: '已排队',
      generating: '生成中',
      uploading: '上传中',
      ready: '已完成',
      failed: '失败',
    }[status] ?? status
  );
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
) {
  const block = service.repository.find(messageId, blockId);
  if (!block) {
    $card.empty().append($('<div class="nai-image-card__error">').text('图片块数据缺失'));
    return;
  }

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
    $card.append($('<div class="nai-image-card__placeholder">').text(statusLabel(block.status)));
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
          `${statusLabel(block.status)} · ${block.prompt.characters.length} 个角色${
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
              .prop('disabled', service.queue.isActive(messageId, blockId) || block.status === 'queued')
              .text(output ? '再生成' : '生成'),
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
  $cancel.on('click', () => void popup.completeCancelled());
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
      void eventEmit(BLOCKS_CHANGED_EVENT, messageId);
      toastr.success('提示词已保存', 'NovelAI 图片助手');
      void popup.completeAffirmative();
    } catch (error) {
      toastr.error(error instanceof Error ? error.message : String(error), '提示词格式错误');
    }
  });
  void popup.show().finally(() => $host.remove());
}

export function mountMessageCards(service: NovelAiImageService): { sync: () => void; destroy: () => void } {
  const mountedMessageIds = new Set<number>();
  const outputViews = new Map<string, OutputViewState>();
  const sync = () => {
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
          renderCard(service, messageId, anchor.id, $card, outputViews);
          mountedMessageIds.add(messageId);
        });
      });
  };

  const $chat = $('#chat');
  $chat.off(EVENT_NAMESPACE);
  $chat.on(`click${EVENT_NAMESPACE}`, `.${CARD_CLASS} [data-action="generate"]`, event => {
    const $card = $(event.currentTarget).closest(`.${CARD_CLASS}`);
    service.generate(Number($card.attr('data-message-id')), String($card.attr('data-block-id')));
  });
  $chat.on(`click${EVENT_NAMESPACE}`, `.${CARD_CLASS} [data-action="edit"]`, event => {
    const $card = $(event.currentTarget).closest(`.${CARD_CLASS}`);
    openEditor(service, Number($card.attr('data-message-id')), String($card.attr('data-block-id')));
  });
  $chat.on(`click${EVENT_NAMESPACE}`, `.${CARD_CLASS} [data-action="output-select"]`, event => {
    const $card = $(event.currentTarget).closest(`.${CARD_CLASS}`);
    const messageId = Number($card.attr('data-message-id'));
    const blockId = String($card.attr('data-block-id'));
    const outputIndex = Number($(event.currentTarget).attr('data-output-index'));
    const block = service.repository.find(messageId, blockId);
    if (!block || !Number.isInteger(outputIndex) || outputIndex < 0 || outputIndex >= block.outputs.length) return;
    outputViews.set(outputStateKey(messageId, blockId), { count: block.outputs.length, index: outputIndex });
    renderCard(service, messageId, blockId, $card, outputViews);
  });

  const stops = [
    eventOn('chatLoaded', sync).stop,
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, sync).stop,
    eventOn(tavern_events.MESSAGE_EDITED, sync).stop,
    eventOn(tavern_events.MESSAGE_DELETED, sync).stop,
    eventOn(tavern_events.MORE_MESSAGES_LOADED, sync).stop,
    eventOn(BLOCKS_CHANGED_EVENT, sync).stop,
  ];
  sync();
  return {
    sync,
    destroy: () => {
      stops.forEach(stop => stop());
      $chat.off(EVENT_NAMESPACE);
      mountedMessageIds.forEach(messageId => void refreshOneMessage(messageId));
      mountedMessageIds.clear();
      outputViews.clear();
    },
  };
}
