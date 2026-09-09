type QueueTaskRef = {
  messageId: number;
  blockId: string;
  blockDisplayIndex?: number;
};

export type AutoGenerationQueueSnapshot = {
  pendingCount: number;
  activeCount: number;
  focusTask?: QueueTaskRef;
};

function buildTaskLabel(task?: QueueTaskRef) {
  if (!task) {
    return '当前没有焦点任务';
  }

  return `当前任务：消息${task.messageId}${task.blockDisplayIndex ? ` · 块${task.blockDisplayIndex}` : ''}`;
}

export function buildAutoGenerationQueueToastMessage(snapshot: AutoGenerationQueueSnapshot) {
  return [`等待中 ${snapshot.pendingCount} / 进行中 ${snapshot.activeCount}`, buildTaskLabel(snapshot.focusTask)].join(
    '<br>',
  );
}

export function hasAutoGenerationQueueWork(snapshot: AutoGenerationQueueSnapshot) {
  return snapshot.pendingCount > 0 || snapshot.activeCount > 0;
}
