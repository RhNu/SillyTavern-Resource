import { klona } from 'klona';
import { createMessageVariableGateway } from '@/ImageGenerationHelperV2/adapters/tavern/message-variable-gateway';
import { normalizeConfig, type ScriptConfig } from '@/ImageGenerationHelperV2/config/schema';

const messageVariableGateway = createMessageVariableGateway();

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function loadInitialConfig(): ScriptConfig {
  const scriptVariables = messageVariableGateway.readScriptVariables();
  const scriptConfig = isRecord(scriptVariables.config) ? scriptVariables.config : undefined;
  return normalizeConfig(scriptConfig ?? {});
}

export function persistConfig(config: ScriptConfig) {
  messageVariableGateway.writeScriptVariables({ config: klona(config) });
}
