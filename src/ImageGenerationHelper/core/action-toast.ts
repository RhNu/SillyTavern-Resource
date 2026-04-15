import { clearToast, showProgressToast } from './toast';

type ToastAction = {
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
};

type ActionToastRenderOptions = {
  ownerId: string;
  message: string;
  action?: ToastAction;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case '\'':
        return '&#39;';
      default:
        return char;
    }
  });
}

function buildToastMarkup(message: string, action?: ToastAction) {
  const buttonClassName = ['imggen-toast__button', action?.className?.trim()].filter(Boolean).join(' ');
  const actionMarkup = action
    ? `<div class="imggen-toast__actions">
        <button
          type="button"
          class="${escapeHtml(buttonClassName)}"
          data-imggen-toast-action="primary"
          ${action.disabled ? 'disabled' : ''}
        >
          ${escapeHtml(action.label)}
        </button>
      </div>`
    : '';

  return `<div class="imggen-toast__body">
    <div class="imggen-toast__message">${message}</div>
    ${actionMarkup}
  </div>`;
}

export class ActionToastSession {
  private toast?: JQuery;
  private ownerId?: string;
  private cleanup?: () => void;

  constructor(private readonly title: string) {}

  private updateExistingToast(options: ActionToastRenderOptions) {
    if (!this.toast?.length || !this.toast[0]?.isConnected) {
      return false;
    }

    this.toast.find('.toast-title').text(this.title);
    this.toast.find('.toast-message').html(buildToastMarkup(options.message, options.action));
    this.bindAction(this.toast, options.action);
    return true;
  }

  private bindAction(toast: JQuery, action?: ToastAction) {
    this.cleanup?.();
    this.cleanup = undefined;

    if (!action) {
      return;
    }

    const $button = toast.find('[data-imggen-toast-action="primary"]');
    const handleClick = (event: JQuery.ClickEvent) => {
      event.preventDefault();
      action.onClick();
    };
    const handleHidden = () => {
      this.cleanup?.();
      if (this.toast?.[0] === toast[0]) {
        this.toast = undefined;
        this.ownerId = undefined;
      }
    };

    $button.on('click.imggen-action-toast', handleClick);
    toast.one('hidden.toast', handleHidden);
    this.cleanup = () => {
      $button.off('click.imggen-action-toast', handleClick);
      toast.off('hidden.toast', handleHidden);
    };
  }

  show(options: ActionToastRenderOptions) {
    this.ownerId = options.ownerId;
    if (this.updateExistingToast(options)) {
      return this.toast;
    }

    this.toast = showProgressToast(buildToastMarkup(options.message, options.action), this.title, this.toast);
    if (this.toast) {
      this.bindAction(this.toast, options.action);
    }
    return this.toast;
  }

  clear(ownerId?: string) {
    if (ownerId && ownerId !== this.ownerId) {
      return false;
    }

    this.cleanup?.();
    this.cleanup = undefined;
    clearToast(this.toast, { force: true, immediate: true });
    this.toast = undefined;
    this.ownerId = undefined;
    return true;
  }

  isOwnedBy(ownerId: string) {
    return this.ownerId === ownerId;
  }

  dispose() {
    this.clear();
  }
}
