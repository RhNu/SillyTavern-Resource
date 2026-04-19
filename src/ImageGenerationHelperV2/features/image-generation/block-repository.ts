import {
  IMAGE_GEN_ID_PREFIX,
  IMGGEN_MESSAGE_VARIABLE_KEY,
  IMGGEN_MESSAGE_VARIABLE_VERSION,
} from '@/ImageGenerationHelperV2/app/ids';
import { createMessageVariableGateway } from '@/ImageGenerationHelperV2/adapters/tavern/message-variable-gateway';
import {
  PromptGenerationResponseSchema,
  type PromptGenerationResponse,
} from '@/ImageGenerationHelperV2/features/prompt-generation/protocol';

export type ImgGenMessageBlockState = {
  prompt: string;
  mediaUrls: string[];
  preventAuto: boolean;
  isScheduled: boolean;
};

export type ImgGenResolvedBlockState = ImgGenMessageBlockState & {
  id: string;
};

export type ImgGenMessageVariablePayload = {
  blocks: Record<string, ImgGenMessageBlockState>;
  promptGenerationResponse?: PromptGenerationResponse;
};

function normalizePrompt(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeMediaUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map(url => (typeof url === 'string' ? url.trim() : '')).filter(Boolean))];
}

function normalizeBlockId(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePromptGenerationResponse(value: unknown): PromptGenerationResponse | undefined {
  const parsed = PromptGenerationResponseSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export function createImgGenBlockId(): string {
  return `${IMAGE_GEN_ID_PREFIX}${crypto.randomUUID().replace(/-/g, '')}`;
}

export function createImgGenMessageBlockState(id: string, prompt = ''): ImgGenResolvedBlockState {
  return {
    id: normalizeBlockId(id),
    prompt: normalizePrompt(prompt),
    mediaUrls: [],
    preventAuto: false,
    isScheduled: false,
  };
}

export function normalizeImgGenMessageBlockState(
  id: string,
  value: Partial<ImgGenMessageBlockState> | unknown,
  fallbackPrompt = '',
): ImgGenResolvedBlockState {
  const normalizedId = normalizeBlockId(id);
  if (!normalizedId) {
    return createImgGenMessageBlockState('', fallbackPrompt);
  }

  if (!value || typeof value !== 'object') {
    return createImgGenMessageBlockState(normalizedId, fallbackPrompt);
  }

  const source = value as Record<string, unknown>;
  return {
    id: normalizedId,
    prompt: normalizePrompt(source.prompt) || normalizePrompt(fallbackPrompt),
    mediaUrls: normalizeMediaUrls(source.mediaUrls),
    preventAuto: Boolean(source.preventAuto),
    isScheduled: Boolean(source.isScheduled),
  };
}

function getMessageVariableOption(messageId: number): VariableOption {
  return {
    type: 'message',
    message_id: messageId,
  };
}

const messageVariableGateway = createMessageVariableGateway();

function buildStoredBlocks(blocks: ImgGenResolvedBlockState[]): Record<string, ImgGenMessageBlockState> {
  return blocks.reduce<Record<string, ImgGenMessageBlockState>>((result, block) => {
    result[block.id] = {
      prompt: block.prompt,
      mediaUrls: block.mediaUrls,
      preventAuto: block.preventAuto,
      isScheduled: block.isScheduled,
    };
    return result;
  }, {});
}

function readStoredImgGenPayloadFromVariables(variables: unknown): ImgGenMessageVariablePayload {
  if (!variables || typeof variables !== 'object') {
    return {
      blocks: {},
    };
  }

  const payload = (variables as Record<string, unknown>)[IMGGEN_MESSAGE_VARIABLE_KEY];
  if (!payload || typeof payload !== 'object') {
    return {
      blocks: {},
    };
  }

  const source = payload as Record<string, unknown>;
  const normalizedBlocks =
    !source.blocks || typeof source.blocks !== 'object' || Array.isArray(source.blocks)
      ? {}
      : Object.entries(source.blocks as Record<string, unknown>).reduce<Record<string, ImgGenMessageBlockState>>(
          (result, [id, block]) => {
            const normalizedId = normalizeBlockId(id);
            if (!normalizedId) {
              return result;
            }

            const normalized = normalizeImgGenMessageBlockState(normalizedId, block);
            result[normalizedId] = {
              prompt: normalized.prompt,
              mediaUrls: normalized.mediaUrls,
              preventAuto: normalized.preventAuto,
              isScheduled: normalized.isScheduled,
            };
            return result;
          },
          {},
        );

  return {
    blocks: normalizedBlocks,
    promptGenerationResponse: normalizePromptGenerationResponse(source.promptGenerationResponse),
  };
}

function readStoredImgGenPayload(messageId: number): ImgGenMessageVariablePayload {
  return readStoredImgGenPayloadFromVariables(messageVariableGateway.readMessageVariables(messageId));
}

function buildStoredImgGenPayload(payload: ImgGenMessageVariablePayload): Record<string, unknown> {
  const nextPayload: Record<string, unknown> = {
    version: IMGGEN_MESSAGE_VARIABLE_VERSION,
    blocks: payload.blocks,
  };

  if (payload.promptGenerationResponse) {
    nextPayload.promptGenerationResponse = payload.promptGenerationResponse;
  }

  return nextPayload;
}

export function resolveImgGenBlocks(messageId: number, ids: string[]): ImgGenResolvedBlockState[] {
  const storedBlocks = readStoredImgGenPayload(messageId).blocks;
  return ids
    .map(id => normalizeBlockId(id))
    .filter(Boolean)
    .map(id => normalizeImgGenMessageBlockState(id, storedBlocks[id]));
}

export function setImgGenBlocksInMessageVariables(
  messageId: number,
  blocks: ImgGenResolvedBlockState[],
  options?: {
    promptGenerationResponse?: PromptGenerationResponse | null;
  },
): Record<string, any> {
  const normalizedBlocks = blocks
    .map(block => normalizeImgGenMessageBlockState(block.id, block, block.prompt))
    .filter(block => block.id);

  return updateVariablesWith(variables => {
    const nextVariables = variables && typeof variables === 'object' ? { ...variables } : {};
    const currentPayload = readStoredImgGenPayloadFromVariables(nextVariables);
    const nextPayload: ImgGenMessageVariablePayload = {
      blocks: buildStoredBlocks(normalizedBlocks),
      promptGenerationResponse:
        options && Object.prototype.hasOwnProperty.call(options, 'promptGenerationResponse')
          ? (options.promptGenerationResponse ?? undefined)
          : currentPayload.promptGenerationResponse,
    };

    if (normalizedBlocks.length === 0 && !nextPayload.promptGenerationResponse) {
      delete nextVariables[IMGGEN_MESSAGE_VARIABLE_KEY];
      return nextVariables;
    }

    nextVariables[IMGGEN_MESSAGE_VARIABLE_KEY] = buildStoredImgGenPayload(nextPayload);
    return nextVariables;
  }, getMessageVariableOption(messageId));
}

export function setPromptGenerationResponseInMessageVariables(
  messageId: number,
  promptGenerationResponse: PromptGenerationResponse | null,
): Record<string, any> {
  return updateVariablesWith(variables => {
    const nextVariables = variables && typeof variables === 'object' ? { ...variables } : {};
    const currentPayload = readStoredImgGenPayloadFromVariables(nextVariables);
    const nextPayload: ImgGenMessageVariablePayload = {
      blocks: currentPayload.blocks,
      promptGenerationResponse: promptGenerationResponse ?? undefined,
    };

    if (Object.keys(nextPayload.blocks).length === 0 && !nextPayload.promptGenerationResponse) {
      delete nextVariables[IMGGEN_MESSAGE_VARIABLE_KEY];
      return nextVariables;
    }

    nextVariables[IMGGEN_MESSAGE_VARIABLE_KEY] = buildStoredImgGenPayload(nextPayload);
    return nextVariables;
  }, getMessageVariableOption(messageId));
}

export function clearImgGenBlocksFromMessageVariables(messageId: number): Record<string, any> {
  return updateVariablesWith(variables => {
    const nextVariables = variables && typeof variables === 'object' ? { ...variables } : {};
    delete nextVariables[IMGGEN_MESSAGE_VARIABLE_KEY];
    return nextVariables;
  }, getMessageVariableOption(messageId));
}
