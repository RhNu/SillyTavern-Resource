import { describe, expect, test } from 'vitest';
import { RequestError } from '../platform/request-error';
import { classifyFailure, GenerationFailureError, timeoutFailure } from './failure';

describe('classifyFailure', () => {
  test('keeps script-declared failures as-is and attaches the stage', () => {
    const failure = classifyFailure(
      new GenerationFailureError('MODEL_UNSUPPORTED', '图片后端不支持模型 x'),
      'validate',
    );

    expect(failure).toEqual({
      code: 'MODEL_UNSUPPORTED',
      message: '图片后端不支持模型 x',
      retryable: false,
      stage: 'validate',
    });
  });

  test('maps backend plugin codes without relying on status heuristics', () => {
    const token = classifyFailure(
      new RequestError('服务端未配置 NOVELAI_TOKEN', { code: 'TOKEN_NOT_CONFIGURED', statusCode: 503 }),
      'validate',
    );
    const upstreamTimeout = classifyFailure(
      new RequestError('NovelAI 请求超时', { code: 'UPSTREAM_TIMEOUT', statusCode: 504 }),
      'generate',
    );
    const unavailable = classifyFailure(
      new RequestError('无法连接 NovelAI', { code: 'UPSTREAM_UNAVAILABLE', statusCode: 502 }),
      'generate',
    );
    const badImage = classifyFailure(
      new RequestError('NovelAI 应返回一张图片', { code: 'INVALID_UPSTREAM_RESPONSE', statusCode: 502 }),
      'generate',
    );

    expect(token).toMatchObject({ code: 'TOKEN_NOT_CONFIGURED', retryable: false });
    expect(upstreamTimeout).toMatchObject({ code: 'TIMEOUT', retryable: true });
    expect(unavailable).toMatchObject({ code: 'NETWORK', retryable: true });
    expect(badImage).toMatchObject({ code: 'INVALID_RESPONSE', retryable: true });
  });

  test('separates rate limiting, auth failures and upstream rejections by status', () => {
    expect(classifyFailure(new RequestError('限流', { statusCode: 429 }), 'generate')).toMatchObject({
      code: 'RATE_LIMITED',
      retryable: true,
    });
    expect(classifyFailure(new RequestError('令牌失效', { statusCode: 401 }), 'generate')).toMatchObject({
      code: 'AUTH',
      retryable: false,
    });
    expect(classifyFailure(new RequestError('被上游拒绝', { statusCode: 400 }), 'generate')).toMatchObject({
      code: 'INVALID_REQUEST',
      retryable: false,
    });
    expect(classifyFailure(new RequestError('服务端异常', { statusCode: 500 }), 'generate')).toMatchObject({
      code: 'UPSTREAM',
      retryable: true,
    });
  });

  test('labels upload failures by stage', () => {
    expect(classifyFailure(new RequestError('上传图片失败 (503)', { statusCode: 503 }), 'upload')).toMatchObject({
      code: 'UPLOAD_FAILED',
      retryable: true,
    });
    expect(classifyFailure(new RequestError('上传图片失败 (413)', { statusCode: 413 }), 'upload')).toMatchObject({
      code: 'UPLOAD_FAILED',
      retryable: false,
    });
  });

  test('falls back to a non-retryable unknown failure for unexpected errors', () => {
    expect(classifyFailure(new Error('提示词解析失败'), 'generate')).toMatchObject({
      code: 'UNKNOWN',
      retryable: false,
      stage: 'generate',
    });
  });

  test('treats fetch failures as retryable network errors', () => {
    expect(classifyFailure(new TypeError('Failed to fetch'), 'generate')).toMatchObject({
      code: 'NETWORK',
      retryable: true,
    });
  });

  test('describes stage timeouts with the configured budget', () => {
    expect(timeoutFailure('generate', 130_000)).toEqual({
      code: 'TIMEOUT',
      message: '请求超时（130 秒）',
      retryable: true,
      stage: 'generate',
    });
  });
});
