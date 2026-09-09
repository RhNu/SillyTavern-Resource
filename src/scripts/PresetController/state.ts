import { z } from 'zod';
import { type ControllerConfig } from './schema';

export const PositionPercentSchema = z
  .object({
    xPercent: z.number().describe('悬浮窗 X 坐标的百分比位置 (0~1)'),
    yPercent: z.number().describe('悬浮窗 Y 坐标的百分比位置 (0~1)'),
  })
  .describe('悬浮窗位置。');

export const UiStateSchema = z
  .object({
    collapsed: z.boolean().default(true),
    autoApply: z.boolean().default(true),
    position: PositionPercentSchema.optional(),
    groupCollapsed: z.record(z.string(), z.boolean()).default({}),
    importFormat: z.enum(['auto', 'json', 'yaml']).default('auto'),
  })
  .prefault({});

export const ImportFormatSchema = z.enum(['auto', 'json', 'yaml']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export type PositionPercent = z.infer<typeof PositionPercentSchema>;
export type UiState = z.infer<typeof UiStateSchema>;
export type ImportFormat = z.infer<typeof ImportFormatSchema>;
export type StatusLevel = 'idle' | 'working' | 'success' | 'warning' | 'error';

export type ControllerState = {
  config: ControllerConfig;
  ui: UiState;
  dirty: boolean;
  applying: boolean;
  statusLevel: StatusLevel;
  statusText: string;
};

export function normalizeUiState(raw: unknown): UiState {
  return UiStateSchema.parse(isRecord(raw) ? raw : {});
}
