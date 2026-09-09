import { createLogger } from '@util/common';
import { getHostDomContext, getInteractionDocuments } from '@util/host';
import { SCRIPT_BUTTON_START, SCRIPT_BUTTON_STOP, SCRIPT_DISPLAY_NAME, SILENT_AUDIO_URL } from './constants';

const logger = createLogger(SCRIPT_DISPLAY_NAME);

type KeepAliveControllerOptions = {
  onActiveChange: (active: boolean) => void;
  onStartingChange: (starting: boolean) => void;
};

type StartOptions = {
  userInitiated?: boolean;
};

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function createInteractionGate(onUnlocked: () => void) {
  let unlocked = false;
  let armed = false;
  const interactionEvents = ['pointerdown', 'touchstart', 'keydown'] as const;

  const handleUnlock = () => {
    if (unlocked) {
      return;
    }

    unlocked = true;
    disarm();
    logger.info('用户交互已解锁后台常驻。');
    onUnlocked();
  };

  const arm = () => {
    if (armed || unlocked) {
      return;
    }

    armed = true;
    logger.debug('已挂载用户交互监听，等待解锁后台常驻。');
    for (const targetDocument of getInteractionDocuments()) {
      for (const eventName of interactionEvents) {
        targetDocument.addEventListener(eventName, handleUnlock, { once: true, capture: true });
      }
    }
  };

  const disarm = () => {
    if (!armed) {
      return;
    }

    armed = false;
    logger.debug('已移除用户交互监听。');
    for (const targetDocument of getInteractionDocuments()) {
      for (const eventName of interactionEvents) {
        targetDocument.removeEventListener(eventName, handleUnlock, true);
      }
    }
  };

  return {
    arm,
    disarm,
    unlock() {
      if (unlocked) {
        return;
      }

      unlocked = true;
      disarm();
    },
    waitForInteraction() {
      unlocked = false;
      arm();
    },
    isUnlocked() {
      return unlocked;
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

      logger.debug('启动低频播放状态探测 Worker。');

      const source = `
        let timer = null;
        self.onmessage = event => {
          if (event.data === 'start' && !timer) {
            timer = setInterval(() => self.postMessage('pulse'), 30000);
          }
          if (event.data === 'stop' && timer) {
            clearInterval(timer);
            timer = null;
          }
        };
      `;

      try {
        workerUrl = URL.createObjectURL(new Blob([source], { type: 'application/javascript' }));
        worker = new Worker(workerUrl);
        worker.onmessage = () => onPulse();
        worker.onerror = error => {
          logger.warn('播放状态探测 Worker 意外中断', error);
          this.stop();
        };
        worker.postMessage('start');
      } catch (error) {
        logger.warn('当前环境无法创建播放状态探测 Worker', error);
        this.stop();
      }
    },

    stop() {
      logger.debug('停止心跳 Worker。');
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

function createAudioPresence(onPlaybackStateChange: (active: boolean) => void) {
  let context: AudioContext | null = null;
  let constantSource: ConstantSourceNode | null = null;
  let gainNode: GainNode | null = null;
  let audioElement: HTMLAudioElement | null = null;
  let shouldKeepPlaying = false;
  let playRequestId = 0;
  let retryTimer: number | null = null;

  const clearRetryTimer = () => {
    if (retryTimer !== null) {
      window.clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  const isPlaying = () => Boolean(audioElement && !audioElement.paused && !audioElement.ended);

  const syncPlaybackState = () => {
    onPlaybackStateChange(isPlaying());
  };

  const ensureNodes = () => {
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
        logger.warn('常驻音频上下文启动失败', error);
      }
    }

    if (!audioElement) {
      audioElement = new Audio(SILENT_AUDIO_URL);
      audioElement.loop = true;
      audioElement.preload = 'auto';
      audioElement.volume = 0.001;
      audioElement.addEventListener('pause', handlePlaybackInterrupted);
      audioElement.addEventListener('ended', handlePlaybackInterrupted);
      audioElement.addEventListener('play', syncPlaybackState);
    }
  };

  const playAudio = async (): Promise<boolean> => {
    if (!audioElement || !shouldKeepPlaying) {
      return false;
    }

    const requestId = ++playRequestId;

    try {
      await audioElement.play();
      const playing = requestId === playRequestId && shouldKeepPlaying && isPlaying();
      onPlaybackStateChange(playing);
      return playing;
    } catch (error) {
      if (requestId !== playRequestId || !shouldKeepPlaying) {
        return false;
      }

      if (isAbortError(error)) {
        return new Promise(resolve => {
          clearRetryTimer();
          retryTimer = window.setTimeout(() => {
            retryTimer = null;
            void playAudio().then(resolve);
          }, 0);
        });
      }

      logger.warn('静音音频恢复失败', error);
      onPlaybackStateChange(false);
      return false;
    }
  };

  function handlePlaybackInterrupted() {
    onPlaybackStateChange(false);
    if (!shouldKeepPlaying) {
      return;
    }

    void playAudio();
  }

  const syncMediaSession = () => {
    if (!('mediaSession' in navigator)) {
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: '后台常驻运行中',
      artist: SCRIPT_DISPLAY_NAME,
    });
    navigator.mediaSession.setActionHandler('pause', handlePlaybackInterrupted);
    navigator.mediaSession.setActionHandler('play', handlePlaybackInterrupted);
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
    async start() {
      logger.info('尝试启动常驻音频。');
      shouldKeepPlaying = true;
      ensureNodes();
      syncMediaSession();
      return playAudio();
    },

    async resume() {
      logger.debug('尝试恢复常驻音频。');
      shouldKeepPlaying = true;

      // iOS Safari 可能使用非标准的 interrupted 状态；只要不是 running/closed 都尝试恢复。
      if (context && context.state !== 'running' && context.state !== 'closed') {
        void context.resume().catch(error => {
          logger.warn('恢复音频上下文失败', error);
        });
      }

      if (!audioElement || audioElement.paused) {
        ensureNodes();
        return playAudio();
      }

      syncPlaybackState();
      return true;
    },

    isPlaying,

    stop() {
      logger.debug('停止常驻音频并释放资源。');
      shouldKeepPlaying = false;
      playRequestId += 1;
      clearRetryTimer();

      if (audioElement) {
        audioElement.removeEventListener('pause', handlePlaybackInterrupted);
        audioElement.removeEventListener('ended', handlePlaybackInterrupted);
        audioElement.removeEventListener('play', syncPlaybackState);
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
      onPlaybackStateChange(false);
    },
  };
}

export function syncScriptButtons(showScriptButton: boolean, enabled: boolean) {
  logger.debug(`同步脚本按钮状态: show=${showScriptButton}, enabled=${enabled}`);
  void updateScriptButtonsWith(buttons => {
    const nextButtons = buttons.filter(
      button => button.name !== SCRIPT_BUTTON_START && button.name !== SCRIPT_BUTTON_STOP,
    );
    if (!showScriptButton) {
      return nextButtons;
    }

    return [
      ...nextButtons,
      { name: SCRIPT_BUTTON_START, visible: !enabled },
      { name: SCRIPT_BUTTON_STOP, visible: enabled },
    ];
  });
}

export function bindScriptButtonEvents(onStart: () => void, onStop: () => void) {
  logger.info('绑定脚本按钮事件。');
  const startListener = eventOn(getButtonEvent(SCRIPT_BUTTON_START), onStart);
  const stopListener = eventOn(getButtonEvent(SCRIPT_BUTTON_STOP), onStop);

  return {
    destroy() {
      logger.info('解绑脚本按钮事件。');
      startListener.stop();
      stopListener.stop();
    },
  };
}

export function createKeepAliveController(options: KeepAliveControllerOptions) {
  let enabled = false;
  let transportActive = false;
  let transportStarting = false;
  let transportAttemptId = 0;
  let startPromise: Promise<boolean> | null = null;

  const setTransportActive = (active: boolean) => {
    if (transportActive === active) {
      return;
    }

    transportActive = active;
    options.onActiveChange(active);
  };

  const setTransportStarting = (starting: boolean) => {
    if (transportStarting === starting) {
      return;
    }

    transportStarting = starting;
    options.onStartingChange(starting);
  };

  const interactionGate = createInteractionGate(() => {
    if (!enabled) {
      return;
    }

    void startTransport();
  });
  const audioPresence = createAudioPresence(active => {
    setTransportActive(enabled && active);
    if (enabled && !active) {
      interactionGate.waitForInteraction();
    }
  });
  const heartbeatWorker = createHeartbeatWorker(() => {
    if (enabled && interactionGate.isUnlocked() && !audioPresence.isPlaying()) {
      void resumeTransport();
    }
  });
  const { doc: hostDocument, win: hostWindow } = getHostDomContext();
  const lifecycleDocuments = [...new Set([document, hostDocument])];
  const lifecycleWindows = [...new Set([window, hostWindow])];

  const stopTransport = () => {
    logger.debug('停止后台常驻传输。');
    transportAttemptId += 1;
    startPromise = null;
    setTransportStarting(false);
    audioPresence.stop();
    setTransportActive(false);
  };

  const runTransportAttempt = (runner: () => Promise<boolean>) => {
    if (startPromise) {
      return startPromise;
    }

    const promise = runner().finally(() => {
      if (startPromise === promise) {
        startPromise = null;
      }
    });
    startPromise = promise;
    return promise;
  };

  const startTransport = () =>
    runTransportAttempt(async () => {
      if (!enabled) {
        logger.debug('跳过启动传输：当前未启用。');
        return false;
      }

      const attemptId = ++transportAttemptId;
      logger.info('开始后台常驻启动尝试。');
      setTransportStarting(true);

      try {
        const started = await audioPresence.start();
        if (!enabled || attemptId !== transportAttemptId) {
          logger.debug('启动尝试已过期或已被禁用，忽略结果。');
          return false;
        }

        if (started) {
          interactionGate.unlock();
          logger.info('后台常驻启动成功。');
        } else {
          interactionGate.waitForInteraction();
          logger.warn('后台常驻尚未启动，等待下一次用户交互后重试。');
        }
        setTransportActive(started);
        return started;
      } finally {
        if (attemptId === transportAttemptId) {
          setTransportStarting(false);
        }
      }
    });

  const resumeTransport = () =>
    runTransportAttempt(async () => {
      if (!enabled || !interactionGate.isUnlocked()) {
        logger.debug('跳过恢复传输：未启用或尚未解锁用户交互。');
        return false;
      }

      const attemptId = ++transportAttemptId;
      logger.info('开始后台常驻恢复尝试。');
      setTransportStarting(true);

      try {
        const started = await audioPresence.resume();
        if (!enabled || attemptId !== transportAttemptId) {
          logger.debug('恢复尝试已过期或已被禁用，忽略结果。');
          return false;
        }

        if (started) {
          interactionGate.unlock();
          logger.info('后台常驻恢复成功。');
        } else {
          interactionGate.waitForInteraction();
          logger.warn('后台常驻尚未恢复，等待下一次用户交互后重试。');
        }
        setTransportActive(started);
        return started;
      } finally {
        if (attemptId === transportAttemptId) {
          setTransportStarting(false);
        }
      }
    });

  const handleResume = () => {
    if (!enabled) {
      return;
    }

    logger.debug('收到恢复信号，准备恢复后台常驻。');
    heartbeatWorker.start();
    if (interactionGate.isUnlocked()) {
      void resumeTransport();
    }
  };

  const handleVisibilityChange = () => {
    if (lifecycleDocuments.some(targetDocument => targetDocument.visibilityState === 'visible')) {
      logger.debug('页面回到前台，触发恢复流程。');
      handleResume();
    }
  };

  return {
    isEnabled() {
      return enabled;
    },

    isActive() {
      return transportActive;
    },

    probePlayback() {
      const active = enabled && audioPresence.isPlaying();
      setTransportActive(active);
      return active;
    },

    async start(startOptions: StartOptions = {}) {
      const wasEnabled = enabled;
      enabled = true;

      if (startOptions.userInitiated) {
        logger.info('收到用户手动启动请求。');
      }

      heartbeatWorker.start();
      if (!wasEnabled) {
        for (const targetDocument of lifecycleDocuments) {
          targetDocument.addEventListener('visibilitychange', handleVisibilityChange);
          targetDocument.addEventListener('resume', handleResume as EventListener);
        }
        for (const targetWindow of lifecycleWindows) {
          targetWindow.addEventListener('pageshow', handleResume);
          targetWindow.addEventListener('focus', handleResume);
        }
      }

      if (startOptions.userInitiated) {
        interactionGate.unlock();
      } else {
        // 脚本可能在页面加载很久后才注入；预先监听下一次手势，避免错过自动播放解锁机会。
        interactionGate.waitForInteraction();
      }

      if (!wasEnabled) {
        logger.info('后台常驻已开启');
      }

      if (startOptions.userInitiated) {
        return startTransport();
      }

      return startTransport();
    },

    stop() {
      if (!enabled && !transportActive && !transportStarting) {
        return;
      }

      enabled = false;
      interactionGate.disarm();
      for (const targetDocument of lifecycleDocuments) {
        targetDocument.removeEventListener('visibilitychange', handleVisibilityChange);
        targetDocument.removeEventListener('resume', handleResume as EventListener);
      }
      for (const targetWindow of lifecycleWindows) {
        targetWindow.removeEventListener('pageshow', handleResume);
        targetWindow.removeEventListener('focus', handleResume);
      }
      heartbeatWorker.stop();
      stopTransport();
      logger.info('后台常驻已停止');
    },

    destroy() {
      logger.info('销毁后台常驻控制器。');
      this.stop();
      syncScriptButtons(false, false);
    },
  };
}
