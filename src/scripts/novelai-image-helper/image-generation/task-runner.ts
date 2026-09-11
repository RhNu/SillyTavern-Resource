import type { ImageBlock, ImageOutput } from '../domain/block';
import { createLogger, serializeError } from '../app/logger';
import type { ChatImageRepository } from '../message-blocks/repository';
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
const logger = createLogger('generation/task-runner');

export type TaskOutcome =
  | { status: 'succeeded'; output: ImageOutput }
  | { status: 'failed'; failure: GenerationFailure; attempts: number };

export type GenerationTaskDeps = {
  messageId: number;
  blockId: string;
  signal: AbortSignal;
  repository: ChatImageRepository;
  assertCurrent: () => void;
  client: NovelAiClient;
  associate: (imagePath: string, signal?: AbortSignal) => Promise<void>;
  /** 上次仅登记失败时直接重用已经提交的输出，不重新生成或上传。 */
  resumeAssociationPath?: string;
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
  return 0;
}

/**
 * 执行一个图片块的完整流水线：validate → generate-and-store → commit → associate。
 *
 * 3–5 秒节流与自动重试共用同一套等待：每次尝试结束后调用 `finishAttempt` 推进闸门，
 * 下一次尝试前由 `beginAttempt` 等待，因此「任务之间」与「重试之前」的间隔完全一致。
 * 生成阶段的自动重试复用 operationId，由后端保证模糊响应不会重复生成；登记阶段在
 * outputs 成为事实来源后单独重试，也不会重新生成图片。
 *
 * 取消 / 暂停 / 销毁会以 abort reason 的形式直接抛出，不在这里转成失败。
 */
export async function runGenerationTask(deps: GenerationTaskDeps): Promise<TaskOutcome> {
  const { repository, messageId, blockId, signal, generation, policy } = deps;
  const attempts = new Map<FailureStage, number>();

  logger.info('开始执行图片任务流水线', {
    messageId,
    blockId,
    model: generation.model,
    maxAttempts: policy.maxAttempts,
  });

  const runStage = async <T>(stage: FailureStage, action: (stageSignal: AbortSignal) => Promise<T>): Promise<T> => {
    let attempt = 0;
    for (;;) {
      attempt += 1;
      attempts.set(stage, (attempts.get(stage) ?? 0) + 1);
      logger.debug('开始执行任务阶段', { messageId, blockId, stage, attempt });
      signal.throwIfAborted();
      deps.assertCurrent();
      await deps.beginAttempt(stage, attempt);

      const timeoutMs = stageTimeoutMs(stage, generation);
      const scoped = withStageTimeout(signal, timeoutMs, stage);
      try {
        scoped.signal.throwIfAborted();
        deps.assertCurrent();
        const result = await action(scoped.signal);
        scoped.signal.throwIfAborted();
        deps.assertCurrent();
        logger.debug('任务阶段完成', { messageId, blockId, stage, attempt });
        return result;
      } catch (error) {
        if (signal.aborted) {
          logger.info('任务阶段因取消或销毁而中止', {
            messageId,
            blockId,
            stage,
            attempt,
            reason: serializeError(signal.reason),
          });
          throw error;
        }
        const failure = scoped.didTimeout() ? timeoutFailure(stage, timeoutMs) : classifyFailure(error, stage);
        if (!shouldRetry(failure, attempt, policy)) {
          logger.warn('任务阶段失败且不再重试', {
            messageId,
            blockId,
            stage,
            attempt,
            code: failure.code,
            retryable: failure.retryable,
            message: failure.message,
            error: serializeError(error),
          });
          throw new StageFailed(failure, attempt);
        }
        logger.warn('任务阶段失败，将自动重试', {
          messageId,
          blockId,
          stage,
          attempt,
          maxAttempts: policy.maxAttempts,
          code: failure.code,
          message: failure.message,
          error: serializeError(error),
        });
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

    const resumeOutput = deps.resumeAssociationPath
      ? block.outputs.find(output => output.url === deps.resumeAssociationPath)
      : undefined;
    if (resumeOutput) {
      logger.info('恢复未完成的聊天背景登记', { messageId, blockId, imagePath: resumeOutput.url });
      await runStage('associate', stageSignal => deps.associate(resumeOutput.url, stageSignal));
      await runStage('commit', async () => {
        const saved = repository.update(messageId, blockId, current => ({
          ...current,
          status: 'ready',
          pendingAssociation: undefined,
          error: undefined,
        }));
        if (!saved) throw new GenerationFailureError('BLOCK_MISSING', '图片块已被删除，无法完成背景登记');
      });
      return { status: 'succeeded', output: resumeOutput };
    }

    await runStage('validate', async stageSignal => {
      const capabilities = await deps.client.capabilities(stageSignal);
      logger.debug('图片后端能力已获取', {
        messageId,
        blockId,
        configured: capabilities.configured,
        modelCount: capabilities.models.length,
      });
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

    const operationId = crypto.randomUUID();
    const generated = await runStage('generate', stageSignal =>
      deps.client.generateStored(block.prompt, generation, operationId, stageSignal),
    );
    logger.info('任务生成阶段完成', {
      messageId,
      blockId,
      requestId: generated.requestId,
      seed: generated.seed,
      model: generated.model,
      size: generated.bytes,
      path: generated.path,
    });

    const output: ImageOutput = {
      url: generated.path,
      mime: generated.mime,
      bytes: generated.bytes,
      seed: generated.seed,
      model: generated.model,
      createdAt: new Date().toISOString(),
    };
    await runStage('commit', async () => {
      const saved = repository.update(messageId, blockId, current => ({
        ...current,
        status: 'ready',
        error: undefined,
        outputs: current.outputs.some(item => item.url === output.url) ? current.outputs : [...current.outputs, output],
        pendingAssociation: output.url,
      }));
      if (!saved) throw new GenerationFailureError('BLOCK_MISSING', '图片块已被删除，生成结果无法写回');
    });

    await runStage('associate', stageSignal => deps.associate(output.url, stageSignal));
    await runStage('commit', async () => {
      const saved = repository.update(messageId, blockId, current => ({
        ...current,
        pendingAssociation: undefined,
        status: 'ready',
        error: undefined,
      }));
      if (!saved) throw new GenerationFailureError('BLOCK_MISSING', '图片块已被删除');
    });

    logger.info('图片任务流水线完成', {
      messageId,
      blockId,
      seed: output.seed,
      model: output.model,
      attempts: Object.fromEntries(attempts),
    });
    return { status: 'succeeded', output };
  } catch (error) {
    if (error instanceof StageFailed) {
      logger.warn('图片任务以结构化失败结束', {
        messageId,
        blockId,
        code: error.failure.code,
        stage: error.failure.stage,
        attempts: error.attempts,
        retryable: error.failure.retryable,
        message: error.failure.message,
      });
      return { status: 'failed', failure: error.failure, attempts: error.attempts };
    }
    logger.error('图片任务出现未预期异常', error, { messageId, blockId, attempts: Object.fromEntries(attempts) });
    throw error;
  }
}
