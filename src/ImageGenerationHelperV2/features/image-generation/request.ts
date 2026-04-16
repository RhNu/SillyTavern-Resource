import { createNovelAiImageGateway } from '@/ImageGenerationHelperV2/adapters/ai/novelai-image-gateway';
import { getCurrentBindingContext } from '@/ImageGenerationHelperV2/adapters/tavern/binding-context-gateway';
import { getImageGenerationStore } from '@/ImageGenerationHelperV2/config/store';

type ImageGenerationResult = {
  urls: string[];
};

type RequestSignalController = {
  signal?: AbortSignal;
  cleanup: () => void;
  didTimeout: () => boolean;
};

function createRequestSignal(signal?: AbortSignal, timeoutMs?: number): RequestSignalController {
  if (!signal && (!timeoutMs || timeoutMs <= 0)) {
    return {
      signal: undefined,
      cleanup: () => {},
      didTimeout: () => false,
    };
  }

  const controller = new AbortController();
  let timeoutTriggered = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const abortFromSource = () => {
    if (controller.signal.aborted) {
      return;
    }

    controller.abort(signal?.reason);
  };

  if (signal) {
    if (signal.aborted) {
      abortFromSource();
    } else {
      signal.addEventListener('abort', abortFromSource, { once: true });
    }
  }

  if (timeoutMs && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timeoutTriggered = true;
      if (!controller.signal.aborted) {
        controller.abort(`timeout:${timeoutMs}`);
      }
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (signal) {
        signal.removeEventListener('abort', abortFromSource);
      }
    },
    didTimeout: () => timeoutTriggered,
  };
}

export async function requestImageGeneration(
  prompt: string,
  negativePrompt: string,
  signal?: AbortSignal,
  timeoutMs?: number,
): Promise<ImageGenerationResult> {
  const requestSignal = createRequestSignal(signal, timeoutMs);
  const imageGateway = createNovelAiImageGateway({
    getImageConfig: () => getImageGenerationStore().getActiveImageConfig(),
    getBindingContext: () => getCurrentBindingContext(),
  });

  try {
    const url = await imageGateway.request(prompt, negativePrompt, requestSignal.signal);
    return {
      urls: url ? [url] : [],
    };
  } catch (error) {
    if (requestSignal.didTimeout() && !signal?.aborted) {
      throw new Error(`请求超时 (${Math.round((timeoutMs ?? 0) / 1000)}秒)`);
    }

    throw error;
  } finally {
    requestSignal.cleanup();
  }
}
