import { logInfo, logWarn } from '@/ImgGenHelper/shared/log';

export class TaskStageTimeoutError<Stage extends string> extends Error {
  constructor(
    readonly stage: Stage,
    readonly timeoutMs: number,
    message?: string,
  ) {
    super(message ?? `${stage} 阶段超时 (${timeoutMs}ms)`);
    this.name = 'TaskStageTimeoutError';
  }
}

export type TaskStagePartial<Stage extends string> = {
  stage: Stage;
  code: string;
  message: string;
  meta?: unknown;
};

type TaskStageGuardOptions = {
  taskName: string;
  taskId: string;
};

type TaskStageRunOptions = {
  timeoutMs?: number;
  timeoutMessage?: string;
  meta?: unknown;
};

function withTimeout<T, Stage extends string>(
  promise: Promise<T>,
  stage: Stage,
  timeoutMs: number,
  timeoutMessage?: string,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race<T>([
    promise,
    new Promise<T>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new TaskStageTimeoutError(stage, timeoutMs, timeoutMessage));
      }, timeoutMs);
    }),
  ]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

export class TaskStageGuard<Stage extends string> {
  private currentStage?: Stage;
  private readonly partials: TaskStagePartial<Stage>[] = [];

  constructor(private readonly options: TaskStageGuardOptions) {}

  enter(stage: Stage, meta?: unknown) {
    this.currentStage = stage;
    logInfo(`${this.options.taskName} 进入阶段`, {
      taskId: this.options.taskId,
      stage,
      ...(meta === undefined ? {} : { meta }),
    });
  }

  async run<T>(stage: Stage, fn: () => Promise<T> | T, options?: TaskStageRunOptions): Promise<T> {
    this.enter(stage, options?.meta);
    const result = Promise.resolve().then(fn);
    if (!options?.timeoutMs || options.timeoutMs <= 0) {
      return result;
    }
    return withTimeout(result, stage, options.timeoutMs, options.timeoutMessage);
  }

  addPartial(stage: Stage, code: string, message: string, meta?: unknown) {
    const partial = { stage, code, message, meta };
    this.partials.push(partial);
    logWarn(`${this.options.taskName} 记录部分成功`, {
      taskId: this.options.taskId,
      partial,
    });
  }

  getCurrentStage() {
    return this.currentStage;
  }

  getPartials() {
    return [...this.partials];
  }

  hasPartials() {
    return this.partials.length > 0;
  }
}
