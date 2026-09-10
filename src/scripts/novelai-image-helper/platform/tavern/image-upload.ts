import { RequestError } from '../request-error';
import { createLogger, serializeError } from '../../app/logger';

const logger = createLogger('platform/tavern/image-upload');

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export async function uploadGeneratedImage(blob: Blob, signal?: AbortSignal): Promise<string> {
  const endpoint = '/api/images/upload';
  logger.debug('开始上传生成图片', {
    endpoint,
    size: blob.size,
    contentType: blob.type || '(empty)',
    aborted: signal?.aborted ?? false,
  });
  try {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: SillyTavern.getRequestHeaders(),
      signal,
      body: JSON.stringify({
        image: bytesToBase64(bytes),
        format: 'png',
        ch_name: SillyTavern.name2?.trim() || undefined,
        filename: `novelai_${Date.now()}`,
      }),
    });
    if (!response.ok) {
      let message = `上传图片失败 (${response.status})`;
      try {
        const payload = (await response.json()) as { error?: unknown };
        if (typeof payload.error === 'string' && payload.error.trim()) message = payload.error;
      } catch (error) {
        logger.warn('无法解析图片上传错误响应', {
          statusCode: response.status,
          error: serializeError(error),
        });
      }
      throw new RequestError(message, {
        statusCode: response.status,
        code: 'UPLOAD_HTTP_ERROR',
      });
    }

    let payload: { path?: unknown; error?: unknown };
    try {
      payload = (await response.json()) as { path?: unknown; error?: unknown };
    } catch (error) {
      logger.warn('图片上传响应不是有效 JSON', {
        statusCode: response.status,
        error: serializeError(error),
      });
      throw new RequestError('上传接口返回了无效 JSON', {
        statusCode: response.status,
        code: 'UPLOAD_INVALID_PAYLOAD',
      });
    }
    if (typeof payload.path !== 'string' || !payload.path.trim()) {
      throw new RequestError(typeof payload.error === 'string' ? payload.error : '上传成功但没有返回图片路径', {
        statusCode: response.status,
        code: 'UPLOAD_INVALID_PAYLOAD',
      });
    }
    const path = payload.path.trim();
    logger.info('图片上传完成', { statusCode: response.status, size: blob.size });
    return path;
  } catch (error) {
    logger.error('图片上传失败', error, { endpoint, size: blob.size });
    throw error;
  }
}
