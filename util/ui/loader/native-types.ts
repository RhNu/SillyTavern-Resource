export type NativeLoaderToastMode = 'none' | 'static' | 'stoppable';

export type NativeLoaderOptions = {
  blocking?: boolean;
  toastMode?: NativeLoaderToastMode;
  slug?: string | null;
  message?: string;
  title?: string;
  stopTooltip?: string;
  overlayContent?: HTMLElement | string | null;
  onStop?: (() => void | Promise<void>) | null;
  onHide?: (() => void | Promise<void>) | null;
};

export type NativeLoaderHandle = {
  readonly id: string | undefined;
  readonly slug: string | null;
  readonly isActive: boolean;
  readonly isBlocking: boolean;
  stop(): Promise<void>;
  hide(): Promise<void>;
};

export type NativeLoaderApi = {
  show(options?: NativeLoaderOptions): NativeLoaderHandle;
  hide(handle?: NativeLoaderHandle | null): Promise<boolean>;
  active(): NativeLoaderHandle[];
  get(id: string): NativeLoaderHandle | undefined;
  isBlocking(): boolean;
  readonly ToastMode: {
    readonly NONE: 'none';
    readonly STATIC: 'static';
    readonly STOPPABLE: 'stoppable';
  };
  readonly Handle: {
    new (options?: NativeLoaderOptions): NativeLoaderHandle;
    readonly EMPTY: NativeLoaderHandle;
  };
  createOverlay(): HTMLDivElement;
};
