import _ from 'lodash';
import { useDataStore } from '../store';
import './CharacterPanel.scss';

export default function CharacterPanel() {
  const data = useDataStore(state => state.data);

  return (
    <div className="char-layout">
      <div className="section-head">{data.白娅.$依存度阶段}</div>
      <div className="title-grid">
        {Object.entries(data.白娅.称号).map(([name, title]) => (
          <div key={name} className="title-box">
            <span className="title-name">{name}</span>
            <div className="title-effect">{title.效果}</div>
            <div className="title-quote">"{title.自我评价}"</div>
          </div>
        ))}
        {_.isEmpty(data.白娅.称号) ? (
          <div className="title-box">
            <span className="title-name">无称号</span>
            <div className="title-effect">当前没有生效的称号</div>
            <div className="title-quote">"..."</div>
          </div>
        ) : null}
      </div>

      <div className="section-head">着装记录</div>
      <div className="attire-list">
        {Object.entries(data.白娅.着装).map(([slot, description]) => (
          <div key={slot} className="attire-item">
            <span className="attire-slot">【{slot}】</span>
            {description}
          </div>
        ))}
      </div>
    </div>
  );
}
