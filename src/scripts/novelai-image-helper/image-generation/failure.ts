import type { BlockFailureStage } from '../domain/block';
import { isRequestError, type RequestError } from '../platform/request-error';

export type FailureStage = BlockFailureStage;

/**
 * 结构化失败码。展示与重试判定都以此为准，不再解析错误文本。
 *
 * - 可重试：TIMEOUT / NETWORK / RATE_LIMITED / UPSTREAM / INVALID_RESPONSE / UPLOAD_FAILED
 * - 不可重试：凭证、参数、内容审核、模型与角色约束、块缺失
 */
export type FailureCode =
  | 'TIMEOUT'
  | 'NETWORK'
  | 'RATE_LIMITED'
  | 'UPSTREAM'
  | 'INVALID_REQUEST'
  | 'INVALID_RESPONSE'
  | 'AUTH'
  | 'TOKEN_NOT_CONFIGURED'
  | 'MODEL_UNSUPPORTED'
  | 'CHARACTER_LIMIT'
  | 'UPLOAD_FAILED'
  | 'BLOCK_MISSING'
  | 'UNKNOWN';

export type GenerationFailure = {
  code: FailureCode;
  message: string;
  retryable: boolean;
  stage: FailureStage;
};

const RETRYABLE_CODES = new Set<FailureCode>([
  'TIMEOUT',
  'NETWORK',
  'RATE_LIMITED',
  'UPSTREAM',
  'INVALID_RESPONSE',
  'UPLOAD_FAILED',
]);

export function isRetryableCode(code: FailureCode): boolean {
  return RETRYABLE_CODES.has(code);
}

/** 由本脚本主动判定的失败（模型不支持、角色超限、图片块被删除等）。 */
export class GenerationFailureError extends Error {
  readonly code: FailureCode;
  readonly retryable: boolean;

  constructor(code: FailureCode, message: string, retryable: boolean = isRetryableCode(code)) {
    super(message);
    this.name = 'GenerationFailureError';
    this.code = code;
    this.retryable = retryable;
  }
}

type ClassifiedFailure = Omit<GenerationFailure, 'stage'>;

/** 后端插件已声明的错误码 → 失败码；未列出的码回落到 HTTP 状态码判定。 */
const PLUGIN_FAILURE_CODES: Record<string, ClassifiedFailure> = {
  VALIDATION_ERROR: { code: 'INVALID_REQUEST', message: '', retryable: false },
  TOKEN_NOT_CONFIGURED: { code: 'TOKEN_NOT_CONFIGURED', message: '', retryable: false },
  UPSTREAM_TIMEOUT: { code: 'TIMEOUT', message: '', retryable: true },
  UPSTREAM_UNAVAILABLE: { code: 'NETWORK', message: '', retryable: true },
  INVALID_UPSTREAM_RESPONSE: { code: 'INVALID_RESPONSE', message: '', retryable: true },
  INTERNAL_ERROR: { code: 'UPSTREAM', message: '', retryable: true },
  NON_IMAGE_RESPONSE: { code: 'INVALID_RESPONSE', message: '', retryable: true },
  MISSING_SEED: { code: 'INVALID_RESPONSE', message: '', retryable: true },
  UPLOAD_INVALID_PAYLOAD: { code: 'INVALID_RESPONSE', message: '', retryable: true },
};

function classifyRequestError(error: RequestError, stage: FailureStage): ClassifiedFailure {
  const known = error.code ? PLUGIN_FAILURE_CODES[error.code] : undefined;
  if (known) return { ...known, message: error.message };

  const status = error.statusCode;
  if (status === undefined) return { code: 'UNKNOWN', message: error.message, retryable: false };
  if (status === 429) return { code: 'RATE_LIMITED', message: error.message, retryable: true };
  if (status === 401 || status === 403) return { code: 'AUTH', message: error.message, retryable: false };
  if (status === 408 || status === 504) return { code: 'TIMEOUT', message: error.message, retryable: true };
  if (status >= 500) {
    return { code: stage === 'upload' ? 'UPLOAD_FAILED' : 'UPSTREAM', message: error.message, retryable: true };
  }
  // 上游 4xx：参数错误与内容审核拒绝都落在这里，重试只会继续被拒。
  return { code: stage === 'upload' ? 'UPLOAD_FAILED' : 'INVALID_REQUEST', message: error.message, retryable: false };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isAbortLike(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** fetch 在网络失败时抛 TypeError；这是唯一保留的形态猜测，且仅用于兜底。 */
function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

export function classifyFailure(error: unknown, stage: FailureStage): GenerationFailure {
  if (error instanceof GenerationFailureError) {
    return { code: error.code, message: error.message, retryable: error.retryable, stage };
  }
  if (isRequestError(error)) {
    return { ...classifyRequestError(error, stage), stage };
  }
  if (isAbortLike(error)) {
    return { code: 'TIMEOUT', message: '请求已中止', retryable: true, stage };
  }
  if (isNetworkError(error)) {
    return { code: 'NETWORK', message: '无法连接到服务端，请检查网络或后端插件状态', retryable: true, stage };
  }
  return { code: 'UNKNOWN', message: errorMessage(error), retryable: false, stage };
}

export function timeoutFailure(stage: FailureStage, timeoutMs: number): GenerationFailure {
  return {
    code: 'TIMEOUT',
    message: `请求超时（${Math.round(timeoutMs / 1000)} 秒）`,
    retryable: true,
    stage,
  };
}
