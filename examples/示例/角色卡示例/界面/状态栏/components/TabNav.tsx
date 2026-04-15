import './TabNav.scss';

type Props<T extends string> = {
  tabs: readonly { id: T; label: string }[];
  value: T | null;
  onChange: (value: T | null) => void;
};

export default function TabNav<T extends string>({ tabs, value, onChange }: Props<T>) {
  function toggleTab(id: T) {
    onChange(value === id ? null : id);
  }

  return (
    <nav className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${value === tab.id ? 'active' : ''}`.trim()}
          aria-expanded={value === tab.id}
          onClick={() => toggleTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
