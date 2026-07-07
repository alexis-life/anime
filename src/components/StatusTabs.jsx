export default function StatusTabs({ groups, activeTab, onChange }) {
  const tabs = [{ key: 'All', count: groups.reduce((sum, g) => sum + g.entries.length, 0) }, ...groups.map((g) => ({ key: g.key, count: g.entries.length }))];

  return (
    <div className="status-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`status-tab ${activeTab === tab.key ? 'is-active' : ''}`}
          onClick={() => onChange(tab.key)}
          type="button"
        >
          {tab.key}
          <span className="count-pill">{tab.count}</span>
        </button>
      ))}
    </div>
  );
}
