import type { StoryParagraph } from '../domain/anchor';
import { createLogger, serializeError } from '../app/logger';
import { cleanContextText, type ContextCleanupSettings } from './context-cleaner';

const NO_CONTEXT_CLEANUP: ContextCleanupSettings = { extractRules: [], filterRules: [] };
const logger = createLogger('prompt-analysis/context');

export function buildHistory(
  messageId: number,
  count: number,
  cleanup: ContextCleanupSettings = NO_CONTEXT_CLEANUP,
): string {
  if (count <= 0 || messageId <= 0) return '';
  try {
    const start = Math.max(0, messageId - count);
    const history = getChatMessages(`${start}-${messageId - 1}`)
      .map(message => {
        const cleaned = cleanContextText(message.message, cleanup).text;
        if (!cleaned) return '';
        return `${message.role === 'assistant' ? 'AI' : message.role === 'user' ? 'User' : 'System'}: ${cleaned}`;
      })
      .filter(Boolean)
      .join('\n\n');
    logger.debug('历史上下文构建完成', {
      messageId,
      requestedCount: count,
      start,
      length: history.length,
    });
    return history;
  } catch (error) {
    logger.error('构建历史上下文失败', error, { messageId, count });
    throw error;
  }
}

export async function buildWorldbook(): Promise<string> {
  try {
    const characterBooks = getCharWorldbookNames('current');
    const names = new Set(
      [characterBooks.primary, ...characterBooks.additional, getChatWorldbookName('current')].filter(
        (name): name is string => Boolean(name),
      ),
    );
    const sections: string[] = [];
    let loadedCount = 0;
    for (const name of names) {
      try {
        const entries = await getWorldbook(name);
        const content = entries
          // Worldbook text is intentionally opaque here. Cleanup rules belong only to story context.
          .filter(entry => entry.enabled)
          .map(entry => `## ${entry.name || entry.uid}\n${entry.content}`)
          .join('\n\n');
        if (content) sections.push(`# ${name}\n${content}`);
        loadedCount += 1;
        logger.debug('世界书读取完成', { name, entryCount: entries.length, contentLength: content.length });
      } catch (error) {
        logger.warn('读取世界书失败，继续分析其余上下文', { name, error: serializeError(error) });
      }
    }
    const worldbook = sections.join('\n\n');
    logger.info('世界书上下文构建完成', {
      requestedCount: names.size,
      loadedCount,
      sectionCount: sections.length,
      length: worldbook.length,
    });
    return worldbook;
  } catch (error) {
    logger.error('构建世界书上下文失败', error);
    throw error;
  }
}

export function paragraphTexts(paragraphs: StoryParagraph[]): string[] {
  return paragraphs.map(paragraph => paragraph.text);
}
