import { getHostDocument } from '@util/st/dom/host';
import { getSillyTavernPopupApi } from './native';
import type { NativePopupButton, NativePopupInput, NativePopupInstance } from './native-types';
import type {
  AddPopupField,
  PopupActionKey,
  PopupBeforeClose,
  PopupContent,
  PopupErrorCallback,
  PopupFieldValues,
  PopupLifecycleCallback,
  PopupLifecycleContext,
  PopupOutcome,
  PopupPresentationOptions,
  PopupSession,
} from './types';

type EmptyFields = Record<never, never>;
type PopupKind = 'text' | 'confirm' | 'display';
type ContentDefinition =
  | { kind: 'text'; value: string }
  | { kind: 'html'; value: string }
  | { kind: 'node'; value: Element | JQuery<HTMLElement> };

type FieldDefinition = NativePopupInput & { valueType: 'boolean' | 'string' | 'number' };
type ActionDefinition = { key: string; button: NativePopupButton };

function isJQueryContent(content: PopupContent): content is JQuery<HTMLElement> {
  return typeof content === 'object' && content !== null && 'jquery' in content;
}

export function createPopupContentElement(
  title: string | undefined,
  definition: ContentDefinition | undefined,
): HTMLElement {
  const doc = getHostDocument();
  const container = doc.createElement('div');
  if (title) {
    const heading = doc.createElement('h3');
    heading.textContent = title;
    container.append(heading);
  }
  if (!definition) return container;

  if (definition.kind === 'text') {
    const content = doc.createElement('div');
    content.style.whiteSpace = 'pre-wrap';
    content.textContent = definition.value;
    container.append(content);
  } else if (definition.kind === 'html') {
    const content = doc.createElement('div');
    content.innerHTML = definition.value;
    container.append(content);
  } else if (isJQueryContent(definition.value)) {
    container.append(...definition.value.toArray());
  } else {
    container.append(definition.value);
  }
  return container;
}

function readFields<TFields extends PopupFieldValues>(
  popup: NativePopupInstance,
  definitions: FieldDefinition[],
): TFields {
  const values = popup.inputResults ?? new Map<string, string | boolean>();
  return Object.fromEntries(
    definitions.map(definition => {
      const value = values.get(definition.id);
      if (definition.valueType === 'number') {
        if (value === undefined || value === '') return [definition.id, null];
        const parsed = Number(value);
        return [definition.id, Number.isFinite(parsed) ? parsed : null];
      }
      if (definition.valueType === 'boolean') return [definition.id, Boolean(value)];
      return [definition.id, typeof value === 'string' ? value : ''];
    }),
  ) as TFields;
}

export class PopupBuilder<TFields extends PopupFieldValues = EmptyFields, TAction extends PopupActionKey = never> {
  declare private readonly typeState: { fields: TFields; action: TAction };

  private titleValue?: string;
  private contentDefinition?: ContentDefinition;
  private kindValue: PopupKind = 'text';
  private presentationOptions: PopupPresentationOptions = {};
  private readonly fields: FieldDefinition[] = [];
  private readonly actions: ActionDefinition[] = [];
  private beforeCloseCallback?: PopupBeforeClose<TFields, TAction>;
  private openCallback?: PopupLifecycleCallback<TFields, TAction>;
  private closeCallback?: PopupLifecycleCallback<TFields, TAction>;
  private errorCallback?: PopupErrorCallback<TFields, TAction>;

  constructor(content?: PopupContent) {
    if (typeof content === 'string') this.text(content);
    else if (content) this.content(content);
  }

  title(title: string): this {
    this.titleValue = title;
    return this;
  }

  text(content: string): this {
    this.contentDefinition = { kind: 'text', value: content };
    return this;
  }

  html(trustedHtml: string): this {
    this.contentDefinition = { kind: 'html', value: trustedHtml };
    return this;
  }

  content(content: Element | JQuery<HTMLElement>): this {
    this.contentDefinition = { kind: 'node', value: content };
    return this;
  }

  textPopup(): this {
    this.kindValue = 'text';
    return this;
  }

  confirm(): this {
    this.kindValue = 'confirm';
    return this;
  }

  display(): this {
    this.kindValue = 'display';
    return this;
  }

  options(options: PopupPresentationOptions): this {
    this.presentationOptions = { ...this.presentationOptions, ...options };
    return this;
  }

  checkbox<const TName extends string>(
    name: TName,
    options: Omit<NativePopupInput, 'id' | 'type' | 'defaultState'> & { defaultValue?: boolean },
  ): PopupBuilder<AddPopupField<TFields, TName, boolean>, TAction> {
    const { defaultValue, ...nativeOptions } = options;
    this.addField({ ...nativeOptions, id: name, type: 'checkbox', defaultState: defaultValue, valueType: 'boolean' });
    return this as unknown as PopupBuilder<AddPopupField<TFields, TName, boolean>, TAction>;
  }

  textField<const TName extends string>(
    name: TName,
    options: Omit<NativePopupInput, 'id' | 'type' | 'defaultState'> & { defaultValue?: string },
  ): PopupBuilder<AddPopupField<TFields, TName, string>, TAction> {
    const { defaultValue, ...nativeOptions } = options;
    this.addField({ ...nativeOptions, id: name, type: 'text', defaultState: defaultValue, valueType: 'string' });
    return this as unknown as PopupBuilder<AddPopupField<TFields, TName, string>, TAction>;
  }

  textarea<const TName extends string>(
    name: TName,
    options: Omit<NativePopupInput, 'id' | 'type' | 'defaultState'> & { defaultValue?: string },
  ): PopupBuilder<AddPopupField<TFields, TName, string>, TAction> {
    const { defaultValue, ...nativeOptions } = options;
    this.addField({ ...nativeOptions, id: name, type: 'textarea', defaultState: defaultValue, valueType: 'string' });
    return this as unknown as PopupBuilder<AddPopupField<TFields, TName, string>, TAction>;
  }

  numberField<const TName extends string>(
    name: TName,
    options: Omit<NativePopupInput, 'id' | 'type' | 'defaultState'> & { defaultValue?: number },
  ): PopupBuilder<AddPopupField<TFields, TName, number | null>, TAction> {
    const { defaultValue, ...nativeOptions } = options;
    this.addField({
      ...nativeOptions,
      id: name,
      type: 'number',
      defaultState: defaultValue === undefined ? undefined : String(defaultValue),
      valueType: 'number',
    });
    return this as unknown as PopupBuilder<AddPopupField<TFields, TName, number | null>, TAction>;
  }

  action<const TKey extends string>(
    key: TKey,
    options: Omit<NativePopupButton, 'text' | 'result' | 'action'> & { label: string; primary?: boolean },
  ): PopupBuilder<TFields, TAction | TKey> {
    if (this.actions.some(action => action.key === key)) throw new Error(`Popup action "${key}" is already defined.`);
    if (this.actions.length === 0) {
      this.presentationOptions.okButton ??= false;
      this.presentationOptions.cancelButton ??= false;
    }
    const result = 1001 + this.actions.length;
    const { label, primary, ...buttonOptions } = options;
    this.actions.push({ key, button: { ...buttonOptions, text: label, result } });
    if (primary) this.presentationOptions.defaultResult = result;
    return this as unknown as PopupBuilder<TFields, TAction | TKey>;
  }

  beforeClose(callback: PopupBeforeClose<TFields, TAction>): this {
    this.beforeCloseCallback = callback;
    return this;
  }

  onOpen(callback: PopupLifecycleCallback<TFields, TAction>): this {
    this.openCallback = callback;
    return this;
  }

  onClose(callback: PopupLifecycleCallback<TFields, TAction>): this {
    this.closeCallback = callback;
    return this;
  }

  onError(callback: PopupErrorCallback<TFields, TAction>): this {
    this.errorCallback = callback;
    return this;
  }

  open(): PopupSession<TFields, TAction> {
    this.validate();
    const api = getSillyTavernPopupApi();
    const actionByResult = new Map<number, TAction>(
      this.actions.map(action => [action.button.result!, action.key as TAction]),
    );
    const getAction = (result: number | null | undefined): TAction | undefined =>
      typeof result === 'number' ? actionByResult.get(result) : undefined;
    const type = {
      text: api.POPUP_TYPE.TEXT,
      confirm: api.POPUP_TYPE.CONFIRM,
      display: api.POPUP_TYPE.DISPLAY,
    }[this.kindValue];
    let latestContext: PopupLifecycleContext<TFields, TAction> | undefined;
    const createContext = (native: NativePopupInstance): PopupLifecycleContext<TFields, TAction> => ({
      action: getAction(native.result) ?? null,
      fields: readFields<TFields>(native, this.fields),
      native,
    });
    const reportCallbackError = async (
      error: unknown,
      phase: Parameters<PopupErrorCallback<TFields, TAction>>[1],
      context: PopupLifecycleContext<TFields, TAction>,
    ) => {
      if (this.errorCallback) {
        try {
          await this.errorCallback(error, phase, context);
          return;
        } catch (reportingError) {
          console.error(`Popup ${phase} error handler failed.`, reportingError);
        }
      }
      console.error(`Popup ${phase} callback failed.`, error);
    };
    const native = new api.Popup(createPopupContentElement(this.titleValue, this.contentDefinition), type, '', {
      ...this.presentationOptions,
      customButtons: this.actions.map(action => action.button),
      customInputs: this.fields,
      onClosing: async current => {
        latestContext = createContext(current);
        try {
          return (await this.beforeCloseCallback?.(latestContext)) !== false;
        } catch (error) {
          await reportCallbackError(error, 'before-close', latestContext);
          return false;
        }
      },
      onOpen: async current => {
        const context = createContext(current);
        try {
          await this.openCallback?.(context);
        } catch (error) {
          await reportCallbackError(error, 'open', context);
        }
      },
      onClose: async current => {
        latestContext ??= createContext(current);
        try {
          await this.closeCallback?.(latestContext);
        } catch (error) {
          await reportCallbackError(error, 'close', latestContext);
        }
      },
    });
    let isClosed = false;
    let completionPending = false;
    const closed = native
      .show()
      .then(rawResult => {
        const context = latestContext ?? createContext(native);
        const action = getAction(native.result);
        return action === undefined || rawResult === null || rawResult === false
          ? ({ status: 'cancelled', fields: context.fields } as const)
          : ({ status: 'completed', action, fields: context.fields } as const);
      })
      .finally(() => {
        isClosed = true;
      });

    const completeOnce = async (result: number | null) => {
      if (isClosed || completionPending) return;
      completionPending = true;
      try {
        const value = await native.complete(result);
        if (value === undefined) completionPending = false;
      } catch (error) {
        completionPending = false;
        throw error;
      }
    };

    return {
      native,
      closed,
      get isClosed() {
        return isClosed;
      },
      async close(action) {
        const definition = [...actionByResult].find(([, key]) => key === action);
        if (!definition) throw new Error(`Popup action "${action}" is not defined.`);
        await completeOnce(definition[0]);
      },
      async cancel() {
        await completeOnce(api.POPUP_RESULT.CANCELLED);
      },
    };
  }

  show(): Promise<PopupOutcome<TFields, TAction>> {
    return this.open().closed;
  }

  private addField(definition: FieldDefinition): void {
    if (!definition.id.trim()) throw new Error('Popup field name cannot be empty.');
    if (this.fields.some(field => field.id === definition.id)) {
      throw new Error(`Popup field "${definition.id}" is already defined.`);
    }
    const { valueType: _valueType, ...nativeDefinition } = definition;
    this.fields.push({ ...nativeDefinition, valueType: definition.valueType });
  }

  private validate(): void {
    if (this.actions.length > 0 && this.kindValue === 'display') {
      throw new Error('Display popups cannot contain result actions.');
    }
  }
}

export function popup(content?: PopupContent): PopupBuilder {
  return new PopupBuilder(content);
}
