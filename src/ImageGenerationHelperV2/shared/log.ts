import { SCRIPT_DISPLAY_NAME } from '@/ImageGenerationHelperV2/app/ids';

const SCRIPT_LOG_PREFIX = `[脚本_${SCRIPT_DISPLAY_NAME}]`;

function formatLogMessage(message: string): string {
  return `${SCRIPT_LOG_PREFIX} ${message}`;
}

export function logInfo(message: string, ...args: unknown[]) {
  console.info(formatLogMessage(message), ...args);
}

export function logWarn(message: string, ...args: unknown[]) {
  console.warn(formatLogMessage(message), ...args);
}

export function logError(message: string, ...args: unknown[]) {
  console.error(formatLogMessage(message), ...args);
}
