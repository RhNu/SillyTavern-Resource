import _ from 'lodash';
import { useMemo } from 'react';
import { useDataStore } from '../store';
import './WorldSection.scss';

export default function WorldSection() {
  const data = useDataStore(state => state.data);

  const formattedDate = useMemo(() => {
    const match = data.世界.当前时间.match(/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : data.世界.当前时间.split(' ')[0] || '未知';
  }, [data.世界.当前时间]);

  const formattedTime = useMemo(() => {
    const match = data.世界.当前时间.match(/(\d{2}:\d{2})/);
    return match ? match[1] : data.世界.当前时间.split(' ')[1] || '未知';
  }, [data.世界.当前时间]);

  return (
    <div className="world-section">
      <div className="meta-row">
        <span>DATE: {formattedDate}</span>
        <span>TIME: {formattedTime}</span>
        <span>LOC: {data.世界.当前地点}</span>
      </div>
      <div className="event-list">
        {Object.entries(data.世界.近期事务).map(([name, description]) => (
          <div key={name} className="event-badge">
            <span className="event-title">{name}</span>
            <span className="event-desc">{description}</span>
          </div>
        ))}
        {_.isEmpty(data.世界.近期事务) ? (
          <div className="event-badge">
            <span className="event-title">暂无事务</span>
            <span className="event-desc">当前没有进行中的事务</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
