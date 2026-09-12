export type LoaderToastMode = SillyTavern.ActionLoaderToastMode;
export type LoaderState = 'active' | 'stopping' | 'stopped' | 'hiding' | 'hidden';
export type LoaderUpdate = { message: string; stopTooltip?: string };

export type LoaderOptions = Omit<SillyTavern.ActionLoaderOptions, 'toastMode' | 'onStop' | 'onHide'> & {
  toast?: LoaderToastMode;
  onStop?: (session: LoaderSession) => void | Promise<void>;
  onHide?: (session: LoaderSession) => void | Promise<void>;
};

export type LoaderSession = {
  readonly native: SillyTavern.ActionLoaderHandle;
  readonly id: string | undefined;
  readonly slug: string | null;
  readonly blocking: boolean;
  readonly active: boolean;
  readonly state: LoaderState;
  readonly signal: AbortSignal;
  update(options: LoaderUpdate): void;
  stop(): Promise<void>;
  hide(): Promise<void>;
};
