import { useEffect, useState } from 'react';
import { notify } from './notify';
import './panel.css';
import { loadStyleTunerSettings, saveStyleTunerSettings, type StyleTunerSettings } from './settings';
import { applyStyleTuners, STYLE_TUNER_ITEMS } from './styles';
import type { StyleTunerItem } from './types';

export default function SettingsPanel() {
  const [enabled, setEnabled] = useState<StyleTunerSettings>(() => loadStyleTunerSettings());

  // 面板挂载时与开关变化时，都按当前开关表同步一次样式注入状态
  useEffect(() => {
    applyStyleTuners(enabled);
  }, [enabled]);

  const handleToggle = (item: StyleTunerItem, checked: boolean) => {
    const next = { ...enabled, [item.id]: checked };
    setEnabled(next);
    saveStyleTunerSettings(next);
    if (checked) {
      notify('success', `已启用「${item.label}」样式。`);
    } else {
      notify('info', `已停用「${item.label}」样式。`);
    }
  };

  return (
    <div className="styletuner-panel">
      <div className="styletuner-hint">
        开启后，对应样式片段会以独立的 &lt;style&gt; 标签注入到酒馆全局页面；关闭或停用脚本时自动移除。
      </div>
      <div className="styletuner-list">
        {STYLE_TUNER_ITEMS.map(item => (
          <div className="styletuner-item" key={item.id}>
            <label className="styletuner-switch">
              <input
                type="checkbox"
                checked={Boolean(enabled[item.id])}
                onChange={event => handleToggle(item, event.currentTarget.checked)}
              />
              <span className="styletuner-switch-label">{item.label}</span>
            </label>
            {item.description && <div className="styletuner-item-description">{item.description}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
