type ToastMethod = 'info' | 'success' | 'warning' | 'error';
type ToastOptions = {
  timeOut?: number;
  extendedTimeOut?: number;
  closeButton?: boolean;
  progressBar?: boolean;
  tapToDismiss?: boolean;
  escapeHtml?: boolean;
};

type ClearToastOptions = {
  force?: boolean;
  immediate?: boolean;
};

const TOAST_STYLE_ID = `${getScriptId()}-imggen-toast-style`;
const BASE_TOAST_CLASS = 'imggen-toast';

const TOAST_STYLE_CONTENT = `
.toast.${BASE_TOAST_CLASS} {
  overflow: hidden;
  border-radius: 12px;
}

.toast.${BASE_TOAST_CLASS} .imggen-toast__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast.${BASE_TOAST_CLASS} .imggen-toast__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.toast.${BASE_TOAST_CLASS} .imggen-toast__button {
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  cursor: pointer;
  font-size: 0.82rem;
  line-height: 1.2;
}

.toast.${BASE_TOAST_CLASS} .imggen-toast__button:hover {
  background: rgba(255, 255, 255, 0.14);
}

.toast.${BASE_TOAST_CLASS} .imggen-toast__button:disabled {
  opacity: 0.45;
  cursor: default;
}

.toast.${BASE_TOAST_CLASS}.imggen-toast--transient {
  animation: imggen-toast-enter 180ms ease-out;
}

.toast.${BASE_TOAST_CLASS}.imggen-toast--progress .toast-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast.${BASE_TOAST_CLASS}.imggen-toast--progress .toast-title::after {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.75;
  animation: imggen-toast-pulse 1.25s ease-in-out infinite;
}

.toast.${BASE_TOAST_CLASS}.imggen-toast--progress .toast-progress {
  opacity: 0.9;
  height: 3px;
  width: 100% !important;
  background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85), transparent);
  background-size: 200% 100%;
  animation: imggen-toast-scan 1.5s linear infinite;
}

@keyframes imggen-toast-enter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes imggen-toast-pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.45;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.95;
  }
}

@keyframes imggen-toast-scan {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}
`;

function decorateToast(
  toast: JQuery | undefined,
  type: ToastMethod,
  options?: {
    persistent?: boolean;
    variant?: 'progress' | 'result';
  },
) {
  if (!toast) {
    return toast;
  }

  toast.addClass(
    [
      BASE_TOAST_CLASS,
      `imggen-toast--${type}`,
      options?.persistent ? 'imggen-toast--persistent' : 'imggen-toast--transient',
      options?.variant === 'progress' ? 'imggen-toast--progress' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

  return toast;
}

function showToast(
  type: ToastMethod,
  message: string,
  title?: string,
  options?: ToastOptions & {
    persistent?: boolean;
    variant?: 'progress' | 'result';
  },
) {
  const toastOptions: ToastOptions = options?.persistent
    ? {
        timeOut: 0,
        extendedTimeOut: 0,
        closeButton: true,
        progressBar: true,
        tapToDismiss: false,
      }
    : {
        timeOut: type === 'error' ? 5600 : type === 'warning' ? 4200 : type === 'success' ? 2400 : 2800,
        extendedTimeOut: 1200,
        closeButton: type === 'warning' || type === 'error',
        progressBar: type !== 'success',
      };

  return decorateToast(
    toastr[type](message, title, {
      ...toastOptions,
      ...options,
    }),
    type,
    options,
  );
}

export function mountToastStyles() {
  if (!document.getElementById(TOAST_STYLE_ID)) {
    $('<style>').attr('id', TOAST_STYLE_ID).attr('script_id', getScriptId()).text(TOAST_STYLE_CONTENT).appendTo('head');
  }

  return () => {
    $(`#${TOAST_STYLE_ID}`).remove();
  };
}

export function clearToast(toast?: JQuery, options?: ClearToastOptions) {
  if (toast?.length) {
    toastr.clear(toast, options?.force ? { force: true } : undefined);
    if (options?.immediate) {
      toastr.remove(toast);
    }
  }
}

export function showProgressToast(message: string, title: string, previousToast?: JQuery) {
  clearToast(previousToast, { force: true, immediate: true });
  return showToast('info', message, title, {
    persistent: true,
    variant: 'progress',
    escapeHtml: false,
  });
}

export function showInfoToast(message: string, title?: string, options?: ToastOptions) {
  return showToast('info', message, title, options);
}

export function showSuccessToast(message: string, title?: string, options?: ToastOptions) {
  return showToast('success', message, title, options);
}

export function showWarningToast(message: string, title?: string, options?: ToastOptions) {
  return showToast('warning', message, title, options);
}

export function showErrorToast(message: string, title?: string, options?: ToastOptions) {
  return showToast('error', message, title, options);
}
