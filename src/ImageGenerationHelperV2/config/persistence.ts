import { readVariablesPath, updateVariablesPath } from '@util/variables';
import { normalizeConfig, type ScriptConfig } from '@/ImageGenerationHelperV2/config/schema';

const variableOption = {
  type: 'script',
  script_id: getScriptId(),
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function loadInitialConfig(): ScriptConfig {
  const scriptConfig = readVariablesPath(variableOption, 'config');
  return normalizeConfig(isRecord(scriptConfig) ? scriptConfig : {});
}

export function persistConfig(config: ScriptConfig) {
  updateVariablesPath(variableOption, 'config', config);
}
