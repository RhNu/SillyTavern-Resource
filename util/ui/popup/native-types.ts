export type NativePopupValue = string | number | boolean | null;

export type NativePopupButton = Omit<SillyTavern.CustomPopupButton, 'result'> & {
  tooltip?: string;
  result?: number | null;
  icon?: string;
};

export type NativePopupInput = Omit<SillyTavern.CustomPopupInput, 'defaultState' | 'type'> & {
  defaultState?: boolean | string;
  type?: 'checkbox' | 'text' | 'textarea' | 'number';
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
};

export type NativePopupInstance = {
  readonly type: number;
  readonly id: string;
  readonly dlg: HTMLDialogElement;
  readonly body: HTMLDivElement;
  readonly content: HTMLDivElement;
  readonly mainInput: HTMLTextAreaElement;
  readonly inputControls: HTMLDivElement;
  readonly buttonControls: HTMLDivElement;
  readonly okButton: HTMLDivElement;
  readonly cancelButton: HTMLDivElement;
  readonly closeButton: HTMLDivElement;
  result?: number | null;
  value?: NativePopupValue;
  inputResults?: Map<string, string | boolean>;
  show(): Promise<NativePopupValue>;
  complete(result: number | null): Promise<NativePopupValue | undefined>;
  completeAffirmative(): Promise<NativePopupValue | undefined>;
  completeNegative(): Promise<NativePopupValue | undefined>;
  completeCancelled(): Promise<NativePopupValue | undefined>;
};

export type NativePopupOptions = Omit<
  SillyTavern.PopupOptions,
  'defaultResult' | 'customButtons' | 'customInputs' | 'onClosing' | 'onClose' | 'onOpen'
> & {
  placeholder?: string;
  tooltip?: string;
  defaultResult?: number | null;
  customButtons?: NativePopupButton[] | string[];
  customInputs?: NativePopupInput[];
  allowEscapeClose?: boolean;
  onClosing?: (popup: NativePopupInstance) => boolean | null | void | Promise<boolean | null | void>;
  onClose?: (popup: NativePopupInstance) => void | Promise<void>;
  onOpen?: (popup: NativePopupInstance) => void | Promise<void>;
};

export type NativePopupConstructor = {
  new (
    content: string | Element | JQuery<HTMLElement>,
    type: number,
    inputValue?: string,
    popupOptions?: NativePopupOptions,
  ): NativePopupInstance;
};

export type SillyTavernPopupApi = {
  readonly Popup: NativePopupConstructor;
  readonly POPUP_RESULT: Omit<typeof SillyTavern.POPUP_RESULT, 'CANCELLED'> & { readonly CANCELLED: null };
  readonly POPUP_TYPE: typeof SillyTavern.POPUP_TYPE;
};
