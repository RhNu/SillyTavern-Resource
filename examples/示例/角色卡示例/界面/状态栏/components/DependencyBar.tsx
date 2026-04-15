import _ from 'lodash';
import { useDataStore } from '../store';
import './DependencyBar.scss';

export default function DependencyBar() {
  const data = useDataStore(state => state.data);
  const setData = useDataStore(state => state.setData);

  function adjustDependency(delta: number) {
    setData(oldData => {
      const next = _.cloneDeep(oldData);
      next.白娅.依存度 = next.白娅.依存度 + delta;
      return next;
    });
  }

  return (
    <div className="dependency-strip">
      <span className="dependency-label">依存度</span>
      <div className="dependency-track">
        <div className="dependency-fill" style={{ width: `${data.白娅.依存度}%` }}></div>
      </div>
      <span className="dependency-value">{data.白娅.依存度}%</span>
      <div className="dependency-controls">
        <button
          className="dependency-button"
          disabled={data.白娅.依存度 <= 0}
          type="button"
          onClick={() => adjustDependency(-1)}
        >
          -
        </button>
        <button
          className="dependency-button"
          disabled={data.白娅.依存度 >= 100}
          type="button"
          onClick={() => adjustDependency(1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
