import { slashCommand, slashCommandArgumentTypes } from '@util/st/slash-command';
import { createLogger } from '@util/core/logger';
import { resolveNotebookScopeKey } from './domain';
import type {
  NotebookContext,
  NotebookNote,
  NotebookPanelSession,
  NotebookRepository,
  NotebookScope,
} from './contracts';

const logger = createLogger('Notebook');

type CommandDependencies = {
  repository: NotebookRepository;
  panel: NotebookPanelSession;
  getContext: () => NotebookContext;
};

function resolveScope(input: unknown, context: NotebookContext): { scope: NotebookScope; key: string } {
  const scope = String(input ?? 'global')
    .trim()
    .toLowerCase();
  if (scope !== 'global' && scope !== 'character' && scope !== 'chat') {
    throw new Error('scope 必须是 global、character 或 chat。');
  }
  const key = resolveNotebookScopeKey(scope, context);
  if (!key) throw new Error(`当前没有可用的 ${scope} 笔记空间。`);
  return { scope, key };
}

function resolveNote(repository: NotebookRepository, scopeKey: string, reference: string): NotebookNote {
  const notes = repository.list(scopeKey);
  const byId = notes.find(note => note.id === reference);
  if (byId) return byId;

  const matches = notes.filter(note => note.title.localeCompare(reference, undefined, { sensitivity: 'accent' }) === 0);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) throw new Error(`找到 ${matches.length} 篇同名笔记，请改用笔记 ID。`);
  throw new Error(`找不到笔记：${reference}`);
}

function commandResult(action: string, callback: () => string): string {
  try {
    const message = callback();
    logger.info(action, message);
    return message;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`${action}失败`, error);
    toastr.error(message, 'Notebook');
    return `Notebook：${message}`;
  }
}

type RegisteredCommand = { names: string[]; command: unknown };

function registeredCommands(): Record<string, unknown> {
  return SillyTavern.SlashCommandParser.commands as Record<string, unknown>;
}

/** 注册面板及笔记管理命令；卸载时只移除本脚本仍持有的注册项。 */
export function registerNotebookCommands({ repository, panel, getContext }: CommandDependencies): () => void {
  const owned: RegisteredCommand[] = [];
  const track = (name: string, command: unknown, aliases: string[] = []) => {
    owned.push({ names: [name, ...aliases], command });
  };
  const cleanup = () => {
    const current = registeredCommands();
    for (const { names, command } of owned) {
      for (const name of names) {
        if (current[name] === command) delete current[name];
      }
    }
    logger.info('Notebook 斜杠命令已卸载。');
  };

  try {
    track(
      'notebook-create',
      slashCommand('notebook-create')
        .help('在指定空间创建笔记。示例：/notebook-create scope=chat 剧情线索')
        .named('scope', 'global、character 或 chat', slashCommandArgumentTypes.string, { defaultValue: 'global' })
        .unnamed('笔记标题', slashCommandArgumentTypes.string)
        .callback(({ named, unnamed }) =>
          commandResult('创建笔记', () => {
            const { scope, key } = resolveScope(named.scope, getContext());
            const title = String(unnamed[0] ?? '').trim() || 'Untitled';
            const note = repository.create(key, title);
            panel.selectScope(scope);
            panel.open(note.id);
            return `已创建「${note.title}」（ID：${note.id}）。`;
          }),
        )
        .register(),
    );

    track(
      'notebook-open',
      slashCommand('notebook-open')
        .help('按 ID 或完整标题打开笔记。示例：/notebook-open scope=chat 剧情线索')
        .named('scope', 'global、character 或 chat', slashCommandArgumentTypes.string, { defaultValue: 'global' })
        .unnamed('笔记 ID 或完整标题', slashCommandArgumentTypes.string, { isRequired: true })
        .callback(({ named, unnamed }) =>
          commandResult('打开笔记', () => {
            const { scope, key } = resolveScope(named.scope, getContext());
            const note = resolveNote(repository, key, String(unnamed[0] ?? '').trim());
            panel.selectScope(scope);
            panel.open(note.id);
            return `已打开「${note.title}」。`;
          }),
        )
        .register(),
    );

    track(
      'notebook-delete',
      slashCommand('notebook-delete')
        .help('按 ID 或完整标题删除笔记。示例：/notebook-delete scope=chat 剧情线索')
        .named('scope', 'global、character 或 chat', slashCommandArgumentTypes.string, { defaultValue: 'global' })
        .unnamed('笔记 ID 或完整标题', slashCommandArgumentTypes.string, { isRequired: true })
        .callback(({ named, unnamed }) =>
          commandResult('删除笔记', () => {
            const { key } = resolveScope(named.scope, getContext());
            const note = resolveNote(repository, key, String(unnamed[0] ?? '').trim());
            repository.remove(key, note.id);
            return `已删除「${note.title}」。`;
          }),
        )
        .register(),
    );

    const commands = registeredCommands();
    if (!Object.hasOwn(commands, 'notebook') && !Object.hasOwn(commands, 'nb')) {
      track(
        'notebook',
        slashCommand('notebook')
          .aliases('nb')
          .help('切换 Notebook 面板。')
          .callback(() =>
            commandResult('切换面板', () => {
              panel.toggle();
              return 'Notebook 面板已切换。';
            }),
          )
          .register(),
        ['nb'],
      );
      logger.info('斜杠命令已注册', ['notebook', 'notebook-create', 'notebook-open', 'notebook-delete']);
    } else {
      logger.warn('原版 Notebook 命令名被占用，改用 resource-notebook。');
      track(
        'resource-notebook',
        slashCommand('resource-notebook')
          .aliases('rnb')
          .help('切换当前脚本的 Notebook 面板。')
          .callback(() =>
            commandResult('切换面板', () => {
              panel.toggle();
              return 'Notebook 面板已切换。';
            }),
          )
          .register(),
        ['rnb'],
      );
    }
  } catch (error) {
    cleanup();
    throw error;
  }
  return cleanup;
}
