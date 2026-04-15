import { matchImgGenRefs, type ImgGenRefMatch } from '../core/blocks';
import { resolveImgGenBlocks, type ImgGenResolvedBlockState } from '../core/message-state';

type ImgGenResolvedMessageState = {
  message: ChatMessage;
  refs: ImgGenRefMatch[];
  blocks: ImgGenResolvedBlockState[];
};

function getImgGenMessage(messageId: number): ChatMessage | undefined {
  return getChatMessages(messageId)[0];
}

export function getResolvedImgGenMessageState(messageId: number): ImgGenResolvedMessageState | undefined {
  const message = getImgGenMessage(messageId);
  if (!message) {
    return undefined;
  }

  const refs = matchImgGenRefs(message.message);
  return {
    message,
    refs,
    blocks: resolveImgGenBlocks(
      messageId,
      refs.map(ref => ref.id),
    ),
  };
}
