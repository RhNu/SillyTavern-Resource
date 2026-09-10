import type { ImageBlock, ImageOutput } from '../domain/block';
import type { MessageBlockRepository } from '../message-blocks/repository';
import type { NovelAiClient } from '../platform/imggen-novelai/client';
import type { Settings } from '../settings/schema';
import { withStageTimeout } from './abort';
import {
  classifyFailure,
  GenerationFailureError,
  timeoutFailure,
  type FailureStage,
  type GenerationFailure,
} from './failure';
import { shouldRetry, type RetryPolicy } from './retry-policy';

/** capabilities 是本地后端插件的轻量探测，用固定的短超时即可。 */
const CAPABILITIES_TIMEOUT_MS = 15_000;

export type TaskOutcome =
  | { status: 'succeeded'; output: ImageOutput }
  | { status: 'failed'; failure: GenerationFailure; attempts: number };

export type GenerationTaskDeps = {
  messageId: number;
  blockId: string;
  signal: AbortSignal;
  repository: MessageBlockRepository;
  client: NovelAiClient;
  upload: (blob: Blob, signal?: AbortSignal) => Promise<string>;
  generation: Settings['generation'];
  policy: RetryPolicy;
  /** 一次阶段尝试开始前调用：等待节流闸门、写入块状态、记录尝试次数。 */
  beginAttempt: (stage: FailureStage, attempt: number) => Promise<void>;
  /** 一次阶段尝试结束后调用：推进节流闸门的下一个可派发时刻。 */
  finishAttempt: (stage: FailureStage) => void;
  onRetry: (info: { stage: FailureStage; attempt: number; maxAttempts: number; failure: GenerationFailure }) => void;
};

/** 阶段重试耗尽后的内部信号，用于把失败与尝试次数带到流水线出口。 */
class StageFailed extends Error {
  readonly failure: GenerationFailure;
  readonly attempts: number;

  constructor(failure: GenerationFailure, attempts: number) {
    super(failure.message);
    this.name = 'StageFailed';
    this.failure = failure;
    this.attempts = attempts;
  }
}

function stageTimeoutMs(stage: FailureStage, generation: Settings['generation']): number {
  if (stage === 'validate') return CAPABILITIES_TIMEOUT_MS;
  if (stage === 'generate') return generation.timeoutMs;
  if (stage === 'upload') return generation.uploadTimeoutMs;
  return 0;
}

/**
 * 执行一个图片块的完整流水线：validate → generate → upload → commit。
 *
 * 3–5 秒节流与自动重试共用同一套等待：每次尝试结束后调用 `finishAttempt` 推进闸门，
 * 下一次尝试前由 `beginAttempt` 等待，因此「任务之间」与「重试之前」的间隔完全一致。
 * 上传阶段的自动重试复用已经生成好的图片，不会再次消耗 NovelAI 配额。
 *
 * 取消 / 暂停 / 销毁会以 abort reason 的形式直接抛出，不在这里转成失败。
 */
export async function runGenerationTask(deps: GenerationTaskDeps): Promise<TaskOutcome> {
  const { repository, messageId, blockId, signal, generation, policy } = deps;
  const attempts = new Map<FailureStage, number>();

  const runStage = async <T>(stage: FailureStage, action: (stageSignal: AbortSignal) => Promise<T>): Promise<T> => {
    for (;;) {
      const attempt = (attempts.get(stage) ?? 0) + 1;
      attempts.set(stage, attempt);
      await deps.beginAttempt(stage, attempt);

      const timeoutMs = stageTimeoutMs(stage, generation);
      const scoped = withStageTimeout(signal, timeoutMs, stage);
      try {
        return await action(scoped.signal);
      } catch (error) {
        if (signal.aborted) throw error;
        const failure = scoped.didTimeout() ? timeoutFailure(stage, timeoutMs) : classifyFailure(error, stage);
        if (!shouldRetry(failure, attempt, policy)) throw new StageFailed(failure, attempt);
        deps.onRetry({ stage, attempt, maxAttempts: policy.maxAttempts, failure });
      } finally {
        scoped.dispose();
        deps.finishAttempt(stage);
      }
    }
  };

  try {
    const block: ImageBlock | undefined = repository.find(messageId, blockId);
    if (!block)
      throw new StageFailed(
        classifyFailure(new GenerationFailureError('BLOCK_MISSING', '图片块已被删除'), 'validate'),
        0,
      );

    await runStage('validate', async stageSignal => {
      const capabilities = await deps.client.capabilities(stageSignal);
      if (!capabilities.configured) {
        throw new GenerationFailureError('TOKEN_NOT_CONFIGURED', '服务端未配置 NOVELAI_TOKEN');
      }
      const model = capabilities.models.find(entry => entry.id === generation.model);
      if (!model) {
        throw new GenerationFailureError('MODEL_UNSUPPORTED', `图片后端不支持模型 ${generation.model}`);
      }
      if (block.prompt.characters.length > model.maxCharacters) {
        throw new GenerationFailureError(
          'CHARACTER_LIMIT',
          `${generation.model} 最多支持 ${model.maxCharacters} 个角色，当前提示词包含 ${block.prompt.characters.length} 个`,
        );
      }
    });

    const generated = await runStage('generate', stageSignal =>
      deps.client.generate(block.prompt, generation, stageSignal),
    );
    if (generated.requestId) {
      console.info(`[NovelAI Image Helper] 生成完成 request=${generated.requestId} seed=${generated.seed}`);
    }

    // 复用同一个 blob：上传阶段的重试不应重新生成图片。
    const url = await runStage('upload', stageSignal => deps.upload(generated.blob, stageSignal));

    const output: ImageOutput = {
      url,
      seed: generated.seed,
      model: generated.model,
      createdAt: new Date().toISOString(),
    };
    await runStage('commit', async () => {
      const saved = repository.update(messageId, blockId, current => ({
        ...current,
        revision: current.revision + 1,
        status: 'ready',
        error: undefined,
        outputs: [...current.outputs, output],
      }));
      if (!saved) throw new GenerationFailureError('BLOCK_MISSING', '图片块已被删除，生成结果无法写回');
    });

    return { status: 'succeeded', output };
  } catch (error) {
    if (error instanceof StageFailed) {
      return { status: 'failed', failure: error.failure, attempts: error.attempts };
    }
    throw error;
  }
}
