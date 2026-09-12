import type { Logger } from '@util/core/logger';
import { slashCommand } from '@util/st/slash-command';

import { collectContextWorldbookNames } from './context';

type ConversionResult = {
  worldbookCount: number;
  updatedWorldbookCount: number;
  convertedEntryCount: number;
  failedWorldbookNames: string[];
};

async function convertContextWorldbooks(logger: Logger): Promise<ConversionResult> {
  const worldbookNames = collectContextWorldbookNames(logger);
  const result: ConversionResult = {
    worldbookCount: worldbookNames.length,
    updatedWorldbookCount: 0,
    convertedEntryCount: 0,
    failedWorldbookNames: [],
  };

  for (const worldbookName of worldbookNames) {
    try {
      const worldbook = await getWorldbook(worldbookName);
      let convertedInBook = 0;
      const nextWorldbook = worldbook.map(entry => {
        if (entry.strategy.type !== 'selective') {
          return entry;
        }

        convertedInBook += 1;
        return {
          ...entry,
          strategy: {
            ...entry.strategy,
            type: 'constant' as const,
          },
        };
      });

      if (convertedInBook === 0) {
        logger.debug(`No selective entries found in worldbook '${worldbookName}'.`, {
          entries: worldbook.length,
        });
        continue;
      }

      await replaceWorldbook(worldbookName, nextWorldbook, { render: 'debounced' });
      result.updatedWorldbookCount += 1;
      result.convertedEntryCount += convertedInBook;
      logger.info(`Converted ${convertedInBook} selective entrie(s) to constant in worldbook '${worldbookName}'.`);
    } catch (error) {
      result.failedWorldbookNames.push(worldbookName);
      logger.warn(`Failed to convert worldbook '${worldbookName}'.`, error);
    }
  }

  return result;
}

function buildConversionMessage(result: ConversionResult): string {
  const baseMessage =
    result.convertedEntryCount === 0
      ? `AllTheBook: 当前上下文 ${result.worldbookCount} 本世界书中没有绿灯条目。`
      : `AllTheBook: 已将 ${result.convertedEntryCount} 个绿灯条目永久改为蓝灯，涉及 ${result.updatedWorldbookCount}/${result.worldbookCount} 本上下文世界书。`;

  if (result.failedWorldbookNames.length === 0) {
    return baseMessage;
  }

  return `${baseMessage} ${result.failedWorldbookNames.length} 本世界书处理失败：${result.failedWorldbookNames.join(', ')}`;
}

export function registerAllTheBookCommand(logger: Logger, onConverted: () => void): void {
  slashCommand('all-the-book')
    .aliases('allthebook')
    .help('将当前上下文世界书里的所有绿灯条目永久改为蓝灯')
    .returns('转换结果摘要')
    .callback(async () => {
      logger.info('Slash command "all-the-book" started.');
      const result = await convertContextWorldbooks(logger);
      if (result.convertedEntryCount > 0) {
        onConverted();
      }

      const message = buildConversionMessage(result);
      logger.info(message);
      return message;
    })
    .register();

  logger.info('Slash command "all-the-book" registered.');
}
