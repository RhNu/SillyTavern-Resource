import _ from 'lodash';
import { useDataStore } from '../store';
import './InventoryPanel.scss';

function getItemIcon(name: string): string {
  if (name.includes('手机') || name.includes('电话')) return 'PH';
  if (name.includes('钥匙')) return 'KY';
  if (name.includes('钱') || name.includes('币')) return '$$';
  if (name.includes('证') || name.includes('卡')) return 'ID';
  if (name.includes('糖') || name.includes('药')) return 'RX';
  if (name.includes('创可贴') || name.includes('绷带')) return '+';
  return name.substring(0, 2).toUpperCase();
}

export default function InventoryPanel() {
  const data = useDataStore(state => state.data);

  return (
    <div>
      <div className="section-head">物品清单</div>
      {!_.isEmpty(data.主角.物品栏) ? (
        <div className="inventory-grid">
          {Object.entries(data.主角.物品栏).map(([name, item]) => (
            <div key={name} className="item-row">
              <div className="item-icon">{getItemIcon(name)}</div>
              <div className="item-detail">
                <span className="item-name">{name}</span>
                <span className="item-desc">{item.描述}</span>
              </div>
              <span className="item-count">x{item.数量}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">背包空空如也...</div>
      )}
    </div>
  );
}
