import { showChatInputWork, type ChatInputWorkSession } from '@util/ui/chat-input-work';
import { createLogger } from '../app/logger';
import type { NovelAiImageService } from '../app/service';
import { pickFocusedWork, type WorkProgressItem, workProgressPercent } from '../app/work-progress';

const logger = createLogger('ui/chat-input-work');

function toInputState(status: WorkProgressItem['status']): 'running' | 'paused' | 'cancelling' {
  return status === 'paused' ? 'paused' : status === 'cancelling' ? 'cancelling' : 'running';
}

/** 工作存在期间占用聊天输入栏，防止用户误触发另一轮消息生成。 */
export function mountChatInputWork(service: NovelAiImageService): { destroy: () => void } {
  let session: ChatInputWorkSession | undefined;
  let focus: WorkProgressItem | undefined;
  let destroyed = false;

  const render = (): void => {
    if (destroyed || !focus) {
      session?.destroy();
      session = undefined;
      return;
    }

    const isGeneration = focus.kind === 'generation';
    const options = {
      progress: workProgressPercent(focus),
      indeterminate: isGeneration && (focus.status === 'queued' || focus.status === 'running'),
      state: toInputState(focus.status),
      onPause: isGeneration ? () => service.pauseQueue() : undefined,
      onResume: isGeneration ? () => service.resumeQueue() : undefined,
      onStop: focus.cancel ? () => focus?.cancel?.run() : undefined,
    };
    if (session?.active) session.update(options);
    else session = showChatInputWork(options);
  };

  const unsubscribe = service.progress.subscribe(snapshot => {
    focus = pickFocusedWork(snapshot.items);
    try {
      render();
    } catch (error) {
      logger.error('更新聊天输入栏工作状态失败', error);
    }
  });

  return {
    destroy: () => {
      destroyed = true;
      unsubscribe();
      session?.destroy();
      session = undefined;
    },
  };
}
