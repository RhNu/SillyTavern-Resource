import { createLogger } from '@util/core/logger';
import { extensionMenuItem } from '@util/ui/extension-menu/builder';
import { teleportStyle } from '@util/tavern-helper/script/styles';
import { getHostDomContext } from '@util/st/dom/host';
import { insertNotebookTextIntoChat } from './chat-input';
import { copyNotebookContent } from './clipboard';
import { registerNotebookCommands } from './commands';
import { mountNotebookPanel } from './panel';
import { createNotebookRepository } from './repository';
import type { NotebookContext } from './contracts';

const logger = createLogger('Notebook');

function nonEmpty(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized && normalized !== '-1' && normalized !== 'null' ? normalized : null;
}

/** 脚本变量按稳定身份键分区；群聊不提供角色卡空间。 */
function getNotebookContext(): NotebookContext {
  const characterId = nonEmpty(getCurrentCharacterId());
  const groupId = nonEmpty(SillyTavern.groupId);
  return {
    characterId: groupId ? null : characterId,
    groupId,
    chatId: nonEmpty(SillyTavern.getCurrentChatId()),
  };
}

function init(): void {
  const repository = createNotebookRepository();
  const styles = teleportStyle();
  const panel = mountNotebookPanel({
    repository,
    context: getNotebookContext(),
    onInsert(text: string) {
      try {
        insertNotebookTextIntoChat(text);
        toastr.success('已插入酒馆输入框。', 'Notebook');
      } catch (error) {
        logger.error('插入输入框失败', error);
        toastr.error(error instanceof Error ? error.message : '插入输入框失败。', 'Notebook');
      }
    },
    async onCopy(text: string, html?: string) {
      try {
        await copyNotebookContent(text, html);
      } catch (error) {
        logger.error('复制失败', error);
        throw error;
      }
    },
  });

  const menu = extensionMenuItem('resourceNotebookButton')
    .containerId('resourceNotebookContainer')
    .title('Notebook')
    .label('打开 Notebook')
    .icon('fa-solid fa-clipboard')
    .onClick(() => panel.toggle())
    .mount();

  let unregisterCommands: (() => void) | undefined;
  try {
    unregisterCommands = registerNotebookCommands({ repository, panel, getContext: getNotebookContext });
  } catch (error) {
    logger.error('注册斜杠命令失败', error);
    toastr.warning('Notebook 命令注册失败，请查看控制台。', 'Notebook');
  }

  const chatChanged = eventOn(tavern_events.CHAT_CHANGED, () => {
    try {
      repository.flush();
      panel.setContext(getNotebookContext());
      logger.info('聊天已切换，刷新笔记空间。');
    } catch (error) {
      logger.error('聊天切换时保存或刷新笔记失败', error);
      toastr.error('切换聊天时保存笔记失败，请查看控制台。', 'Notebook');
    }
  });

  const { win } = getHostDomContext();
  const hostPageHide = () => repository.flush();
  win.addEventListener('pagehide', hostPageHide);

  let destroyed = false;
  $(window).on('pagehide', () => {
    if (destroyed) return;
    destroyed = true;
    logger.info('卸载 Notebook。');
    win.removeEventListener('pagehide', hostPageHide);
    chatChanged.stop();
    unregisterCommands?.();
    panel.destroy();
    menu.destroy();
    styles.destroy();
    repository.destroy();
  });

  logger.info('Notebook 已加载；数据保存在当前脚本变量。');
}

$(() => {
  errorCatched(init)();
});
