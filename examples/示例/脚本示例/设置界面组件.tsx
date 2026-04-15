import type { ChangeEvent } from 'react';
import { useSettingsStore } from './settings';

export default function SettingsPanel() {
  const settings = useSettingsStore(state => state.settings);
  const setSettings = useSettingsStore(state => state.setSettings);

  const handleButtonClick = () => {
    toastr.success('你好呀!');
  };

  const onCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.currentTarget.checked;
    setSettings(old => ({ ...old, button_selected: checked }));
  };

  return (
    <div className="example-extension-settings">
      <div className="inline-drawer">
        <div className="inline-drawer-toggle inline-drawer-header">
          <b>脚本示例</b>
          <div className="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div className="inline-drawer-content">
          <div className="example-extension_block flex-container">
            <input className="menu_button" type="submit" value="示例按钮" onClick={handleButtonClick} />
          </div>

          <div className="example-extension_block flex-container">
            <input checked={settings.button_selected} type="checkbox" onChange={onCheckboxChange} />
            <label htmlFor="example_setting">示例开关</label>
          </div>

          <hr className="sysHR" />
        </div>
      </div>
    </div>
  );
}
