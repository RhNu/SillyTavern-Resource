import type { ReactNode } from 'react';

export type ExtensionSettingDrawerProps = {
  children: ReactNode;
  title: string;
  className?: string;
  defaultOpen?: boolean;
};

export function ExtensionSettingDrawer({
  children,
  title,
  className,
  defaultOpen = false,
}: ExtensionSettingDrawerProps) {
  const iconClassName = defaultOpen
    ? 'inline-drawer-icon fa-solid fa-circle-chevron-up up'
    : 'inline-drawer-icon fa-solid fa-circle-chevron-down down';
  return (
    <div className={className}>
      <div className="inline-drawer">
        <div className="inline-drawer-toggle inline-drawer-header">
          <b>{title}</b>
          <div className={iconClassName}></div>
        </div>
        <div className="inline-drawer-content" style={defaultOpen ? { display: 'block' } : undefined}>
          {children}
        </div>
      </div>
    </div>
  );
}
