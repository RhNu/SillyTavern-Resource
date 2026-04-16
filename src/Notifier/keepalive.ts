import {
  QR_BUTTON_START,
  QR_BUTTON_STOP,
  SCRIPT_DISPLAY_NAME,
  SILENT_AUDIO_URL,
  SILENT_VIDEO_URL,
} from './constants';
import type { KeepAliveMode } from './store';

type KeepAliveControllerOptions = {
  getMode: () => KeepAliveMode;
  onActiveChange: (active: boolean) => void;
  onStopRequest: () => void;
};

type DisposableUnit = {
  start: () => void;
  resume: () => void;
  stop: () => void;
};

type ToggleOption = {
  hidden?: boolean;
  minimized?: boolean;
};

function getHostDocument() {
  return window.parent.document;
}

function getHostJQuery(): JQueryStatic {
  return ((window.parent as Window & typeof globalThis & { jQuery?: JQueryStatic }).jQuery ?? $) as JQueryStatic;
}

function createInteractionGate(onUnlocked: () => void) {
  let unlocked = false;
  let armed = false;

  const handleUnlock = () => {
    if (unlocked) {
      return;
    }

    unlocked = true;
    disarm();
    onUnlocked();
  };

  const arm = () => {
    if (armed || unlocked) {
      return;
    }

    armed = true;
    const hostDocument = getHostDocument();
    hostDocument.addEventListener('click', handleUnlock, { once: true, capture: true });
    hostDocument.addEventListener('touchstart', handleUnlock, { once: true, capture: true });
  };

  const disarm = () => {
    if (!armed) {
      return;
    }

    armed = false;
    const hostDocument = getHostDocument();
    hostDocument.removeEventListener('click', handleUnlock, true);
    hostDocument.removeEventListener('touchstart', handleUnlock, true);
  };

  return {
    arm,
    disarm,
    isUnlocked() {
      return unlocked;
    },
  };
}

function createWebLockLease() {
  let abortController: AbortController | null = null;

  return {
    acquire() {
      if (!('locks' in navigator) || abortController) {
        return;
      }

      abortController = new AbortController();
      navigator.locks
        .request(
          `${getScriptId()}-presence`,
          {
            signal: abortController.signal,
          },
          () => new Promise<void>(() => {}),
        )
        .catch(error => {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
          console.warn(`[${SCRIPT_DISPLAY_NAME}] Web Lock 保持失败`, error);
        });
    },

    release() {
      abortController?.abort();
      abortController = null;
    },
  };
}

function createHeartbeatWorker(onPulse: () => void) {
  let worker: Worker | null = null;
  let workerUrl: string | null = null;

  return {
    start() {
      if (worker) {
        return;
      }

      const source = `
        let timer = null;
        self.onmessage = event => {
          if (event.data === 'start' && !timer) {
            timer = setInterval(() => self.postMessage('pulse'), 15000);
          }
          if (event.data === 'stop' && timer) {
            clearInterval(timer);
            timer = null;
          }
        };
      `;
      workerUrl = URL.createObjectURL(new Blob([source], { type: 'application/javascript' }));
      worker = new Worker(workerUrl);
      worker.onmessage = () => onPulse();
      worker.onerror = error => {
        console.warn(`[${SCRIPT_DISPLAY_NAME}] 心跳线程意外中断`, error);
        this.stop();
      };
      worker.postMessage('start');
    },

    stop() {
      worker?.postMessage('stop');
      worker?.terminate();
      worker = null;
      if (workerUrl) {
        URL.revokeObjectURL(workerUrl);
        workerUrl = null;
      }
    },
  };
}

function createBroadcastPulse(onPulse: () => void) {
  let channel: BroadcastChannel | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;

  return {
    start() {
      if (channel) {
        return;
      }

      try {
        channel = new BroadcastChannel(`${getScriptId()}-presence`);
        channel.onmessage = () => onPulse();
        timer = setInterval(() => {
          channel?.postMessage({ type: 'pulse', at: Date.now() });
        }, 30000);
      } catch (error) {
        console.warn(`[${SCRIPT_DISPLAY_NAME}] BroadcastChannel 不可用`, error);
        this.stop();
      }
    },

    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      channel?.close();
      channel = null;
    },
  };
}

function createAudioPresence(): DisposableUnit {
  let context: AudioContext | null = null;
  let constantSource: ConstantSourceNode | null = null;
  let gainNode: GainNode | null = null;
  let audioElement: HTMLAudioElement | null = null;

  const keepPlaying = () => {
    if (!audioElement) {
      return;
    }

    void audioElement.play().catch(error => {
      console.warn(`[${SCRIPT_DISPLAY_NAME}] 静音音频恢复失败`, error);
    });
  };

  const syncMediaSession = () => {
    if (!('mediaSession' in navigator)) {
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: '后台常驻运行中',
      artist: SCRIPT_DISPLAY_NAME,
    });
    navigator.mediaSession.setActionHandler('pause', keepPlaying);
    navigator.mediaSession.setActionHandler('play', keepPlaying);
  };

  const clearMediaSession = () => {
    if (!('mediaSession' in navigator)) {
      return;
    }

    navigator.mediaSession.metadata = null;
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('play', null);
  };

  return {
    start() {
      if (!context) {
        try {
          context = new AudioContext();
          constantSource = context.createConstantSource();
          gainNode = context.createGain();
          constantSource.offset.value = 1;
          gainNode.gain.value = 0.0001;
          constantSource.connect(gainNode);
          gainNode.connect(context.destination);
          constantSource.start();
        } catch (error) {
          console.warn(`[${SCRIPT_DISPLAY_NAME}] 常驻音频上下文启动失败`, error);
        }
      }

      if (!audioElement) {
        audioElement = new Audio(SILENT_AUDIO_URL);
        audioElement.loop = true;
        audioElement.preload = 'auto';
        audioElement.volume = 0.001;
        audioElement.addEventListener('pause', keepPlaying);
        audioElement.addEventListener('ended', keepPlaying);
      }

      syncMediaSession();
      keepPlaying();
    },

    resume() {
      if (context?.state === 'suspended') {
        void context.resume().catch(error => {
          console.warn(`[${SCRIPT_DISPLAY_NAME}] 恢复音频上下文失败`, error);
        });
      }

      if (audioElement?.paused) {
        keepPlaying();
      }
    },

    stop() {
      if (audioElement) {
        audioElement.removeEventListener('pause', keepPlaying);
        audioElement.removeEventListener('ended', keepPlaying);
        audioElement.pause();
        audioElement.src = '';
        audioElement.load();
        audioElement = null;
      }

      try {
        constantSource?.stop();
      } catch {
        // noop
      }
      constantSource?.disconnect();
      gainNode?.disconnect();
      constantSource = null;
      gainNode = null;
      void context?.close().catch(() => undefined);
      context = null;
      clearMediaSession();
    },
  };
}

function createPipPresence(onStopRequest: () => void): DisposableUnit {
  let shell: HTMLDivElement | null = null;
  let chip: HTMLButtonElement | null = null;
  let video: HTMLVideoElement | null = null;

  const setVisibleState = ({ hidden = false, minimized = false }: ToggleOption) => {
    if (shell) {
      shell.hidden = hidden || minimized;
    }
    if (chip) {
      chip.hidden = hidden || !minimized;
    }
  };

  const togglePictureInPicture = async () => {
    const hostDocument = getHostDocument() as Document & {
      pictureInPictureElement?: Element | null;
      exitPictureInPicture?: () => Promise<void>;
    };
    if (!video) {
      return;
    }

    try {
      if (hostDocument.pictureInPictureElement === video) {
        await hostDocument.exitPictureInPicture?.();
        return;
      }

      video.muted = false;
      video.volume = 0.001;
      if (video.paused) {
        await video.play();
      }
      if (typeof video.requestPictureInPicture === 'function') {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.warn(`[${SCRIPT_DISPLAY_NAME}] PiP 切换失败`, error);
    }
  };

  const ensureUi = () => {
    if (shell && chip && video) {
      return;
    }

    const hostDocument = getHostDocument();
    getHostJQuery()('#notifier-pip-shell, #notifier-pip-chip').remove();

    shell = hostDocument.createElement('div');
    shell.id = 'notifier-pip-shell';
    shell.className = 'notifier-pip-shell';

    const header = hostDocument.createElement('div');
    header.className = 'notifier-pip-header';
    header.innerHTML = `
      <div class="notifier-pip-title">
        <span class="fa-solid fa-wave-square"></span>
        <span>后台常驻</span>
      </div>
      <div class="notifier-pip-actions">
        <button type="button" class="menu_button notifier-pip-action" data-action="pip">PiP</button>
        <button type="button" class="menu_button notifier-pip-action" data-action="minimize">收起</button>
        <button type="button" class="menu_button notifier-pip-action is-danger" data-action="stop">停止</button>
      </div>
    `;

    const body = hostDocument.createElement('div');
    body.className = 'notifier-pip-body';
    body.innerHTML = '<p>视频常驻不会抢占音乐播放，适合移动端待机。</p>';

    video = hostDocument.createElement('video');
    video.className = 'notifier-pip-video';
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = SILENT_VIDEO_URL;

    body.appendChild(video);
    shell.append(header, body);

    chip = hostDocument.createElement('button');
    chip.id = 'notifier-pip-chip';
    chip.type = 'button';
    chip.hidden = true;
    chip.className = 'notifier-pip-chip';
    chip.innerHTML = '<span class="fa-solid fa-wave-square"></span><span>常驻中</span>';

    header.querySelector<HTMLElement>('[data-action="pip"]')?.addEventListener('click', () => {
      void togglePictureInPicture();
    });
    header.querySelector<HTMLElement>('[data-action="minimize"]')?.addEventListener('click', () => {
      setVisibleState({ minimized: true });
    });
    header.querySelector<HTMLElement>('[data-action="stop"]')?.addEventListener('click', () => {
      onStopRequest();
    });
    chip.addEventListener('click', () => {
      setVisibleState({ minimized: false });
    });

    hostDocument.body.append(shell, chip);

    try {
      const host$ = getHostJQuery();
      (host$(shell) as JQuery<HTMLElement> & {
        draggable?: (options: Record<string, unknown>) => void;
        resizable?: (options: Record<string, unknown>) => void;
      }).draggable?.({
        handle: '.notifier-pip-header',
        containment: 'window',
      });
      (host$(shell) as JQuery<HTMLElement> & {
        resizable?: (options: Record<string, unknown>) => void;
      }).resizable?.({
        handles: 'se',
        minWidth: 220,
        minHeight: 180,
      });
    } catch (error) {
      console.warn(`[${SCRIPT_DISPLAY_NAME}] PiP 悬浮窗拖拽初始化失败`, error);
    }
  };

  const ensurePlayback = () => {
    if (!video) {
      return;
    }

    if (!video.src) {
      video.src = SILENT_VIDEO_URL;
    }
    video.muted = false;
    video.volume = 0.001;
    void video.play().catch(error => {
      console.warn(`[${SCRIPT_DISPLAY_NAME}] PiP 视频恢复失败`, error);
    });
  };

  return {
    start() {
      ensureUi();
      setVisibleState({ minimized: false });
      ensurePlayback();
    },

    resume() {
      if (!video) {
        this.start();
        return;
      }
      if (video.paused) {
        ensurePlayback();
      }
    },

    stop() {
      const hostDocument = getHostDocument() as Document & {
        pictureInPictureElement?: Element | null;
        exitPictureInPicture?: () => Promise<void>;
      };

      if (video) {
        if (hostDocument.pictureInPictureElement === video) {
          void hostDocument.exitPictureInPicture?.().catch(() => undefined);
        }
        video.pause();
        video.removeAttribute('src');
        video.load();
      }

      shell?.remove();
      chip?.remove();
      shell = null;
      chip = null;
      video = null;
    },
  };
}

export function syncQrButtons(showQrButton: boolean, active: boolean) {
  void updateScriptButtonsWith(buttons => {
    const nextButtons = buttons.filter(button => button.name !== QR_BUTTON_START && button.name !== QR_BUTTON_STOP);
    if (!showQrButton) {
      return nextButtons;
    }

    return [
      ...nextButtons,
      { name: QR_BUTTON_START, visible: !active },
      { name: QR_BUTTON_STOP, visible: active },
    ];
  });
}

export function bindQrButtonEvents(onStart: () => void, onStop: () => void) {
  const startListener = eventOn(getButtonEvent(QR_BUTTON_START), onStart);
  const stopListener = eventOn(getButtonEvent(QR_BUTTON_STOP), onStop);

  return {
    destroy() {
      startListener.stop();
      stopListener.stop();
    },
  };
}

export function createKeepAliveController(options: KeepAliveControllerOptions) {
  const audioPresence = createAudioPresence();
  const pipPresence = createPipPresence(options.onStopRequest);
  const interactionGate = createInteractionGate(() => {
    if (active) {
      startTransport();
    }
  });
  const webLock = createWebLockLease();
  const heartbeatWorker = createHeartbeatWorker(() => {
    resumeTransport();
  });
  const broadcastPulse = createBroadcastPulse(() => {
    heartbeatWorker.start();
    resumeTransport();
  });

  let active = false;

  const stopTransport = () => {
    audioPresence.stop();
    pipPresence.stop();
  };

  const startTransport = () => {
    stopTransport();
    if (options.getMode() === 'pip') {
      pipPresence.start();
      return;
    }

    audioPresence.start();
  };

  const resumeTransport = () => {
    if (!active || !interactionGate.isUnlocked()) {
      return;
    }

    if (options.getMode() === 'pip') {
      pipPresence.resume();
      return;
    }

    audioPresence.resume();
  };

  const handleResume = () => {
    if (!active) {
      return;
    }

    webLock.acquire();
    heartbeatWorker.start();
    broadcastPulse.start();
    resumeTransport();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      handleResume();
    }
  };

  return {
    isActive() {
      return active;
    },

    start() {
      if (active) {
        return;
      }

      active = true;
      options.onActiveChange(true);
      webLock.acquire();
      heartbeatWorker.start();
      broadcastPulse.start();
      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('resume', handleResume as EventListener);

      if (interactionGate.isUnlocked()) {
        startTransport();
      } else {
        interactionGate.arm();
      }

      console.info(`[${SCRIPT_DISPLAY_NAME}] 后台常驻已开启（${options.getMode()}）`);
    },

    stop() {
      if (!active) {
        return;
      }

      active = false;
      options.onActiveChange(false);
      interactionGate.disarm();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('resume', handleResume as EventListener);
      heartbeatWorker.stop();
      broadcastPulse.stop();
      webLock.release();
      stopTransport();
      console.info(`[${SCRIPT_DISPLAY_NAME}] 后台常驻已停止`);
    },

    restartMode() {
      if (!active) {
        return;
      }

      if (interactionGate.isUnlocked()) {
        startTransport();
      } else {
        interactionGate.arm();
      }
    },

    destroy() {
      this.stop();
      syncQrButtons(false, false);
      stopTransport();
    },
  };
}
