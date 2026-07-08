// Rotating palette for the genre bar segments — reuses the shared theme's
// rose scale so it stays on-brand regardless of AniList's own genre colors.
const GENRE_COLORS = ['var(--c6)', 'var(--c4)', 'var(--c5)', 'var(--c3)', 'var(--c7)', 'var(--c2)'];

function StatCard({ label, value, sub }) {
  return (
    <div className="profile-stat-card">
      <span className="profile-stat-value">{value}</span>
      <span className="profile-stat-label">{label}</span>
      {sub && <span className="profile-stat-sub">{sub}</span>}
    </div>
  );
}

function GenreBar({ genres }) {
  if (!genres || genres.length === 0) return null;
  const top = genres.slice(0, 6);
  const total = top.reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="genre-overview">
      <div className="genre-bar">
        {top.map((g, i) => (
          <div
            key={g.genre}
            className="genre-bar-segment"
            style={{ width: `${(g.count / total) * 100}%`, background: GENRE_COLORS[i % GENRE_COLORS.length] }}
            title={`${g.genre}: ${g.count}`}
          />
        ))}
      </div>
      <div className="genre-legend">
        {top.map((g, i) => (
          <div key={g.genre} className="genre-legend-item">
            <span className="genre-legend-dot" style={{ background: GENRE_COLORS[i % GENRE_COLORS.length] }} />
            <span className="genre-legend-name">{g.genre}</span>
            <span className="genre-legend-count">{g.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileHeader({ profile }) {
  if (!profile) return null;
  const { name, avatar, banner, anime, manga } = profile;

  return (
    <section className="profile-header">
      {banner && (
        <div className="profile-banner" style={{ backgroundImage: `url(${banner})` }} />
      )}
      <div className="profile-content">
        <div className="profile-identity">
          {avatar && <img className="profile-avatar" src={avatar} alt={name} />}
          <span className="profile-name">{name}</span>
        </div>

        <div className="profile-overlay">
          <div className="profile-stats-grid">
            <StatCard label="Total Anime" value={anime.count} />
            <StatCard label="Days Watched" value={anime.daysWatched} />
            <StatCard label="Anime Mean Score" value={anime.meanScore} />
            <StatCard label="Total Manga" value={manga.count} />
            <StatCard label="Chapters Read" value={manga.chaptersRead} />
            <StatCard label="Manga Mean Score" value={manga.meanScore} />
          </div>

          <GenreBar genres={anime.genres} />
        </div>
      </div>
    </section>
  );
}
