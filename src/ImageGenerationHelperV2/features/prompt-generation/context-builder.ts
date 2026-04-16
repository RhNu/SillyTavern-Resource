import { createChatGateway } from '@/ImageGenerationHelperV2/adapters/tavern/chat-gateway';
import { getImageGenerationStore } from '@/ImageGenerationHelperV2/config/store';
import { BUILTIN_PROMPT_GENERATION_MESSAGES, type MessageEntry } from '@/ImageGenerationHelperV2/config/defaults';
import { applyExtractTags, applyFilterTags, stripXmlComments } from '@/ImageGenerationHelperV2/shared/text';
import {
  PROMPT_GENERATION_HISTORY_CONTEXT_TOKEN,
  PROMPT_GENERATION_LATEST_STORY_TOKEN,
  PROMPT_GENERATION_PROMPT_TEMPLATE_TOKEN,
  PROMPT_GENERATION_WORLDBOOK_CONTEXT_TOKEN,
  replacePromptToken,
} from '@/ImageGenerationHelperV2/features/prompt-generation/placeholders';
import { buildResolvedPromptTemplate } from '@/ImageGenerationHelperV2/features/prompt-generation/template-resolver';

const chatGateway = createChatGateway();

export function sanitizeContextText(rawText: string): string {
  return stripXmlComments(rawText);
}

export function collectParagraphs(rawText: string): string[] {
  const store = getImageGenerationStore();
  const minParagraphLength = store.config.independentApi.paragraphMinLength;
  const filtered = applyFilterTags(
    applyExtractTags(sanitizeContextText(rawText), store.config.independentApi.extractTags),
    store.config.independentApi.filterTags,
  )
    .replace(/```[\s\S]*?```/g, '[CODE_BLOCK]')
    .replace(/<code[\s\S]*?<\/code>/gi, '[CODE_BLOCK]')
    .trim();

  let paragraphs = filtered.split(/\n\n+/);
  if (paragraphs.length <= 2 && filtered.length > 300) {
    const singleLineParagraphs = filtered.split(/\n/);
    if (singleLineParagraphs.length > paragraphs.length) {
      paragraphs = singleLineParagraphs;
    }
  }

  return paragraphs
    .map(item => item.trim())
    .filter(item => item !== '[CODE_BLOCK]' && item.length >= minParagraphLength);
}

export function formatParagraphsForPrompt(paragraphs: string[]): string {
  return paragraphs.map((paragraph, index) => `[P${index + 1}] ${paragraph}`).join('\n\n');
}

export function buildHistoryContext(messageId: number, count: number): string {
  const start = Math.max(0, messageId - count);
  const history = chatGateway.getMessages(`${start}-${Math.max(start, messageId - 1)}`);
  return history
    .map(message => {
      const cleanedMessage = sanitizeContextText(message.message);
      const roleName = message.role === 'assistant' ? 'AI' : message.role === 'user' ? '用户' : '系统';
      return `${roleName}: ${cleanedMessage}`;
    })
    .join('\n\n');
}

export async function buildWorldbookContext(): Promise<string> {
  const worldbookNames = new Set<string>();
  const charWorldbooks = chatGateway.getCharacterWorldbookNames();
  const chatWorldbook = chatGateway.getChatWorldbookName();

  [charWorldbooks.primary, ...charWorldbooks.additional, chatWorldbook].filter(Boolean).forEach(worldbookName => {
    worldbookNames.add(worldbookName!);
  });

  const sections: string[] = [];

  for (const worldbookName of worldbookNames) {
    const entries = await chatGateway.getWorldbook(worldbookName);
    const enabledEntries = entries
      .filter(entry => entry.enabled)
      .map(entry => ({ entry, content: stripXmlComments(entry.content).trim() }))
      .filter(item => item.content);
    if (enabledEntries.length === 0) {
      continue;
    }

    const content = enabledEntries
      .map(({ entry, content: sanitizedContent }) => {
        const title = entry.name || `条目 ${entry.uid}`;
        return `【${title}】\n${sanitizedContent}`;
      })
      .join('\n\n');

    sections.push(`### ${worldbookName}\n${content}`);
  }

  return sections.join('\n\n');
}

export function buildPromptGenerationMessages(
  latestParagraphs: string,
  historyContext: string,
  worldbookContext: string,
): MessageEntry[] {
  const templateText = buildResolvedPromptTemplate();

  return BUILTIN_PROMPT_GENERATION_MESSAGES.map(message => {
    if (typeof message === 'string') {
      return message;
    }
    let content = message.content;
    content = replacePromptToken(content, PROMPT_GENERATION_HISTORY_CONTEXT_TOKEN, historyContext);
    content = replacePromptToken(content, PROMPT_GENERATION_WORLDBOOK_CONTEXT_TOKEN, worldbookContext);
    content = replacePromptToken(content, PROMPT_GENERATION_PROMPT_TEMPLATE_TOKEN, templateText);
    content = replacePromptToken(content, PROMPT_GENERATION_LATEST_STORY_TOKEN, latestParagraphs);
    return {
      role: message.role,
      content,
    };
  });
}
