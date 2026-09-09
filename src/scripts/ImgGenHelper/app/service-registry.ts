import { createNovelAiImageGateway } from '@/ImgGenHelper/adapters/ai/novelai-image-gateway';
import { createPromptGenerationGateway } from '@/ImgGenHelper/adapters/ai/prompt-generation-gateway';
import { getCurrentBindingContext } from '@/ImgGenHelper/adapters/tavern/binding-context-gateway';
import { createEventGateway } from '@/ImgGenHelper/adapters/tavern/event-gateway';
import { getImageGenerationStore } from '@/ImgGenHelper/config/store';
import { createTaskProjection } from '@/ImgGenHelper/features/tasking/task-projection';

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
