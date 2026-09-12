import { createLogger } from '@util/core/logger';
import { SCRIPT_DISPLAY_NAME } from './constants';

const logger = createLogger(SCRIPT_DISPLAY_NAME);

export type NotifyLevel = 'success' | 'info' | 'warning' | 'error';

/** 通过 toastr 在酒馆页面弹出通知；toastr 不可用时降级为控制台日志 */
export function notify(level: NotifyLevel, message: string): void {
  if (typeof toastr !== 'undefined') {
    toastr[level](message, SCRIPT_DISPLAY_NAME);
    return;
  }

  if (level === 'error') {
    logger.error(message);
    return;
  }

  if (level === 'warning') {
    logger.warn(message);
    return;
  }

  logger.info(message);
}
