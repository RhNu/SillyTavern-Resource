import { createLogger } from '../app/logger';

const logger = createLogger('ui/prompt-preset-dialog');

/** Open the naming dialog used by prompt-preset "Save as" actions. */
export async function requestPromptPresetName(): Promise<string | undefined> {
  if (typeof SillyTavern?.callGenericPopup !== 'function' || typeof SillyTavern?.POPUP_TYPE === 'undefined') {
    logger.warn('打开提示词预设命名弹窗失败：宿主接口不可用');
    throw new Error('命名弹窗接口不可用，请检查酒馆版本');
  }

  try {
    const result = await SillyTavern.callGenericPopup(
      $('<div>').text('请输入新的图像提示词预设名称'),
      SillyTavern.POPUP_TYPE.INPUT,
      '',
      { okButton: '保存', cancelButton: '取消' },
    );
    logger.debug('提示词预设命名弹窗已关闭', { confirmed: typeof result === 'string' });
    return typeof result === 'string' ? result : undefined;
  } catch (error) {
    logger.error('提示词预设命名弹窗异常', error);
    throw error;
  }
}
