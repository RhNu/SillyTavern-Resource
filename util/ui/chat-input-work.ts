import { getHostDomContext } from '../st/dom/host';

const STYLE_ID = 'util-chat-input-work-style';
const ACTIVE_CLASS = 'util-chat-input-work-active';
const PAUSED_CLASS = 'util-chat-input-work-paused';
const CANCELLING_CLASS = 'util-chat-input-work-cancelling';
const INDETERMINATE_CLASS = 'util-chat-input-work-indeterminate';

export type ChatInputWorkState = 'running' | 'paused' | 'cancelling';

export type ChatInputWorkOptions = {
  /** 0 到 100；省略时显示不定进度。 */
  progress?: number;
  /** 总进度已知但当前步骤无法量化时，让现有进度条保持活动提示。 */
  indeterminate?: boolean;
  state?: ChatInputWorkState;
  onPause?: () => void | Promise<void>;
  onResume?: () => void | Promise<void>;
  onStop?: () => void | Promise<void>;
};

export type ChatInputWorkSession = {
  readonly active: boolean;
  update(options: ChatInputWorkOptions): void;
  destroy(): void;
};

const STYLE = `
#form_sheld.${ACTIVE_CLASS} #send_but,
#form_sheld.${ACTIVE_CLASS} #mes_continue,
#form_sheld.${ACTIVE_CLASS} #mes_impersonate {
  visibility: hidden !important;
  width: 0 !important;
  height: 0 !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

#form_sheld.${ACTIVE_CLASS} #rightSendForm > .stscript_btn {
  display: none;
}

#form_sheld.${ACTIVE_CLASS}:not(.${CANCELLING_CLASS}):has(#stscript_stop[data-util-chat-input-work-stoppable='true']) #stscript_stop,
#form_sheld.${ACTIVE_CLASS}:not(.${PAUSED_CLASS}):has(#stscript_pause[data-util-chat-input-work-pausable='true']) #stscript_pause,
#form_sheld.${ACTIVE_CLASS}.${PAUSED_CLASS}:has(#stscript_continue[data-util-chat-input-work-pausable='true']) #stscript_continue {
  display: flex;
}

#form_sheld.${ACTIVE_CLASS}.${CANCELLING_CLASS} #send_textarea,
#form_sheld.${ACTIVE_CLASS}.${PAUSED_CLASS} #send_textarea,
#form_sheld.${ACTIVE_CLASS}.${INDETERMINATE_CLASS} #send_textarea {
  animation: util-chat-input-work-pulse 1.5s ease-in-out infinite;
}

#form_sheld.${ACTIVE_CLASS}.${CANCELLING_CLASS} #send_textarea {
  border-top-color: var(--progAbortedColor, rgb(215, 136, 114));
}

@keyframes util-chat-input-work-pulse {
  50% { border-top-color: var(--progFlashColor, rgb(215, 136, 114)); }
}
`;

function clampProgress(progress: number | undefined): number | undefined {
  return progress === undefined || !Number.isFinite(progress) ? undefined : Math.min(100, Math.max(0, progress));
}

function invoke(action: (() => void | Promise<void>) | undefined): void {
  if (!action) return;
  void Promise.resolve()
    .then(action)
    .catch(error => console.error('[chat-input-work] 输入栏工作动作执行失败', error));
}

/**
 * 使用 SillyTavern 原生 STScript 按钮和输入框进度样式占用聊天输入栏。
 *
 * 这是对宿主 DOM 的兼容层，不会启动 slash command；调用方必须在工作结束时 destroy。
 * 如果原生 STScript 正在从输入框执行，本会话会暂时让出按钮，避免劫持原生命令控制器。
 */
export function showChatInputWork(initialOptions: ChatInputWorkOptions = {}): ChatInputWorkSession {
  const { doc, win } = getHostDomContext();
  const form = doc.querySelector<HTMLElement>('#form_sheld');
  const textarea = doc.querySelector<HTMLTextAreaElement>('#send_textarea');
  const pauseButton = doc.querySelector<HTMLElement>('#stscript_pause');
  const continueButton = doc.querySelector<HTMLElement>('#stscript_continue');
  const stopButton = doc.querySelector<HTMLElement>('#stscript_stop');
  if (!form || !textarea || !pauseButton || !continueButton || !stopButton) {
    throw new Error('SillyTavern chat input work UI is unavailable.');
  }

  let style = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
  const ownsStyle = !style;
  if (!style) {
    style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = STYLE;
    (doc.head ?? doc.documentElement).append(style);
  }

  let options = { state: 'running' as const, ...initialOptions } as ChatInputWorkOptions & {
    state: ChatInputWorkState;
  };
  let active = true;
  let suspendedForNativeCommands = form.classList.contains('isExecutingCommandsFromChatInput');
  let nativeProgressCleanupTimer: number | undefined;
  const previousAriaBusy = form.getAttribute('aria-busy');

  const apply = (): void => {
    const enabled = active && !suspendedForNativeCommands;
    form.classList.toggle(ACTIVE_CLASS, enabled);
    form.classList.toggle(PAUSED_CLASS, enabled && options.state === 'paused');
    form.classList.toggle(CANCELLING_CLASS, enabled && options.state === 'cancelling');
    const progress = clampProgress(options.progress);
    const indeterminate = options.indeterminate || progress === undefined;
    form.classList.toggle(INDETERMINATE_CLASS, enabled && indeterminate);
    pauseButton.dataset.utilChatInputWorkPausable = String(enabled && Boolean(options.onPause));
    continueButton.dataset.utilChatInputWorkPausable = String(enabled && Boolean(options.onResume));
    stopButton.dataset.utilChatInputWorkStoppable = String(enabled && Boolean(options.onStop));
    if (!enabled) return;

    form.setAttribute('aria-busy', 'true');
    textarea.style.setProperty('--progDone', '0');
    // 队列可能只知道“完成了几张”，单张图片执行期间会一直是 0%；保留最小宽度才能看见活动提示。
    const keepVisible = indeterminate || options.state !== 'running';
    textarea.style.setProperty('--prog', `${keepVisible ? Math.max(progress ?? 0, 12) : progress}%`);
  };

  const onButtonClick = (event: Event): void => {
    if (!active || suspendedForNativeCommands) return;
    const target = event.currentTarget;
    const action =
      target === pauseButton ? options.onPause : target === continueButton ? options.onResume : options.onStop;
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    invoke(action);
  };

  const onTextareaKeydown = (event: KeyboardEvent): void => {
    if (!active || suspendedForNativeCommands || event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  pauseButton.addEventListener('click', onButtonClick, true);
  continueButton.addEventListener('click', onButtonClick, true);
  stopButton.addEventListener('click', onButtonClick, true);
  textarea.addEventListener('keydown', onTextareaKeydown, true);

  const HostMutationObserver = (win as unknown as typeof globalThis).MutationObserver;
  const nativeCommandObserver = new HostMutationObserver(() => {
    const next = form.classList.contains('isExecutingCommandsFromChatInput');
    if (next === suspendedForNativeCommands) return;
    suspendedForNativeCommands = next;
    apply();
    // 原版会在命令结束约 1 秒后清空同一组进度变量；清理完成后恢复后台工作的进度。
    if (!next) {
      if (nativeProgressCleanupTimer !== undefined) win.clearTimeout(nativeProgressCleanupTimer);
      nativeProgressCleanupTimer = win.setTimeout(() => {
        nativeProgressCleanupTimer = undefined;
        if (active && !form.classList.contains('isExecutingCommandsFromChatInput')) apply();
      }, 1_400);
    }
  });
  nativeCommandObserver.observe(form, { attributes: true, attributeFilter: ['class'] });
  apply();

  return {
    get active() {
      return active;
    },
    update(nextOptions) {
      if (!active) return;
      options = { state: 'running', ...nextOptions };
      apply();
    },
    destroy() {
      if (!active) return;
      active = false;
      nativeCommandObserver.disconnect();
      if (nativeProgressCleanupTimer !== undefined) win.clearTimeout(nativeProgressCleanupTimer);
      pauseButton.removeEventListener('click', onButtonClick, true);
      continueButton.removeEventListener('click', onButtonClick, true);
      stopButton.removeEventListener('click', onButtonClick, true);
      textarea.removeEventListener('keydown', onTextareaKeydown, true);
      delete pauseButton.dataset.utilChatInputWorkPausable;
      delete continueButton.dataset.utilChatInputWorkPausable;
      delete stopButton.dataset.utilChatInputWorkStoppable;
      form.classList.remove(ACTIVE_CLASS, PAUSED_CLASS, CANCELLING_CLASS, INDETERMINATE_CLASS);
      if (previousAriaBusy === null) form.removeAttribute('aria-busy');
      else form.setAttribute('aria-busy', previousAriaBusy);

      if (!form.classList.contains('isExecutingCommandsFromChatInput')) {
        textarea.style.setProperty('--progDone', '1');
        win.setTimeout(() => {
          if (form.classList.contains(ACTIVE_CLASS) || form.classList.contains('isExecutingCommandsFromChatInput'))
            return;
          textarea.style.removeProperty('--prog');
          textarea.style.removeProperty('--progDone');
        }, 250);
      }
      if (ownsStyle) style?.remove();
    },
  };
}
