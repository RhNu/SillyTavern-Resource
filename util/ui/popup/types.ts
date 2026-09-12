import type { Simplify } from 'type-fest';
import type { NativePopupInstance, NativePopupOptions } from './native-types';

export type PopupContent = string | Element | JQuery<HTMLElement>;
export type PopupActionKey = string;
export type PopupFieldValues = Record<string, boolean | string | number | null>;

export type PopupOutcome<TFields extends PopupFieldValues, TAction extends PopupActionKey> =
  | { status: 'completed'; action: TAction; fields: TFields }
  | { status: 'cancelled'; fields: TFields };

export type PopupLifecycleContext<TFields extends PopupFieldValues, TAction extends PopupActionKey> = {
  action: TAction | null;
  fields: TFields;
  native: NativePopupInstance;
};

export type PopupBeforeClose<TFields extends PopupFieldValues, TAction extends PopupActionKey> = (
  context: PopupLifecycleContext<TFields, TAction>,
) => boolean | void | Promise<boolean | void>;

export type PopupLifecycleCallback<TFields extends PopupFieldValues, TAction extends PopupActionKey> = (
  context: PopupLifecycleContext<TFields, TAction>,
) => void | Promise<void>;

export type PopupCallbackPhase = 'open' | 'before-close' | 'close';
export type PopupErrorCallback<TFields extends PopupFieldValues, TAction extends PopupActionKey> = (
  error: unknown,
  phase: PopupCallbackPhase,
  context: PopupLifecycleContext<TFields, TAction>,
) => void | Promise<void>;

export type PopupPresentationOptions = Omit<
  NativePopupOptions,
  'customButtons' | 'customInputs' | 'onClosing' | 'onClose' | 'onOpen' | 'cropAspect' | 'cropImage'
>;

export type PopupSession<TFields extends PopupFieldValues, TAction extends PopupActionKey> = {
  readonly native: NativePopupInstance;
  readonly closed: Promise<PopupOutcome<TFields, TAction>>;
  readonly isClosed: boolean;
  close(action: TAction): Promise<void>;
  cancel(): Promise<void>;
};

export type AddPopupField<
  TFields extends PopupFieldValues,
  TName extends string,
  TValue extends boolean | string | number | null,
> = Simplify<TFields & Record<TName, TValue>>;
