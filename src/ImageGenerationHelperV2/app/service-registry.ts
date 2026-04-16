import { getCurrentBindingContext } from '@/ImageGenerationHelperV2/adapters/tavern/binding-context-gateway';
import { createEventGateway } from '@/ImageGenerationHelperV2/adapters/tavern/event-gateway';
import { createNovelAiImageGateway } from '@/ImageGenerationHelperV2/adapters/ai/novelai-image-gateway';
import { createPromptGenerationGateway } from '@/ImageGenerationHelperV2/adapters/ai/prompt-generation-gateway';
import { getImageGenerationStore } from '@/ImageGenerationHelperV2/config/store';
import { createTaskProjection } from '@/ImageGenerationHelperV2/features/tasking/task-projection';

export function createServiceRegistry() {
  const configStore = getImageGenerationStore();
  const taskProjection = createTaskProjection();
  const eventGateway = createEventGateway();
  const promptGenerationGateway = createPromptGenerationGateway({
    getConfig: () => configStore.getActiveApiPreset(),
  });
  const imageGenerationGateway = createNovelAiImageGateway({
    getImageConfig: () => configStore.getActiveImageConfig(),
    getBindingContext: () => getCurrentBindingContext(),
  });

  return {
    configStore,
    taskProjection,
    eventGateway,
    promptGenerationGateway,
    imageGenerationGateway,
  };
}
