import { createLogger } from '../../app/logger';
import { RequestError } from '../request-error';

const CHAT_BACKGROUNDS_KEY = 'chat_backgrounds';
const logger = createLogger('platform/tavern/chat-background-registry');

/**
 * 将已提交到图片块的输出投影到 SillyTavern 标准聊天背景列表。
 * blocks[].outputs[].url 是事实来源；这里不读取背景列表来反向修改图片块。
 */
export async function registerGeneratedChatBackground(imagePath: string, signal?: AbortSignal): Promise<void> {
  const path = imagePath.trim();
  if (!path) {
    throw new RequestError('无法登记空的图片路径', { code: 'ASSOCIATION_FAILED' });
  }

  try {
    signal?.throwIfAborted();
    const current = SillyTavern.chatMetadata?.[CHAT_BACKGROUNDS_KEY];
    const backgrounds: unknown[] = Array.isArray(current) ? current : [];
    if (!backgrounds.includes(path)) {
      SillyTavern.updateChatMetadata({ [CHAT_BACKGROUNDS_KEY]: [...backgrounds, path] }, false);
    }

    // 即使重试时内存列表已经包含路径，也必须再次保存：上一次可能在持久化时失败。
    await SillyTavern.saveMetadata();
    signal?.throwIfAborted();
    logger.info('生成图片已登记为聊天背景', { imagePath: path });
  } catch (error) {
    if (signal?.aborted) throw error;
    logger.error('登记聊天背景失败', error, { imagePath: path });
    throw new RequestError('图片已写入楼层，但登记到 SillyTavern 聊天背景失败', {
      code: 'ASSOCIATION_FAILED',
    });
  }
}
