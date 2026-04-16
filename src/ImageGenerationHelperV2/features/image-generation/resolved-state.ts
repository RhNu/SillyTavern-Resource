import { createChatGateway } from '@/ImageGenerationHelperV2/adapters/tavern/chat-gateway';
import { matchImgGenRefs, type ImgGenRefMatch } from '@/ImageGenerationHelperV2/features/image-generation/ref-codec';
import { resolveImgGenBlocks, type ImgGenResolvedBlockState } from '@/ImageGenerationHelperV2/features/image-generation/block-repository';

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
