import { useMemo, useState } from 'react';
import data from './data/anime.json';
import { groupEntries } from './utils/groups';
import StatusTabs from './components/StatusTabs';
import AnimeCard from './components/AnimeCard';

export default function App() {
  const [activeTab, setActiveTab] = useState('All');
  const [query, setQuery] = useState('');

  const allGroups = useMemo(() => groupEntries(data.entries), []);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.entries;
    return data.entries.filter(
      (anime) =>
        anime.title.toLowerCase().includes(q) ||
        anime.titleRomaji.toLowerCase().includes(q)
    );
  }, [query]);

  const visibleGroups = useMemo(() => {
    const grouped = groupEntries(filteredEntries);
    if (activeTab === 'All') return grouped;
    return grouped.filter((g) => g.key === activeTab);
  }, [filteredEntries, activeTab]);

  const fetchedAt = new Date(data.fetchedAt);

  return (
    <>
      <header className="topbar">
        <div className="topbar-titles">
          <h1 className="title-lg">Anime Status</h1>
          <p className="text-meta">{data.username}'s AniList, always up to date</p>
        </div>
        <div className="topbar-nav">
          <div className="topbar-nav-inner">
            <StatusTabs groups={allGroups} activeTab={activeTab} onChange={setActiveTab} />
            <input
              type="search"
              className="topbar-search"
              placeholder="Search titles…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="page">
        <main>
          {visibleGroups.length === 0 && (
            <p className="text-meta empty-state">No anime match your search.</p>
          )}
          {visibleGroups.map((group) => (
            <section key={group.key} className="anime-section">
              <h2 className="section-header">
                {group.key} <span className="count-pill">{group.entries.length}</span>
              </h2>
              <div className="anime-grid">
                {group.entries.map((anime) => (
                  <AnimeCard key={anime.siteUrl} anime={anime} />
                ))}
              </div>
            </section>
          ))}
        </main>

        <footer className="page-footer text-meta">
          Last updated {fetchedAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
        </footer>
      </div>
    </>
  );
}
