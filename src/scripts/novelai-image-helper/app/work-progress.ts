import type { FailureStage } from '../image-generation/failure';
import type { QueueSnapshot } from '../image-generation/queue';

export type WorkProgressStatus = 'queued' | 'running' | 'paused' | 'cancelling';
export type WorkProgressKind = 'analysis' | 'generation';

export type WorkProgressItem = {
  id: string;
  kind: WorkProgressKind;
  status: WorkProgressStatus;
  title: string;
  detail: string;
  completed: number;
  total?: number;
  cancel?: { label: string; run: () => void };
  updatedAt: number;
};

export type WorkProgressSnapshot = { items: WorkProgressItem[] };

export type WorkProgressInput = Omit<WorkProgressItem, 'updatedAt'>;

const STAGE_LABELS: Record<FailureStage, string> = {
  validate: '检查后端',
  generate: '生成并保存图片',
  commit: '写入楼层',
  associate: '登记聊天背景',
};

function cloneItem(item: WorkProgressItem): WorkProgressItem {
  return {
    ...item,
    cancel: item.cancel ? { ...item.cancel } : undefined,
  };
}

/**
 * 工作进度的内存投影。执行层只向这里报告状态，所有进度界面只订阅这里，
 * 从而避免队列、分析流程分别操作 DOM 和 toast。
 */
export class WorkProgressStore {
  private readonly items = new Map<string, WorkProgressItem>();
  private readonly listeners = new Set<(snapshot: WorkProgressSnapshot) => void>();
  private sequence = 0;

  upsert(input: WorkProgressInput): void {
    this.items.set(input.id, { ...input, updatedAt: ++this.sequence });
    this.emit();
  }

  remove(id: string): void {
    if (!this.items.delete(id)) return;
    this.emit();
  }

  snapshot(): WorkProgressSnapshot {
    return {
      items: [...this.items.values()].sort((left, right) => right.updatedAt - left.updatedAt).map(cloneItem),
    };
  }

  subscribe(listener: (snapshot: WorkProgressSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.items.clear();
    this.emit();
    this.listeners.clear();
  }

  private emit(): void {
    const snapshot = this.snapshot();
    this.listeners.forEach(listener => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error('[NovelAI 图片助手][work-progress] 进度监听器执行失败', error);
      }
    });
  }
}

export function queueSnapshotToProgress(snapshot: QueueSnapshot, cancel: () => void): WorkProgressInput | undefined {
  const pendingCount = snapshot.pending.length;
  const activeCount = snapshot.active ? 1 : 0;
  if (snapshot.mode === 'idle' && activeCount + pendingCount === 0) return undefined;

  const completed =
    (snapshot.batch?.succeededCount ?? 0) + (snapshot.batch?.failedCount ?? 0) + (snapshot.batch?.cancelledCount ?? 0);
  const total = completed + activeCount + pendingCount;
  const active = snapshot.active;
  const detail = active
    ? `${active.summary || `图片块 ${active.blockId}`} · ${active.stage ? STAGE_LABELS[active.stage] : '准备中'}`
    : snapshot.mode === 'paused'
      ? `${pendingCount} 个任务等待恢复`
      : `${pendingCount} 个任务排队中`;

  return {
    id: 'generation-queue',
    kind: 'generation',
    status: snapshot.cancelling ? 'cancelling' : snapshot.mode === 'paused' ? 'paused' : active ? 'running' : 'queued',
    title: 'NovelAI 图片生成',
    detail,
    completed,
    total,
    cancel: { label: '中断全部生图', run: cancel },
  };
}

export function pickFocusedWork(items: WorkProgressItem[]): WorkProgressItem | undefined {
  const priority: Record<WorkProgressKind, number> = { analysis: 2, generation: 1 };
  return [...items].sort(
    (left, right) => priority[right.kind] - priority[left.kind] || right.updatedAt - left.updatedAt,
  )[0];
}

export function workProgressPercent(item: Pick<WorkProgressItem, 'completed' | 'total'>): number | undefined {
  if (!item.total || item.total <= 0) return undefined;
  return Math.round((Math.min(item.completed, item.total) / item.total) * 100);
}
