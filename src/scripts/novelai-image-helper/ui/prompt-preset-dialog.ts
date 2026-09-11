import { inputPopup } from '@util/st/ui/popup/shortcuts';
import { createLogger } from '../app/logger';

const logger = createLogger('ui/prompt-preset-dialog');

/** Open the naming dialog used by prompt-preset "Save as" actions. */
export async function requestPromptPresetName(): Promise<string | undefined> {
  try {
    const result = await inputPopup({
      content: '请输入新的图像提示词预设名称',
      defaultValue: '',
      okLabel: '保存',
      cancelLabel: '取消',
    });
    logger.debug('提示词预设命名弹窗已关闭', { confirmed: result !== null });
    return result ?? undefined;
  } catch (error) {
    logger.error('提示词预设命名弹窗异常', error);
    throw error;
  }
}
