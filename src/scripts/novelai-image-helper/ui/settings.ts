import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createLogger } from '../app/logger';
import type { NovelAiImageService } from '../app/service';
import SettingsPanel from './SettingsPanel';

let closeActivePopup: (() => void) | undefined;
const logger = createLogger('ui/settings');

export function openSettings(service: NovelAiImageService): void {
  closeActivePopup?.();

  const $host = $('<div class="nai-settings-host">');
  const root = createRoot($host[0]);
  const popup = new SillyTavern.Popup($host[0], SillyTavern.POPUP_TYPE.DISPLAY, '', {
    wide: true,
    wider: true,
    large: true,
    allowVerticalScrolling: true,
    okButton: false,
    cancelButton: false,
  });
  let closed = false;

  const close = () => {
    if (!closed) {
      void Promise.resolve(popup.completeCancelled()).catch(error => logger.error('关闭设置弹窗失败', error));
    }
  };
  closeActivePopup = close;
  root.render(createElement(SettingsPanel, { service }));

  void popup
    .show()
    .catch(error => logger.error('设置弹窗异常结束', error))
    .finally(() => {
      closed = true;
      try {
        service.settings.flush();
      } catch (error) {
        logger.error('设置弹窗关闭时刷新设置失败', error);
      }
      if (closeActivePopup === close) closeActivePopup = undefined;
      try {
        root.unmount();
        $host.remove();
      } catch (error) {
        logger.error('销毁设置弹窗界面失败', error);
      }
    });
}
