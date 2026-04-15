import { useEffect, useState } from 'react';
import './App.scss';
import CharacterPanel from './components/CharacterPanel';
import DependencyBar from './components/DependencyBar';
import InventoryPanel from './components/InventoryPanel';
import TabNav from './components/TabNav';
import WorldSection from './components/WorldSection';

type TabId = '白娅' | '主角' | null;

const tabs = [
  { id: '白娅', label: '角色情报' },
  { id: '主角', label: '持有物品' },
] as const;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem('status_bar:active_tab');
    return saved === '白娅' || saved === '主角' ? saved : null;
  });

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('status_bar:active_tab', activeTab);
    } else {
      localStorage.removeItem('status_bar:active_tab');
    }
  }, [activeTab]);

  return (
    <div className="card">
      <WorldSection />

      <DependencyBar />

      <TabNav tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {activeTab ? (
        <div className="content-area">
          {activeTab === '白娅' ? (
            <div className="tab-pane active">
              <CharacterPanel />
            </div>
          ) : null}
          {activeTab === '主角' ? (
            <div className="tab-pane active">
              <InventoryPanel />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
