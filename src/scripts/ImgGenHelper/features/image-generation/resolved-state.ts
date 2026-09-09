import { createChatGateway } from '@/ImgGenHelper/adapters/tavern/chat-gateway';
import {
  resolveImgGenBlocks,
  type ImgGenResolvedBlockState,
} from '@/ImgGenHelper/features/image-generation/block-repository';
import { matchImgGenRefs, type ImgGenRefMatch } from '@/ImgGenHelper/features/image-generation/ref-codec';

type ImgGenResolvedMessageState = {
  message: ChatMessage;
  refs: ImgGenRefMatch[];
  blocks: ImgGenResolvedBlockState[];
};

function getImgGenMessage(messageId: number): ChatMessage | undefined {
  return createChatGateway().getMessage(messageId);
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
