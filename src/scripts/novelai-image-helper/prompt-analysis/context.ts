import type { StoryParagraph } from '../domain/anchor';
import { cleanContextText, type ContextCleanupSettings } from './context-cleaner';

const NO_CONTEXT_CLEANUP: ContextCleanupSettings = { extractRules: [], filterRules: [] };

export function buildHistory(
  messageId: number,
  count: number,
  cleanup: ContextCleanupSettings = NO_CONTEXT_CLEANUP,
): string {
  if (count <= 0 || messageId <= 0) return '';
  const start = Math.max(0, messageId - count);
  return getChatMessages(`${start}-${messageId - 1}`)
    .map(message => {
      const cleaned = cleanContextText(message.message, cleanup).text;
      if (!cleaned) return '';
      return `${message.role === 'assistant' ? 'AI' : message.role === 'user' ? 'User' : 'System'}: ${cleaned}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

export async function buildWorldbook(): Promise<string> {
  const characterBooks = getCharWorldbookNames('current');
  const names = new Set(
    [characterBooks.primary, ...characterBooks.additional, getChatWorldbookName('current')].filter(
      (name): name is string => Boolean(name),
    ),
  );
  const sections: string[] = [];
  for (const name of names) {
    try {
      const entries = await getWorldbook(name);
      const content = entries
        // Worldbook text is intentionally opaque here. Cleanup rules belong only to story context.
        .filter(entry => entry.enabled)
        .map(entry => `## ${entry.name || entry.uid}\n${entry.content}`)
        .join('\n\n');
      if (content) sections.push(`# ${name}\n${content}`);
    } catch (error) {
      console.warn('[NovelAI Image Helper] 读取世界书失败', { name, error });
    }
  }
  return sections.join('\n\n');
}

export function paragraphTexts(paragraphs: StoryParagraph[]): string[] {
  return paragraphs.map(paragraph => paragraph.text);
}
