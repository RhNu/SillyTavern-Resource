export type ExtensionMenuPredicate = boolean | (() => boolean);

export type ExtensionMenuClickContext = {
  event: MouseEvent;
  session: ExtensionMenuSession;
};

export type ExtensionMenuItemOptions = {
  id: string;
  containerId?: string;
  label: string;
  title?: string;
  iconClass: string;
  classNames?: string[];
  visible?: ExtensionMenuPredicate;
  enabled?: ExtensionMenuPredicate;
  document?: Document;
  onClick: (context: ExtensionMenuClickContext) => void | Promise<void>;
  onError?: (error: unknown, context: ExtensionMenuClickContext) => void | Promise<void>;
  onMountChange?: (mounted: boolean) => void;
};

export type ExtensionMenuSession = {
  readonly container: HTMLDivElement;
  readonly element: HTMLDivElement;
  readonly mounted: boolean;
  readonly pending: boolean;
  mount(): boolean;
  refresh(): void;
  destroy(): void;
};
