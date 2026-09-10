import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { LlmCredential, LlmProvider } from '../../../../util/llm-requester/contract.js';
import type { UserDirectoryList } from '../../@types/sillytavern-plugin.js';
import { PROVIDERS, type ProviderDefinition } from '../providers.ts';

type SecretState = { id: string; label: string; active: boolean };
type SecretManagerInstance = {
  getSecretState(): Record<string, SecretState[] | null>;
  readSecret(key: string, id: string | null): string;
};
type SecretsModule = {
  SECRET_KEYS: Record<string, string>;
  SecretManager: new (directories: UserDirectoryList) => SecretManagerInstance;
};
type ConstantsModule = { OPENROUTER_HEADERS: Record<string, string> };
type AdditionalHeadersModule = { getOverrideHeaders(host: string): Record<string, string> };

export type ResolvedConnection = {
  providerId: string;
  baseUrl: string;
  apiKey: string;
  headers: Record<string, string>;
};

export interface SillyTavernRuntime {
  providers(directories: UserDirectoryList): LlmProvider[];
  resolveConnection(
    directories: UserDirectoryList,
    provider: ProviderDefinition,
    credentialId: string | undefined,
    customBaseUrl: string | undefined,
  ): ResolvedConnection;
}

function moduleUrl(relativePath: string): string {
  const file = path.resolve(__dirname, '..', '..', relativePath);
  if (!fs.existsSync(file)) throw new Error(`找不到 SillyTavern 模块: ${relativePath}`);
  return pathToFileURL(file).href;
}

function credentialList(state: Record<string, SecretState[] | null>, secretKey: string): LlmCredential[] {
  const entries = state[secretKey];
  if (!Array.isArray(entries)) return [];
  return entries.map(entry => ({ id: entry.id, label: entry.label, active: entry.active }));
}

export async function loadSillyTavernRuntime(): Promise<SillyTavernRuntime> {
  const [secrets, constants, additionalHeaders] = await Promise.all([
    import(moduleUrl('src/endpoints/secrets.js')) as Promise<SecretsModule>,
    import(moduleUrl('src/constants.js')) as Promise<ConstantsModule>,
    import(moduleUrl('src/additional-headers.js')) as Promise<AdditionalHeadersModule>,
  ]);

  if (typeof secrets.SecretManager !== 'function' || !secrets.SECRET_KEYS) {
    throw new Error('SillyTavern secrets 模块不兼容');
  }
  if (!constants.OPENROUTER_HEADERS || typeof additionalHeaders.getOverrideHeaders !== 'function') {
    throw new Error('SillyTavern headers 模块不兼容');
  }

  const secretKey = (provider: ProviderDefinition): string => {
    const key = secrets.SECRET_KEYS[provider.secretKey];
    if (!key) throw new Error(`SillyTavern 缺少密钥类型 ${provider.secretKey}`);
    return key;
  };

  return {
    providers(directories) {
      const manager = new secrets.SecretManager(directories);
      const state = manager.getSecretState();
      return PROVIDERS.map(provider => ({
        id: provider.id,
        label: provider.label,
        baseUrl:
          provider.baseUrl.mode === 'fixed'
            ? { mode: 'fixed' as const }
            : { mode: 'custom' as const, placeholder: provider.baseUrl.placeholder },
        credentialRequired: provider.credentialRequired,
        credentials: credentialList(state, secretKey(provider)),
      }));
    },
    resolveConnection(directories, provider, credentialId, customBaseUrl) {
      const manager = new secrets.SecretManager(directories);
      const key = credentialId ? manager.readSecret(secretKey(provider), credentialId).trim() : '';
      const baseUrl = provider.baseUrl.mode === 'fixed' ? provider.baseUrl.value : (customBaseUrl ?? '').trim();
      const url = new URL(baseUrl);
      return {
        providerId: provider.id,
        baseUrl: url.toString().replace(/\/$/, ''),
        apiKey: key,
        headers: {
          ...(provider.id === 'openrouter' ? constants.OPENROUTER_HEADERS : {}),
          ...additionalHeaders.getOverrideHeaders(url.host),
        },
      };
    },
  };
}
