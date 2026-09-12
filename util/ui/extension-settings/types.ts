export type ExtensionSettingsSection = 'auto' | 'primary' | 'secondary';
export type ResolvedExtensionSettingsSection = Exclude<ExtensionSettingsSection, 'auto'>;

export type ExtensionSettingsHostOptions = {
  section?: ExtensionSettingsSection;
  id?: string;
  className?: string;
  attributes?: Record<string, string>;
  scriptId?: string;
  document?: Document;
  onMountChange?: (mounted: boolean) => void;
};

export type ExtensionSettingsHostSession = {
  readonly element: HTMLDivElement;
  readonly section: ResolvedExtensionSettingsSection;
  readonly mounted: boolean;
  mount(): boolean;
  destroy(): void;
};
