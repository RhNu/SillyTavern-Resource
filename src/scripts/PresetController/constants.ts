export const SCRIPT_DISPLAY_NAME = '通用预设控制器';
export const SCRIPT_ID = getScriptId();
export const ROOT_ELEMENT_ID = `preset-controller-${SCRIPT_ID}`;
export const STYLE_MARKER_ATTR = 'data-preset-controller-style';
export const STYLE_MARKER_VALUE = SCRIPT_ID;
export const VIEWPORT_PADDING = 8;
export const DEFAULT_PANEL_WIDTH = 360;
export const DEFAULT_PANEL_HEIGHT = 440;
export const CONFIG_VARIABLE_PATH = 'config';
export const UI_VARIABLE_PATH = 'ui';

export const variableOption = {
  type: 'script',
  script_id: SCRIPT_ID,
} as const;
