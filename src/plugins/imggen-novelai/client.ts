import { PluginError } from './errors.ts';
import type { NovelAiWireRequest } from './wire.ts';

const NOVELAI_IMAGE_API_URL = 'https://image.novelai.net/ai/generate-image';
const REQUEST_TIMEOUT_MS = 120_000;

async function readUpstreamError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text.trim()) {
    return `NovelAI 请求失败 (${response.status})`;
  }
  try {
    const payload = JSON.parse(text) as { message?: unknown };
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }
  } catch {
    // 上游并不保证错误响应始终是 JSON。
  }
  return text.trim().slice(0, 2_000);
}

export async function requestNovelAiImage(
  token: string,
  body: NovelAiWireRequest,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort(signal?.reason);
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new Error('NovelAI request timeout'));
  }, REQUEST_TIMEOUT_MS);

  if (signal?.aborted) {
    abortFromCaller();
  } else {
    signal?.addEventListener('abort', abortFromCaller, { once: true });
  }

  try {
    const response = await fetch(NOVELAI_IMAGE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new PluginError(response.status, 'UPSTREAM_ERROR', await readUpstreamError(response));
    }

    return new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    if (timedOut) {
      throw new PluginError(504, 'UPSTREAM_TIMEOUT', 'NovelAI 请求超时');
    }
    if (signal?.aborted) {
      throw new PluginError(499, 'CLIENT_ABORTED', '客户端已中止请求');
    }
    if (error instanceof PluginError) {
      throw error;
    }
    throw new PluginError(502, 'UPSTREAM_UNAVAILABLE', `无法连接 NovelAI: ${String(error)}`);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}
