import type { NativeLoaderHandle, NativeLoaderOptions, NativeLoaderToastMode } from './native-types';

export type LoaderToastMode = NativeLoaderToastMode;
export type LoaderState = 'active' | 'stopping' | 'stopped' | 'hiding' | 'hidden';
export type LoaderUpdate = { message: string; stopTooltip?: string };

export type LoaderOptions = Omit<NativeLoaderOptions, 'toastMode' | 'onStop' | 'onHide'> & {
  toast?: LoaderToastMode;
  onStop?: (session: LoaderSession) => void | Promise<void>;
  onHide?: (session: LoaderSession) => void | Promise<void>;
};

export type LoaderSession = {
  readonly native: NativeLoaderHandle;
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
