import { QR_BUTTON_START, QR_BUTTON_STOP, SCRIPT_DISPLAY_NAME, SILENT_AUDIO_URL } from './constants';

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

function getHostDocument() {
  return window.parent.document;
}

function getInteractionDocuments() {
  const documents = [document];
  const hostDocument = getHostDocument();
  if (hostDocument !== document) {
    documents.push(hostDocument);
  }
  return documents;
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
    for (const targetDocument of getInteractionDocuments()) {
      targetDocument.addEventListener('click', handleUnlock, { once: true, capture: true });
      targetDocument.addEventListener('touchstart', handleUnlock, { once: true, capture: true });
    }
  };

  const disarm = () => {
    if (!armed) {
      return;
    }

    armed = false;
    for (const targetDocument of getInteractionDocuments()) {
      targetDocument.removeEventListener('click', handleUnlock, true);
      targetDocument.removeEventListener('touchstart', handleUnlock, true);
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
        console.warn(`[${SCRIPT_DISPLAY_NAME}] 常驻音频上下文启动失败`, error);
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

      console.warn(`[${SCRIPT_DISPLAY_NAME}] 静音音频恢复失败`, error);
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
      shouldKeepPlaying = true;
      ensureNodes();
      syncMediaSession();
      return playAudio();
    },

    async resume() {
      shouldKeepPlaying = true;

      if (context?.state === 'suspended') {
        void context.resume().catch(error => {
          console.warn(`[${SCRIPT_DISPLAY_NAME}] 恢复音频上下文失败`, error);
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

export function syncQrButtons(showQrButton: boolean, enabled: boolean) {
  void updateScriptButtonsWith(buttons => {
    const nextButtons = buttons.filter(button => button.name !== QR_BUTTON_START && button.name !== QR_BUTTON_STOP);
    if (!showQrButton) {
      return nextButtons;
    }

    return [
      ...nextButtons,
      { name: QR_BUTTON_START, visible: !enabled },
      { name: QR_BUTTON_STOP, visible: enabled },
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

  const audioPresence = createAudioPresence(active => {
    setTransportActive(enabled && active);
  });
  const interactionGate = createInteractionGate(() => {
    if (!enabled) {
      return;
    }

    void startTransport();
  });
  const webLock = createWebLockLease();
  const heartbeatWorker = createHeartbeatWorker(() => {
    void resumeTransport();
  });
  const broadcastPulse = createBroadcastPulse(() => {
    heartbeatWorker.start();
    void resumeTransport();
  });

  const stopTransport = () => {
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
        return false;
      }

      const attemptId = ++transportAttemptId;
      setTransportStarting(true);

      try {
        const started = await audioPresence.start();
        if (!enabled || attemptId !== transportAttemptId) {
          return false;
        }

        if (started) {
          interactionGate.unlock();
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
        return false;
      }

      const attemptId = ++transportAttemptId;
      setTransportStarting(true);

      try {
        const started = await audioPresence.resume();
        if (!enabled || attemptId !== transportAttemptId) {
          return false;
        }

        if (started) {
          interactionGate.unlock();
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

    webLock.acquire();
    heartbeatWorker.start();
    broadcastPulse.start();
    if (interactionGate.isUnlocked()) {
      void resumeTransport();
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
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

      webLock.acquire();
      heartbeatWorker.start();
      broadcastPulse.start();
      if (!wasEnabled) {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('resume', handleResume as EventListener);
      }

      if (startOptions.userInitiated) {
        interactionGate.unlock();
      }

      if (!wasEnabled) {
        console.info(`[${SCRIPT_DISPLAY_NAME}] 后台常驻已开启`);
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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('resume', handleResume as EventListener);
      heartbeatWorker.stop();
      broadcastPulse.stop();
      webLock.release();
      stopTransport();
      console.info(`[${SCRIPT_DISPLAY_NAME}] 后台常驻已停止`);
    },

    destroy() {
      this.stop();
      syncQrButtons(false, false);
    },
  };
}
