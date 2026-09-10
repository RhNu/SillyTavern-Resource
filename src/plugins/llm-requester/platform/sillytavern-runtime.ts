import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { UserDirectoryList } from '../../@types/sillytavern-plugin.js';

type SecretsModule = {
  SECRET_KEYS: { CUSTOM: string };
  readSecret(directories: UserDirectoryList, key: string): string;
};

type ConstantsModule = {
  OPENROUTER_HEADERS: Record<string, string>;
};

type AdditionalHeadersModule = {
  getOverrideHeaders(host: string): Record<string, string>;
};

export interface SillyTavernRuntime {
  customApiKey(directories: UserDirectoryList): string;
  requestHeaders(baseUrl: URL): Record<string, string>;
}

function moduleUrl(relativePath: string): string {
  const file = path.resolve(__dirname, '..', '..', relativePath);
  if (!fs.existsSync(file)) throw new Error(`找不到 SillyTavern 模块: ${relativePath}`);
  return pathToFileURL(file).href;
}

export async function loadSillyTavernRuntime(): Promise<SillyTavernRuntime> {
  const [secrets, constants, additionalHeaders] = await Promise.all([
    import(moduleUrl('src/endpoints/secrets.js')) as Promise<SecretsModule>,
    import(moduleUrl('src/constants.js')) as Promise<ConstantsModule>,
    import(moduleUrl('src/additional-headers.js')) as Promise<AdditionalHeadersModule>,
  ]);

  if (typeof secrets.readSecret !== 'function' || typeof secrets.SECRET_KEYS?.CUSTOM !== 'string') {
    throw new Error('SillyTavern secrets 模块不兼容');
  }
  if (!constants.OPENROUTER_HEADERS || typeof additionalHeaders.getOverrideHeaders !== 'function') {
    throw new Error('SillyTavern headers 模块不兼容');
  }

  return {
    customApiKey: directories => secrets.readSecret(directories, secrets.SECRET_KEYS.CUSTOM).trim(),
    requestHeaders: baseUrl => ({
      ...constants.OPENROUTER_HEADERS,
      ...additionalHeaders.getOverrideHeaders(baseUrl.host),
    }),
  };
}
