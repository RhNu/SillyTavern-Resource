type ExtensionSettingDrawerProps = {
  children: React.ReactNode;
  title: string;
};

export function ExtensionSettingDrawer({ children, title }: ExtensionSettingDrawerProps) {
  return (
    <div>
      <div className="inline-drawer">
        <div className="inline-drawer-toggle inline-drawer-header">
          <b>{title}</b>
          <div className="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div className="inline-drawer-content">{children}</div>
      </div>
    </div>
  );
}
