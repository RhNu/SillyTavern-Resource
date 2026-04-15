import './搜索框.scss';

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
};

export default function SearchBar({ query, onQueryChange }: Props) {
  return (
    <div className="StreamingMessage__searchBar" onClick={event => event.stopPropagation()}>
      <div className="StreamingMessage__searchInner">
        <div className="StreamingMessage__searchPill" aria-hidden="true">
          高亮
        </div>
        <input
          value={query}
          type="text"
          className="text_pole StreamingMessage__searchInput"
          placeholder="输入关键词以高亮本楼层内容"
          onClick={event => event.stopPropagation()}
          onChange={event => onQueryChange(event.currentTarget.value)}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              onQueryChange('');
            }
          }}
        />
        {query ? (
          <button
            type="button"
            className="StreamingMessage__clearBtn"
            onClick={event => {
              event.stopPropagation();
              onQueryChange('');
            }}
          >
            清除
          </button>
        ) : null}
      </div>
    </div>
  );
}
