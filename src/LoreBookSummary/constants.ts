import type { WorldbookSource } from './types';

export const BUTTON_CONTAINER_ID = 'worldbook_stats_container';
export const BUTTON_ID = 'worldbook_stats_button';
export const POPUP_CONTENT_ID = 'worldbook_stats_popup';

export const sourceLabels: Record<WorldbookSource, string> = {
  primary: '主卡',
  additional: '附加',
  global: '全局',
  chat: '聊天',
};
