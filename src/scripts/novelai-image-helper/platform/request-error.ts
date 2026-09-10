export type RequestErrorDetails = {
  statusCode?: number;
  code?: string;
  requestId?: string;
};

/**
 * 平台层（后端插件、酒馆图片上传接口）的统一错误载体。
 *
 * 必须保留 HTTP 状态码与后端错误码：image-generation/failure.ts 依赖它们区分
 * 429 限流、401 凭证失效与 5xx 临时故障。把错误压平成字符串会让 429 与 400
 * 无法区分，重试策略随即失效。
 */
export class RequestError extends Error {
  readonly statusCode?: number;
  readonly code?: string;
  readonly requestId?: string;

  constructor(message: string, details: RequestErrorDetails = {}) {
    super(message);
    this.name = 'RequestError';
    this.statusCode = details.statusCode;
    this.code = details.code;
    this.requestId = details.requestId;
  }
}

export function isRequestError(value: unknown): value is RequestError {
  return value instanceof RequestError;
}
