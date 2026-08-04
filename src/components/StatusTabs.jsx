export default function StatusTabs({ groups, activeTab, onChange, recommendedCount }) {
  const tabs = [{ key: 'Overview', count: groups.reduce((sum, g) => sum + g.entries.length, 0) }, ...groups.map((g) => ({ key: g.key, count: g.entries.length }))];

  return (
    <nav className="nav-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`nav-tab ${activeTab === tab.key ? 'is-active' : ''}`}
          onClick={() => onChange(tab.key)}
          type="button"
        >
          {tab.key} <span className="nav-tab-count">{tab.count}</span>
        </button>
      ))}
      {typeof recommendedCount === 'number' && (
        <button
          className={`nav-tab is-recommended ${activeTab === 'Recommended' ? 'is-active' : ''}`}
          onClick={() => onChange('Recommended')}
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
          </svg>
          Recommended <span className="nav-tab-count">{recommendedCount}</span>
        </button>
      )}
    </nav>
  );
}
