/**
 * 后端插件探测: 检查 SillyTavern 是否加载了 NekoAI Bridge 服务端插件。
 * 探测结果缓存在模块内, 供设置面板展示与手动刷新。
 */

export type NekoaiPluginStatus = 'unknown' | 'available' | 'unavailable';

export const NEKOAI_PLUGIN_ID = 'nekoai';

const PLUGIN_PROBE_URL = `/api/plugins/${NEKOAI_PLUGIN_ID}/probe`;
const PROBE_TIMEOUT_MS = 3000;

let cachedStatus: NekoaiPluginStatus = 'unknown';

export function getNekoaiPluginStatus(): NekoaiPluginStatus {
  return cachedStatus;
}

export async function probeNekoaiPlugin(): Promise<NekoaiPluginStatus> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(PLUGIN_PROBE_URL, {
      method: 'GET',
      headers: SillyTavern.getRequestHeaders(),
      signal: controller.signal,
    });

    let ok = response.ok;
    if (ok) {
      try {
        const payload = (await response.json()) as { ok?: unknown };
        ok = payload.ok === true;
      } catch {
        ok = false;
      }
    }

    cachedStatus = ok ? 'available' : 'unavailable';
  } catch {
    // 插件未安装、路由不存在或网络异常都视为不可用
    cachedStatus = 'unavailable';
  } finally {
    clearTimeout(timeoutId);
  }

  return cachedStatus;
}
