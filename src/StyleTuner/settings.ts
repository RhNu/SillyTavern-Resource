import { createLogger } from '@util/common';
import { readVariablesRecord, updateVariablesPath } from '@util/variables';
import { klona } from 'klona';
import { z } from 'zod';
import { SCRIPT_DISPLAY_NAME, STORE_KEY } from './constants';

const logger = createLogger(SCRIPT_DISPLAY_NAME);

const variableOption = {
  type: 'script',
  script_id: getScriptId(),
} as const;

/** 开关设置：样式条目 id → 是否启用（默认全部关闭） */
export const StyleTunerSettingsSchema = z.record(z.string(), z.boolean()).default({});

export type StyleTunerSettings = z.infer<typeof StyleTunerSettingsSchema>;

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** 从脚本变量加载开关设置 */
export function loadStyleTunerSettings(): StyleTunerSettings {
  const stored = readVariablesRecord(variableOption);
  const raw = isObjectLike(stored) ? stored[STORE_KEY] : undefined;
  const settings = StyleTunerSettingsSchema.parse(isObjectLike(raw) ? raw : {});
  logger.debug('已加载样式微调器设置。', settings);
  return settings;
}

/** 持久化开关设置到脚本变量 */
export function saveStyleTunerSettings(settings: StyleTunerSettings): void {
  updateVariablesPath(variableOption, STORE_KEY, settings);
  logger.debug('已保存样式微调器设置。', settings);
}

/** 切换某个样式条目的开关并持久化 */
export function setStyleTunerItemEnabled(itemId: string, enabled: boolean): void {
  const next = klona(loadStyleTunerSettings());
  next[itemId] = enabled;
  saveStyleTunerSettings(next);
}
