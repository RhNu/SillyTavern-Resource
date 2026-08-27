/**
 * 后端插件探测: 检查 SillyTavern 是否加载了 NekoJS (nekoai) / NovelAI Bridge (novelai) 服务端插件。
 * 探测结果缓存在模块内, 供设置面板展示与手动刷新。
 */

export type PluginBackend = 'plugin-nekojs' | 'plugin-novelai';

export type PluginBackendStatus = 'unknown' | 'available' | 'unavailable';

export type PluginProbeResult = {
  status: PluginBackendStatus;
  version?: string;
};

/** 插件后端 → 服务端插件 id */
export const PLUGIN_ID_BY_BACKEND: Record<PluginBackend, string> = {
  'plugin-nekojs': 'nekoai',
  'plugin-novelai': 'novelai',
};

export const PLUGIN_BACKENDS = Object.keys(PLUGIN_ID_BY_BACKEND) as PluginBackend[];

const PROBE_TIMEOUT_MS = 3000;

const probeCache = new Map<PluginBackend, PluginProbeResult>();

function initialResult(): PluginProbeResult {
  return { status: 'unknown' };
}

export function getPluginBackendStatus(backend: PluginBackend): PluginProbeResult {
  return probeCache.get(backend) ?? initialResult();
}

async function probeBackend(backend: PluginBackend): Promise<PluginProbeResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const result: PluginProbeResult = { status: 'unavailable' };

  try {
    const response = await fetch(`/api/plugins/${PLUGIN_ID_BY_BACKEND[backend]}/probe`, {
      method: 'GET',
      headers: SillyTavern.getRequestHeaders(),
      signal: controller.signal,
    });

    if (response.ok) {
      try {
        const payload = (await response.json()) as { ok?: unknown; version?: unknown };
        if (payload.ok === true) {
          result.status = 'available';
          if (typeof payload.version === 'string' && payload.version.trim()) {
            result.version = payload.version.trim();
          }
        }
      } catch {
        // 响应不是合法 JSON 或结构不符, 视为不可用
        result.status = 'unavailable';
      }
    }
  } catch {
    // 插件未安装、路由不存在或网络异常都视为不可用
    result.status = 'unavailable';
  } finally {
    clearTimeout(timeoutId);
  }

  probeCache.set(backend, result);
  return result;
}

export async function probePluginBackend(backend: PluginBackend): Promise<PluginProbeResult> {
  return probeBackend(backend);
}

export async function probeAllPluginBackends(): Promise<Record<PluginBackend, PluginProbeResult>> {
  const results = await Promise.all(PLUGIN_BACKENDS.map(backend => probeBackend(backend)));
  return Object.fromEntries(PLUGIN_BACKENDS.map((backend, index) => [backend, results[index]])) as Record<
    PluginBackend,
    PluginProbeResult
  >;
}
