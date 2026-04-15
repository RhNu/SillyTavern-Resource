import { useState } from 'react';
import { SETTINGS_TABS, type SettingsTabKey } from './meta';
import BasicSettingsTab from './components/BasicSettingsTab';
import CharacterLibraryTab from './components/CharacterLibraryTab';
import ImageGenerationTab from './components/ImageGenerationTab';
import PromptGenerationTab from './components/PromptGenerationTab';
import PromptTemplateTab from './components/PromptTemplateTab';

export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<SettingsTabKey>('basic');

  const ActiveTabComponent =
    activeTab === 'official'
      ? ImageGenerationTab
      : activeTab === 'independent'
        ? PromptGenerationTab
        : activeTab === 'prompt'
          ? PromptTemplateTab
          : activeTab === 'characters'
            ? CharacterLibraryTab
            : BasicSettingsTab;

  return (
    <div className="imggen-settings">
      <div className="imggen-tab-list" role="tablist" aria-label="图片生成设置分组">
        {SETTINGS_TABS.map(tab => (
          <button
            key={tab.key}
            aria-selected={activeTab === tab.key}
            className={['imggen-tab-button', activeTab === tab.key ? 'is-active' : ''].filter(Boolean).join(' ')}
            role="tab"
            title={tab.description}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="imggen-panel">
        <ActiveTabComponent key={activeTab} />
      </div>
    </div>
  );
}
