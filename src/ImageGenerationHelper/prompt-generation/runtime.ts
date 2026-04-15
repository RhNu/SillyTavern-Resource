import {
  applyExtractTags,
  applyFilterTags,
  buildImgGenRef,
  hasImgGenRefs,
  stripImgGenBlocks,
  stripXmlComments,
} from '../core/blocks';
import { IMGGEN_BLOCK_STATE_UPDATED_EVENT } from '../core/constants';
import { logError, logInfo, logWarn } from '../core/log';
import {
  clearImgGenBlocksFromMessageVariables,
  createImgGenBlockId,
  createImgGenMessageBlockState,
  setImgGenBlocksInMessageVariables,
  type ImgGenResolvedBlockState,
} from '../core/message-state';
import { getImageGenerationStore, subscribeImageGenerationStore } from '../core/store';
import type { TaskCenter, TaskResultToast } from '../core/task-center';
import { TaskStageGuard, TaskStageTimeoutError, type TaskStagePartial } from '../core/task-stage';
import { showErrorToast, showInfoToast, showWarningToast } from '../core/toast';
import { generateImageBlocks, queueAutomaticImageBlocks } from '../image-generation/runtime';
import { BUILTIN_PROMPT_GENERATION_MESSAGES, MessageEntry } from './defaults';
import {
  PROMPT_GENERATION_HISTORY_CONTEXT_TOKEN,
  PROMPT_GENERATION_LATEST_STORY_TOKEN,
  PROMPT_GENERATION_PROMPT_TEMPLATE_TOKEN,
  PROMPT_GENERATION_WORLDBOOK_CONTEXT_TOKEN,
  replacePromptToken,
} from './placeholders';
import {
  parsePromptGenerationResponse,
  type PromptGenerationInsertion,
  type PromptGenerationResponse,
} from './protocol';
import { buildResolvedPromptTemplate } from './template';

type PromptStage =
  | 'prepare_context'
  | 'request_model'
  | 'parse_response'
  | 'write_message'
  | 'write_variables'
  | 'emit_ui_sync';

type PromptGenerationLoggedError = Error & {
  __imggenLogged?: boolean;
  __imggenToastMessage?: string;
  __imggenInterrupted?: boolean;
};

type PromptGenerationRun = {
  id: string;
  generationId: string;
  messageId: number;
  manual: boolean;
  cancelled: boolean;
  cancelReason?: 'button' | 'destroy';
  cancelDelay?: () => void;
  toastMessage: string;
  guard: TaskStageGuard<PromptStage>;
};

type PromptRunOutcome =
  | {
      status: 'success';
      manual: boolean;
      insertedCount: number;
      queuedCount: number;
      nextBlockIds: string[];
      partials: TaskStagePartial<PromptStage>[];
      messageId: number;
    }
  | {
      status: 'empty';
      manual: boolean;
      messageId: number;
    }
  | {
      status: 'interrupted';
      manual: boolean;
      messageId: number;
      cancelReason?: 'button' | 'destroy';
    }
  | {
      status: 'error';
      manual: boolean;
      messageId: number;
      error: unknown;
    };

type PromptGenerationAnalysisResult = {
  responseObject: PromptGenerationResponse;
  insertions: PromptGenerationInsertion[];
};

type PreparedInsertions = {
  nextText: string;
  nextBlocks: ImgGenResolvedBlockState[];
};

const PROMPT_WRITE_MESSAGE_TIMEOUT_MS = 10_000;
const PROMPT_UI_SYNC_TIMEOUT_MS = 3_000;
const PROMPT_MANUAL_GROUP_ID = 'prompt-manual';
const PROMPT_AUTO_GROUP_ID = 'prompt-auto';

let activePromptGenerationRun: PromptGenerationRun | undefined;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let debouncedMessageId: number | undefined;
let queuedAutoMessageId: number | undefined;
let promptTaskCenter: TaskCenter | undefined;

function getAssistantMessage(messageId: number) {
  return getChatMessages(messageId)[0];
}

function previewText(text: string, limit = 200): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit)}...`;
}

function normalizePromptGenerationResponse(response: string | GenerateToolCallResult): string {
  if (typeof response === 'string') {
    return response;
  }

  if (response.tool_calls.length > 0) {
    logWarn('提示词生成返回了 tool_calls，将仅使用文本内容继续解析', {
      toolCallCount: response.tool_calls.length,
      hasContent: response.content.trim().length > 0,
    });
  }

  return response.content;
}

function createLoggedPromptGenerationError(
  message: string,
  options?: {
    cause?: unknown;
    toastMessage?: string;
    logged?: boolean;
    interrupted?: boolean;
  },
): PromptGenerationLoggedError {
  const error = new Error(message) as PromptGenerationLoggedError & { cause?: unknown };
  error.cause = options?.cause;
  error.__imggenLogged = options?.logged ?? false;
  error.__imggenToastMessage = options?.toastMessage;
  error.__imggenInterrupted = options?.interrupted ?? false;
  return error;
}

function hasLoggedPromptGenerationError(error: unknown): boolean {
  return error instanceof Error && Boolean((error as PromptGenerationLoggedError).__imggenLogged);
}

function isPromptGenerationInterrupted(error: unknown): boolean {
  return error instanceof Error && Boolean((error as PromptGenerationLoggedError).__imggenInterrupted);
}

function getPromptGenerationErrorToastMessage(error: unknown): string {
  if (error instanceof Error) {
    return (error as PromptGenerationLoggedError).__imggenToastMessage ?? error.message;
  }

  return '提示词生成失败';
}

function createPromptGenerationInterruptedError(messageId: number): PromptGenerationLoggedError {
  return createLoggedPromptGenerationError(`消息${messageId} 的提示词生成已中断`, {
    toastMessage: `消息${messageId} 的提示词生成已中断`,
    logged: true,
    interrupted: true,
  });
}

function buildPromptTaskDetail(messageId: number, content: string, queuedMessageId?: number): string {
  const lines = [`消息${messageId}`, content];
  if (queuedMessageId !== undefined && queuedMessageId !== messageId) {
    lines.push(`消息${queuedMessageId} 正在等待上一条任务完成...`);
  }
  return lines.join('<br>');
}

function syncManualPromptTaskGroup() {
  const taskCenter = promptTaskCenter;
  if (!taskCenter) {
    return;
  }

  const run = activePromptGenerationRun?.manual ? activePromptGenerationRun : undefined;
  if (!run) {
    taskCenter.removeGroup(PROMPT_MANUAL_GROUP_ID);
    return;
  }

  taskCenter.upsertGroup({
    id: PROMPT_MANUAL_GROUP_ID,
    kind: 'prompt-manual',
    status: run.cancelled ? 'cancelling' : 'running',
    title: '手动提示词生成',
    detail: buildPromptTaskDetail(run.messageId, run.toastMessage, queuedAutoMessageId),
    counts: {
      queued: 0,
      running: 1,
      succeeded: 0,
      failed: 0,
      cancelled: 0,
    },
    focus: { messageId: run.messageId },
    cancelAction: {
      label: '取消提示词生成',
      run: () => {
        cancelPromptGeneration({ reason: 'button' });
      },
    },
  });
}

function syncAutoPromptTaskGroup() {
  const taskCenter = promptTaskCenter;
  if (!taskCenter) {
    return;
  }

  const run = activePromptGenerationRun?.manual ? undefined : activePromptGenerationRun;
  if (!run && debouncedMessageId === undefined && queuedAutoMessageId === undefined) {
    taskCenter.removeGroup(PROMPT_AUTO_GROUP_ID);
    return;
  }

  const messageId = run?.messageId ?? debouncedMessageId ?? queuedAutoMessageId;
  if (messageId === undefined) {
    taskCenter.removeGroup(PROMPT_AUTO_GROUP_ID);
    return;
  }

  taskCenter.upsertGroup({
    id: PROMPT_AUTO_GROUP_ID,
    kind: 'prompt-auto',
    status: run ? (run.cancelled ? 'cancelling' : 'running') : 'queued',
    title: '自动提示词生成',
    detail: run
      ? buildPromptTaskDetail(run.messageId, run.toastMessage, queuedAutoMessageId)
      : buildPromptTaskDetail(
          messageId,
          debouncedMessageId !== undefined ? '正在等待触发...' : '正在等待上一条任务完成...',
        ),
    counts: {
      queued: debouncedMessageId !== undefined || queuedAutoMessageId !== undefined ? 1 : 0,
      running: run ? 1 : 0,
      succeeded: 0,
      failed: 0,
      cancelled: 0,
    },
    focus: { messageId },
    cancelAction: {
      label: '取消自动提示词生成',
      run: () => {
        cancelAutomaticPromptGeneration({ reason: 'button' });
      },
    },
  });
}

function syncPromptTaskGroups() {
  syncManualPromptTaskGroup();
  syncAutoPromptTaskGroup();
}

function buildPromptResultToast(runId: string, outcome: PromptRunOutcome): TaskResultToast | undefined {
  if (outcome.status === 'interrupted') {
    if (outcome.cancelReason === 'destroy') {
      return undefined;
    }
    return {
      level: 'info',
      title: '提示词生成',
      message: outcome.manual ? `已取消消息${outcome.messageId} 的提示词生成` : '已停止自动提示词生成任务',
      dedupeKey: `${runId}:interrupted`,
    };
  }

  if (outcome.status === 'empty') {
    if (!outcome.manual) {
      return undefined;
    }
    return {
      level: 'info',
      title: '提示词生成',
      message: `消息${outcome.messageId} 没有生成可插入的提示词`,
      dedupeKey: `${runId}:empty`,
    };
  }

  if (outcome.status === 'error') {
    return {
      level: 'error',
      title: '提示词生成',
      message: getPromptGenerationErrorToastMessage(outcome.error),
      dedupeKey: `${runId}:error:${getPromptGenerationErrorToastMessage(outcome.error)}`,
    };
  }

  const hasUiSyncPartial = outcome.partials.some(partial => partial.stage === 'emit_ui_sync');
  if (outcome.manual) {
    return {
      level: hasUiSyncPartial ? 'warning' : 'success',
      title: '提示词生成',
      message: hasUiSyncPartial
        ? '提示词已插入，但界面同步超时，请稍后刷新楼层或等待自动刷新'
        : `已插入 ${outcome.insertedCount} 个提示词，开始生图`,
      dedupeKey: `${runId}:${hasUiSyncPartial ? 'partial' : 'success'}`,
    };
  }

  if (!hasUiSyncPartial) {
    return undefined;
  }

  return {
    level: 'warning',
    title: '提示词生成',
    message:
      outcome.queuedCount > 0
        ? `已插入 ${outcome.insertedCount} 个提示词，${outcome.queuedCount} 个自动生图任务已排队，但界面同步超时，请稍后刷新楼层或等待自动刷新`
        : `已插入 ${outcome.insertedCount} 个提示词，但界面同步超时，请稍后刷新楼层或等待自动刷新`,
    dedupeKey: `${runId}:partial`,
  };
}

function setPromptRunToastMessage(run: PromptGenerationRun, message: string) {
  run.toastMessage = message;
  if (activePromptGenerationRun?.id === run.id) {
    syncPromptTaskGroups();
  }
}

function beginPromptGenerationRun(messageId: number, manual: boolean): PromptGenerationRun {
  const generationId = `${getScriptId()}-prompt-${messageId}-${Date.now()}`;
  const run: PromptGenerationRun = {
    id: crypto.randomUUID(),
    generationId,
    messageId,
    manual,
    cancelled: false,
    toastMessage: '正在准备上下文...',
    guard: new TaskStageGuard<PromptStage>({
      taskName: manual ? '手动提示词生成' : '提示词生成',
      taskId: generationId,
    }),
  };
  activePromptGenerationRun = run;
  syncPromptTaskGroups();
  return run;
}

function isRunCancelled(run: PromptGenerationRun): boolean {
  return run.cancelled || activePromptGenerationRun?.id !== run.id;
}

function throwIfRunCancelled(run: PromptGenerationRun): void {
  if (isRunCancelled(run)) {
    throw createPromptGenerationInterruptedError(run.messageId);
  }
}

function waitForRetryDelay(run: PromptGenerationRun, delayMs: number): Promise<void> {
  if (delayMs <= 0) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    const complete = () => {
      if (run.cancelDelay === cancelDelay) {
        run.cancelDelay = undefined;
      }
      resolve();
    };
    const timer = setTimeout(complete, delayMs);
    const cancelDelay = () => {
      clearTimeout(timer);
      complete();
    };
    run.cancelDelay = cancelDelay;
  });
}

function cancelPromptGeneration(options?: { reason?: 'button' | 'destroy' }) {
  const hadDebounce = Boolean(debounceTimer);
  const hadQueued = queuedAutoMessageId !== undefined;
  const run = activePromptGenerationRun;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
  }
  debouncedMessageId = undefined;
  queuedAutoMessageId = undefined;

  if (run) {
    run.cancelled = true;
    run.cancelReason = options?.reason;
    run.cancelDelay?.();
    run.toastMessage = '正在中止...';
    stopGenerationById(run.generationId);
  }

  syncPromptTaskGroups();

  const interrupted = hadDebounce || hadQueued || Boolean(run);
  if (interrupted && !run && options?.reason !== 'destroy' && promptTaskCenter) {
    promptTaskCenter.finishGroup(PROMPT_AUTO_GROUP_ID, {
      level: 'info',
      title: '提示词生成',
      message: '已停止自动提示词生成任务',
      dedupeKey: `prompt-auto-cancel:${Date.now()}`,
    });
  }

  return interrupted;
}

function cancelAutomaticPromptGeneration(options?: { reason?: 'button' | 'destroy' }) {
  const hadDebounce = Boolean(debounceTimer);
  const hadQueued = queuedAutoMessageId !== undefined;
  const autoRun = activePromptGenerationRun?.manual ? undefined : activePromptGenerationRun;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
  }
  debouncedMessageId = undefined;
  queuedAutoMessageId = undefined;

  if (autoRun) {
    autoRun.cancelled = true;
    autoRun.cancelReason = options?.reason;
    autoRun.cancelDelay?.();
    autoRun.toastMessage = '正在停止自动任务...';
    stopGenerationById(autoRun.generationId);
  }

  syncPromptTaskGroups();

  const interrupted = hadDebounce || hadQueued || Boolean(autoRun);
  if (interrupted && !autoRun && options?.reason !== 'destroy' && promptTaskCenter) {
    promptTaskCenter.finishGroup(PROMPT_AUTO_GROUP_ID, {
      level: 'info',
      title: '提示词生成',
      message: '已停止自动提示词生成任务',
      dedupeKey: `prompt-auto-cancel:${Date.now()}`,
    });
  }

  return interrupted;
}

function isAutoPromptGenerationEnabled(): boolean {
  const store = getImageGenerationStore();
  return store.config.enabled && store.config.independentApi.autoRequest;
}

function sanitizeContextText(rawText: string): string {
  return stripXmlComments(stripImgGenBlocks(rawText));
}

function sanitizeInsertionPrompt(prompt: string): string {
  return stripXmlComments(prompt).trim();
}

function collectParagraphs(rawText: string): string[] {
  const store = getImageGenerationStore();
  const minParagraphLength = store.config.independentApi.paragraphMinLength;
  const filtered = applyFilterTags(
    applyExtractTags(sanitizeContextText(rawText), store.config.independentApi.extractTags),
    store.config.independentApi.filterTags,
  )
    .replace(/```[\s\S]*?```/g, '[CODE_BLOCK]')
    .replace(/<code[\s\S]*?<\/code>/gi, '[CODE_BLOCK]')
    .trim();

  let paragraphs = filtered.split(/\n\n+/);
  if (paragraphs.length <= 2 && filtered.length > 300) {
    const singleLineParagraphs = filtered.split(/\n/);
    if (singleLineParagraphs.length > paragraphs.length) {
      paragraphs = singleLineParagraphs;
    }
  }

  return paragraphs
    .map(item => item.trim())
    .filter(item => item !== '[CODE_BLOCK]' && item.length >= minParagraphLength);
}

function formatParagraphsForPrompt(paragraphs: string[]): string {
  return paragraphs.map((paragraph, index) => `[P${index + 1}] ${paragraph}`).join('\n\n');
}

function buildHistoryContext(messageId: number, count: number): string {
  const start = Math.max(0, messageId - count);
  const history = getChatMessages(`${start}-${Math.max(start, messageId - 1)}`);
  return history
    .map(message => {
      const cleanedMessage = sanitizeContextText(message.message);
      const roleName = message.role === 'assistant' ? 'AI' : message.role === 'user' ? '用户' : '系统';
      return `${roleName}: ${cleanedMessage}`;
    })
    .join('\n\n');
}

async function buildWorldbookContext(): Promise<string> {
  const worldbookNames = new Set<string>();
  const charWorldbooks = getCharWorldbookNames('current');
  const chatWorldbook = getChatWorldbookName('current');

  [charWorldbooks.primary, ...charWorldbooks.additional, chatWorldbook].filter(Boolean).forEach(worldbookName => {
    worldbookNames.add(worldbookName!);
  });

  const sections: string[] = [];

  for (const worldbookName of worldbookNames) {
    try {
      const entries = await getWorldbook(worldbookName);
      const enabledEntries = entries
        .filter(entry => entry.enabled)
        .map(entry => ({ entry, content: stripXmlComments(entry.content).trim() }))
        .filter(item => item.content);
      if (enabledEntries.length === 0) {
        continue;
      }

      const content = enabledEntries
        .map(({ entry, content: sanitizedContent }) => {
          const title = entry.name || `条目 ${entry.uid}`;
          return `【${title}】\n${sanitizedContent}`;
        })
        .join('\n\n');

      sections.push(`### ${worldbookName}\n${content}`);
    } catch (error) {
      logWarn(`读取世界书失败: ${worldbookName}`, error);
    }
  }

  return sections.join('\n\n');
}

function buildPromptGenerationMessages(
  latestParagraphs: string,
  historyContext: string,
  worldbookContext: string,
): MessageEntry[] {
  const templateText = buildResolvedPromptTemplate();

  return BUILTIN_PROMPT_GENERATION_MESSAGES.map(message => {
    if (typeof message === 'string') {
      return message;
    }
    let content = message.content;
    content = replacePromptToken(content, PROMPT_GENERATION_HISTORY_CONTEXT_TOKEN, historyContext);
    content = replacePromptToken(content, PROMPT_GENERATION_WORLDBOOK_CONTEXT_TOKEN, worldbookContext);
    content = replacePromptToken(content, PROMPT_GENERATION_PROMPT_TEMPLATE_TOKEN, templateText);
    content = replacePromptToken(content, PROMPT_GENERATION_LATEST_STORY_TOKEN, latestParagraphs);
    return {
      role: message.role,
      content,
    };
  });
}

function parsePromptGenerationResult(rawResponse: string): PromptGenerationAnalysisResult {
  const cleaned = stripXmlComments(rawResponse).trim();
  if (!cleaned) {
    logError('提示词生成返回为空，无法解析 insertions', {
      rawLength: rawResponse.length,
    });
    throw createLoggedPromptGenerationError('提示词生成返回为空，无法解析 insertions', {
      toastMessage: '提示词生成返回为空，请查看控制台日志',
      logged: true,
    });
  }

  try {
    const responseObject = parsePromptGenerationResponse(cleaned);
    return {
      responseObject,
      insertions: responseObject.arguments.insertions,
    };
  } catch (error) {
    logError('提示词生成返回解析失败', {
      rawLength: cleaned.length,
      rawPreview: previewText(cleaned, 400),
    });
    throw createLoggedPromptGenerationError(error instanceof Error ? error.message : '提示词生成返回结构不合法', {
      cause: error,
      toastMessage: error instanceof Error ? error.message : '提示词生成返回结构不合法，请查看控制台日志',
      logged: true,
    });
  }
}

function locateParagraphEndPositions(originalText: string, paragraphs: string[]): number[] {
  const positions: number[] = [];

  for (const [index, paragraph] of paragraphs.entries()) {
    const searchFrom = positions[index - 1] ?? 0;
    const prefix = paragraph.slice(0, Math.min(30, paragraph.length));
    const suffix = paragraph.slice(Math.max(0, paragraph.length - 30));
    let startIndex = originalText.indexOf(prefix, searchFrom);

    if (startIndex < 0) {
      startIndex = originalText.indexOf(prefix.slice(0, Math.min(15, prefix.length)), searchFrom);
    }

    if (startIndex < 0) {
      positions.push(Math.min(originalText.length, searchFrom + paragraph.length));
      continue;
    }

    let endIndex = originalText.indexOf(suffix, startIndex);
    if (endIndex >= 0) {
      endIndex += suffix.length;
    } else {
      endIndex = startIndex + paragraph.length;
    }

    positions.push(Math.min(endIndex, originalText.length));
  }

  return positions;
}

function prepareInsertions(
  originalText: string,
  insertions: PromptGenerationInsertion[],
  manual: boolean,
): PreparedInsertions {
  const paragraphs = collectParagraphs(originalText);
  const paragraphEndPositions = locateParagraphEndPositions(originalText, paragraphs);

  if (paragraphEndPositions.length === 0) {
    return {
      nextText: originalText,
      nextBlocks: [],
    };
  }

  const insertionsByParagraph = new Map<number, ImgGenResolvedBlockState[]>();
  const maxIndex = paragraphEndPositions.length - 1;

  for (const insertion of insertions) {
    const sanitizedPrompt = sanitizeInsertionPrompt(insertion.prompt);
    if (!sanitizedPrompt) {
      logWarn('忽略空提示词插入', {
        after_paragraph: insertion.after_paragraph,
      });
      continue;
    }

    let targetIndex = insertion.after_paragraph - 1;
    if (targetIndex < 0 || targetIndex > maxIndex) {
      const adjustedIndex = Math.min(Math.max(targetIndex, 0), maxIndex);
      logWarn('提示词插入位置越界，已自动修正到最近段落', {
        requestedAfterParagraph: insertion.after_paragraph,
        adjustedAfterParagraph: adjustedIndex + 1,
        paragraphCount: paragraphEndPositions.length,
      });
      targetIndex = adjustedIndex;
    }

    const blockState: ImgGenResolvedBlockState = {
      ...createImgGenMessageBlockState(createImgGenBlockId(), sanitizedPrompt),
      preventAuto: manual,
    };
    const current = insertionsByParagraph.get(targetIndex) ?? [];
    current.push(blockState);
    insertionsByParagraph.set(targetIndex, current);
  }

  let nextText = '';
  let cursor = 0;
  const nextBlocks: ImgGenResolvedBlockState[] = [];

  for (let paragraphIndex = 0; paragraphIndex < paragraphEndPositions.length; paragraphIndex += 1) {
    const endPosition = paragraphEndPositions[paragraphIndex];
    nextText += originalText.slice(cursor, endPosition);
    cursor = endPosition;

    const paragraphBlocks = insertionsByParagraph.get(paragraphIndex) ?? [];
    if (paragraphBlocks.length === 0) {
      continue;
    }

    nextText += paragraphBlocks.map(block => `\n\n${buildImgGenRef(block.id)}`).join('');
    nextBlocks.push(...paragraphBlocks);
  }

  nextText += originalText.slice(cursor);

  return {
    nextText,
    nextBlocks,
  };
}

async function callPromptGenerator(
  run: PromptGenerationRun,
  paragraphs: string[],
): Promise<PromptGenerationAnalysisResult> {
  const store = getImageGenerationStore();
  setPromptRunToastMessage(run, '正在整理段落、历史上下文和世界书...');
  const prepared = await run.guard.run(
    'prepare_context',
    async () => {
      const historyContext = buildHistoryContext(run.messageId, store.config.independentApi.historyCount);
      const worldbookContext = await buildWorldbookContext();
      const orderedPrompts = buildPromptGenerationMessages(
        formatParagraphsForPrompt(paragraphs),
        historyContext,
        worldbookContext,
      );
      return {
        historyContext,
        worldbookContext,
        orderedPrompts,
      };
    },
    {
      meta: {
        messageId: run.messageId,
        paragraphCount: paragraphs.length,
      },
    },
  );
  throwIfRunCancelled(run);

  const activeApiPreset = store.getActiveApiPreset();
  const diagnostics = {
    messageId: run.messageId,
    paragraphCount: paragraphs.length,
    paragraphMinLength: store.config.independentApi.paragraphMinLength,
    paragraphPreview: paragraphs.slice(0, 3).map(paragraph => previewText(paragraph, 120)),
    historyLength: prepared.historyContext.length,
    worldbookLength: prepared.worldbookContext.length,
    retryCount: store.config.independentApi.retryCount,
    retryDelaySeconds: store.config.independentApi.retryDelaySeconds,
    orderedPromptCount: prepared.orderedPrompts.length,
    orderedPromptSummary: prepared.orderedPrompts.map((prompt, index) => {
      if (typeof prompt === 'string')
        return {
          index,
          type: 'builtin',
          name: prompt,
        };
      else
        return {
          index,
          role: prompt.role,
          length: prompt.content.length,
          preview: previewText(prompt.content, 120),
        };
    }),
    api: {
      apiurl: activeApiPreset.apiurl,
      model: activeApiPreset.model,
      source: 'openai',
      max_tokens: activeApiPreset.max_tokens,
      temperature: activeApiPreset.temperature,
      top_p: activeApiPreset.top_p,
      frequency_penalty: activeApiPreset.frequency_penalty,
      presence_penalty: activeApiPreset.presence_penalty,
    },
  };
  const requestConfig = {
    should_silence: true,
    custom_api: {
      apiurl: activeApiPreset.apiurl,
      key: activeApiPreset.key || undefined,
      model: activeApiPreset.model,
      source: 'openai',
      max_tokens: activeApiPreset.max_tokens,
      temperature: activeApiPreset.temperature,
      top_p: activeApiPreset.top_p,
      frequency_penalty: activeApiPreset.frequency_penalty,
      presence_penalty: activeApiPreset.presence_penalty,
    },
    ordered_prompts: prepared.orderedPrompts,
  };
  const maxAttempts = store.config.independentApi.retryCount + 1;
  const retryDelayMs = store.config.independentApi.retryDelaySeconds * 1000;

  logInfo('开始执行提示词生成', diagnostics);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      throwIfRunCancelled(run);
      setPromptRunToastMessage(run, `正在执行提示词生成 (${attempt}/${maxAttempts})...`);
      const response = await run.guard.run(
        'request_model',
        () =>
          generateRaw({
            ...requestConfig,
            generation_id: run.generationId,
          }),
        {
          meta: {
            attempt,
            maxAttempts,
          },
        },
      );
      throwIfRunCancelled(run);

      const responseText = normalizePromptGenerationResponse(response);

      logInfo('提示词生成返回成功', {
        messageId: run.messageId,
        attempt,
        maxAttempts,
        responseLength: responseText.length,
        responsePreview: previewText(responseText, 400),
      });

      setPromptRunToastMessage(run, `已收到响应，正在解析结果 (${attempt}/${maxAttempts})...`);
      const parsedResult = await run.guard.run('parse_response', () => parsePromptGenerationResult(responseText), {
        meta: {
          attempt,
          maxAttempts,
        },
      });
      logInfo('提示词生成解析完成', {
        messageId: run.messageId,
        attempt,
        maxAttempts,
        insertionCount: parsedResult.insertions.length,
        insertions: parsedResult.insertions.map(insertion => ({
          after_paragraph: insertion.after_paragraph,
          reasoningPreview: previewText(insertion.reasoning ?? '', 120),
          promptPreview: previewText(insertion.prompt, 120),
        })),
      });
      return parsedResult;
    } catch (error) {
      if (isRunCancelled(run)) {
        throw createPromptGenerationInterruptedError(run.messageId);
      }

      const isLastAttempt = attempt >= maxAttempts;
      const isUnexpectedJsonEnd =
        error instanceof SyntaxError ||
        (error instanceof Error && error.message.includes('Unexpected end of JSON input'));

      if (isLastAttempt) {
        if (hasLoggedPromptGenerationError(error)) {
          logError(
            '提示词生成已达到最大重试次数',
            {
              ...diagnostics,
              attempt,
              maxAttempts,
            },
            error,
          );
          throw error;
        }

        logError(
          '执行提示词生成失败',
          {
            ...diagnostics,
            attempt,
            maxAttempts,
          },
          error,
        );
        throw createLoggedPromptGenerationError(
          isUnexpectedJsonEnd
            ? '提示词生成响应不是完整 JSON，可能是接口返回空内容、HTML 错误页，或当前接口并不兼容 openai source'
            : error instanceof Error
              ? error.message
              : '提示词生成请求失败',
          {
            cause: error,
            toastMessage: isUnexpectedJsonEnd
              ? '提示词生成响应不是完整 JSON，请查看控制台日志'
              : error instanceof Error
                ? error.message
                : '提示词生成请求失败',
            logged: true,
          },
        );
      }

      logWarn(
        '提示词生成失败，准备重试',
        {
          attempt,
          messageId: run.messageId,
          maxAttempts,
          retryDelaySeconds: store.config.independentApi.retryDelaySeconds,
        },
        error,
      );
      setPromptRunToastMessage(
        run,
        `请求失败，${store.config.independentApi.retryDelaySeconds} 秒后重试 (${attempt + 1}/${maxAttempts})`,
      );

      if (retryDelayMs > 0) {
        await waitForRetryDelay(run, retryDelayMs);
        throwIfRunCancelled(run);
      }
    }
  }

  throw createLoggedPromptGenerationError('提示词生成请求失败', {
    toastMessage: '提示词生成请求失败',
    logged: true,
  });
}

async function applyInsertionsToMessage(
  run: PromptGenerationRun,
  refreshUi: () => void,
  originalText: string,
  responseObject: PromptGenerationResponse,
  insertions: PromptGenerationInsertion[],
): Promise<ImgGenResolvedBlockState[]> {
  const latestMessage = getAssistantMessage(run.messageId);
  if (!latestMessage || latestMessage.role !== 'assistant') {
    throw createLoggedPromptGenerationError('目标消息已不存在或不再是 AI 消息，请重试提示词生成', {
      toastMessage: '目标消息已变化，请重试提示词生成',
      logged: true,
    });
  }

  if (latestMessage.message !== originalText) {
    logWarn('提示词写回前消息内容发生变化，将基于最新内容尝试插入', {
      messageId: run.messageId,
      hasImageRefs: hasImgGenRefs(latestMessage.message),
    });
  }

  if (latestMessage.message !== originalText && hasImgGenRefs(latestMessage.message)) {
    logWarn('提示词写回前消息已包含图片锚点，跳过本次写回以避免重复插入', {
      messageId: run.messageId,
    });
    return [];
  }

  const prepared = prepareInsertions(latestMessage.message, insertions, run.manual);
  if (prepared.nextBlocks.length === 0) {
    logWarn('提示词插入结果为空，跳过写回', {
      messageId: run.messageId,
      insertionCount: insertions.length,
    });
    return [];
  }

  setPromptRunToastMessage(run, `正在插入 ${prepared.nextBlocks.length} 个提示词...`);
  await run.guard.run(
    'write_message',
    () =>
      setChatMessages(
        [
          {
            message_id: run.messageId,
            message: prepared.nextText,
          },
        ],
        { refresh: 'affected' },
      ),
    {
      timeoutMs: PROMPT_WRITE_MESSAGE_TIMEOUT_MS,
      timeoutMessage: '写回消息超时，请稍后检查楼层内容是否已更新',
    },
  );
  throwIfRunCancelled(run);

  await run.guard.run('write_variables', () => {
    setImgGenBlocksInMessageVariables(run.messageId, prepared.nextBlocks, {
      promptGenerationResponse: responseObject,
    });
  });
  throwIfRunCancelled(run);

  try {
    await run.guard.run(
      'emit_ui_sync',
      async () => {
        refreshUi();
        await eventEmit(IMGGEN_BLOCK_STATE_UPDATED_EVENT, run.messageId);
      },
      {
        timeoutMs: PROMPT_UI_SYNC_TIMEOUT_MS,
        timeoutMessage: '提示词已插入，但界面同步超时，请稍后刷新楼层或等待自动刷新',
      },
    );
  } catch (error) {
    run.guard.addPartial(
      'emit_ui_sync',
      error instanceof TaskStageTimeoutError ? 'ui_sync_timeout' : 'ui_sync_failed',
      '提示词已插入，但界面同步超时，请稍后刷新楼层或等待自动刷新',
      error,
    );
    logWarn('提示词插入后界面同步失败', { messageId: run.messageId }, error);
    refreshUi();
  }

  return prepared.nextBlocks;
}

async function finishPromptRun(runId: string, outcome: PromptRunOutcome) {
  if (activePromptGenerationRun?.id === runId) {
    activePromptGenerationRun.cancelDelay?.();
    activePromptGenerationRun = undefined;
  }
  promptTaskCenter?.finishGroup(
    outcome.manual ? PROMPT_MANUAL_GROUP_ID : PROMPT_AUTO_GROUP_ID,
    buildPromptResultToast(runId, outcome),
  );
  syncPromptTaskGroups();

  if (outcome.status === 'success' && outcome.manual) {
    await generateImageBlocks(outcome.messageId, outcome.nextBlockIds, {
      origin: 'manual',
      requestId: `${runId}:generated-images`,
    });
  }
}

async function runQueuedAutoPromptGeneration(refreshUi: () => void) {
  if (queuedAutoMessageId === undefined || activePromptGenerationRun || !isAutoPromptGenerationEnabled()) {
    syncPromptTaskGroups();
    return;
  }

  const nextMessageId = queuedAutoMessageId;
  queuedAutoMessageId = undefined;
  syncPromptTaskGroups();
  await executePromptGeneration(nextMessageId, refreshUi, { manual: false });
}

async function executePromptGeneration(
  messageId: number,
  refreshUi: () => void,
  options: {
    manual: boolean;
  },
) {
  let run: PromptGenerationRun | undefined;

  try {
    const store = getImageGenerationStore();
    if (!store.config.enabled) {
      return;
    }

    if (!options.manual && !store.config.independentApi.autoRequest) {
      return;
    }

    const message = getAssistantMessage(messageId);
    if (!message || message.role !== 'assistant') {
      throw new Error('只能对 AI 消息执行提示词生成分析');
    }

    if (hasImgGenRefs(message.message)) {
      await finishPromptRun(`empty:${messageId}:${options.manual ? 'manual' : 'auto'}`, {
        status: 'empty',
        manual: options.manual,
        messageId,
      });
      return;
    }

    const paragraphs = collectParagraphs(message.message);
    if (paragraphs.length === 0) {
      await finishPromptRun(`empty:${messageId}:${options.manual ? 'manual' : 'auto'}`, {
        status: 'empty',
        manual: options.manual,
        messageId,
      });
      return;
    }

    run = beginPromptGenerationRun(messageId, options.manual);
    const analysis = await callPromptGenerator(run, paragraphs);
    throwIfRunCancelled(run);

    if (analysis.insertions.length === 0) {
      await finishPromptRun(run.id, {
        status: 'empty',
        manual: options.manual,
        messageId,
      });
      return;
    }

    const nextBlocks = await applyInsertionsToMessage(
      run,
      refreshUi,
      message.message,
      analysis.responseObject,
      analysis.insertions,
    );
    throwIfRunCancelled(run);

    if (nextBlocks.length === 0) {
      await finishPromptRun(run.id, {
        status: 'empty',
        manual: options.manual,
        messageId,
      });
      return;
    }

    const queuedCount = options.manual
      ? 0
      : queueAutomaticImageBlocks(
          messageId,
          nextBlocks.map(block => block.id),
        );

    await finishPromptRun(run.id, {
      status: 'success',
      manual: options.manual,
      insertedCount: nextBlocks.length,
      queuedCount,
      nextBlockIds: nextBlocks.map(block => block.id),
      partials: run.guard.getPartials(),
      messageId,
    });
  } catch (error) {
    if (isPromptGenerationInterrupted(error)) {
      if (run) {
        await finishPromptRun(run.id, {
          status: 'interrupted',
          manual: options.manual,
          messageId,
          cancelReason: run.cancelReason,
        });
      }
      return;
    }

    if (!hasLoggedPromptGenerationError(error)) {
      logError(options.manual ? '手动提示词生成失败' : '提示词生成失败', { messageId }, error);
    }

    if (run) {
      await finishPromptRun(run.id, {
        status: 'error',
        manual: options.manual,
        messageId,
        error,
      });
      return;
    }

    showErrorToast(getPromptGenerationErrorToastMessage(error), '提示词生成');
  } finally {
    if (run) {
      run.cancelDelay = undefined;
    }
    await runQueuedAutoPromptGeneration(refreshUi);
  }
}

export function initializePromptGeneration(refreshUi: () => void, taskCenter: TaskCenter) {
  promptTaskCenter = taskCenter;
  const stopEnabledWatch = subscribeImageGenerationStore(
    state => state.config.enabled,
    enabled => {
      if (!enabled) {
        cancelPromptGeneration({ reason: 'destroy' });
      }
    },
  );
  const stopAutoRequestWatch = subscribeImageGenerationStore(
    state => state.config.independentApi.autoRequest,
    enabled => {
      if (!enabled) {
        cancelAutomaticPromptGeneration({ reason: 'destroy' });
      }
    },
  );

  const onMessageReceived = async (messageId: number) => {
    const store = getImageGenerationStore();
    if (!store.config.enabled || !store.config.independentApi.autoRequest) {
      return;
    }

    if (messageId + 1 < store.config.independentApi.minFloor) {
      return;
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debouncedMessageId = messageId;
    syncPromptTaskGroups();
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      debouncedMessageId = undefined;

      if (!isAutoPromptGenerationEnabled()) {
        syncPromptTaskGroups();
        return;
      }

      if (activePromptGenerationRun) {
        queuedAutoMessageId = messageId;
        syncPromptTaskGroups();
        return;
      }

      syncPromptTaskGroups();
      void executePromptGeneration(messageId, refreshUi, { manual: false });
    }, store.config.independentApi.debounceMs);
  };

  const stop = eventOn(tavern_events.MESSAGE_RECEIVED, onMessageReceived).stop;

  return {
    destroy: () => {
      stopEnabledWatch();
      stopAutoRequestWatch();
      cancelPromptGeneration({ reason: 'destroy' });
      promptTaskCenter?.removeGroup(PROMPT_MANUAL_GROUP_ID);
      promptTaskCenter?.removeGroup(PROMPT_AUTO_GROUP_ID);
      promptTaskCenter = undefined;
      stop();
    },
    rerunLatest: async () => {
      const store = getImageGenerationStore();
      if (!store.config.enabled) {
        showWarningToast('脚本已关闭');
        return;
      }

      if (
        activePromptGenerationRun ||
        debounceTimer ||
        queuedAutoMessageId !== undefined ||
        debouncedMessageId !== undefined
      ) {
        showInfoToast('已有提示词生成任务在执行或等待中，请先点击 toast 上的“中止提示词生成”', '提示词生成');
        return;
      }

      try {
        for (let messageId = getLastMessageId(); messageId >= 0; messageId -= 1) {
          const message = getAssistantMessage(messageId);
          if (!message || message.role !== 'assistant') {
            continue;
          }

          const strippedText = stripImgGenBlocks(message.message);
          if (strippedText !== message.message) {
            await setChatMessages(
              [
                {
                  message_id: messageId,
                  message: strippedText,
                },
              ],
              { refresh: 'affected' },
            );
          }
          clearImgGenBlocksFromMessageVariables(messageId);
          await eventEmit(IMGGEN_BLOCK_STATE_UPDATED_EVENT, messageId);

          await executePromptGeneration(messageId, refreshUi, { manual: true });
          return;
        }

        showWarningToast('没有可用于手动提示词生成的 AI 消息', '提示词生成');
      } catch (error) {
        if (!hasLoggedPromptGenerationError(error)) {
          logError('手动提示词生成失败', error);
        }
        showErrorToast(getPromptGenerationErrorToastMessage(error), '提示词生成');
      }
    },
  };
}
