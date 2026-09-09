import { stripAnchors, type StoryParagraph } from '../domain/anchor';

function clean(text: string): string {
  return stripAnchors(text.replace(/<!--([\s\S]*?)-->/g, '').replace(/```[\s\S]*?```/g, '[CODE_BLOCK]')).trim();
}

export function buildHistory(messageId: number, count: number): string {
  if (count <= 0 || messageId <= 0) return '';
  const start = Math.max(0, messageId - count);
  return getChatMessages(`${start}-${messageId - 1}`)
    .map(
      message =>
        `${message.role === 'assistant' ? 'AI' : message.role === 'user' ? 'User' : 'System'}: ${clean(message.message)}`,
    )
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
        .filter(entry => entry.enabled && clean(entry.content))
        .map(entry => `## ${entry.name || entry.uid}\n${clean(entry.content)}`)
        .join('\n\n');
      if (content) sections.push(`# ${name}\n${content}`);
    } catch (error) {
      console.warn('[NovelAI Image Helper] 读取世界书失败', { name, error });
    }
  }
  return sections.join('\n\n');
}

export function paragraphTexts(paragraphs: StoryParagraph[]): string[] {
  return paragraphs.map(paragraph => clean(paragraph.text));
}
