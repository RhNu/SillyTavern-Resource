import { mountExtensionMenuItem } from './menu';
import type { ExtensionMenuItemOptions, ExtensionMenuPredicate, ExtensionMenuSession } from './types';

type BuilderOptions = Pick<ExtensionMenuItemOptions, 'id'> &
  Omit<ExtensionMenuItemOptions, 'id' | 'label' | 'iconClass' | 'onClick'> &
  Partial<Pick<ExtensionMenuItemOptions, 'label' | 'iconClass' | 'onClick'>>;

export class ExtensionMenuItemBuilder<THasClickHandler extends boolean = false> {
  declare private readonly typeState: { hasClickHandler: THasClickHandler };
  private readonly options: BuilderOptions;

  constructor(id: string) {
    this.options = { id } as BuilderOptions;
  }

  label(label: string): this {
    this.options.label = label;
    return this;
  }

  title(title: string): this {
    this.options.title = title;
    return this;
  }

  icon(iconClass: string): this {
    this.options.iconClass = iconClass;
    return this;
  }

  containerId(containerId: string): this {
    this.options.containerId = containerId;
    return this;
  }

  classNames(...classNames: string[]): this {
    this.options.classNames = classNames;
    return this;
  }

  visibleWhen(predicate: ExtensionMenuPredicate): this {
    this.options.visible = predicate;
    return this;
  }

  enabledWhen(predicate: ExtensionMenuPredicate): this {
    this.options.enabled = predicate;
    return this;
  }

  onError(callback: NonNullable<ExtensionMenuItemOptions['onError']>): this {
    this.options.onError = callback;
    return this;
  }

  onMountChange(callback: NonNullable<ExtensionMenuItemOptions['onMountChange']>): this {
    this.options.onMountChange = callback;
    return this;
  }

  onClick(callback: ExtensionMenuItemOptions['onClick']): ExtensionMenuItemBuilder<true> {
    this.options.onClick = callback;
    return this as unknown as ExtensionMenuItemBuilder<true>;
  }

  mount(this: ExtensionMenuItemBuilder<true>): ExtensionMenuSession {
    const { label, iconClass, onClick, ...options } = this.options;
    if (!label || !iconClass || !onClick) {
      throw new Error('Extension menu item requires label, icon, and click handler before mounting.');
    }
    return mountExtensionMenuItem({ ...options, label, iconClass, onClick });
  }
}

export function extensionMenuItem(id: string): ExtensionMenuItemBuilder {
  return new ExtensionMenuItemBuilder(id);
}
