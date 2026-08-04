import { useState } from 'react';

export default function RecommendedCard({ anime }) {
  const [active, setActive] = useState(false);
  const badge = anime.status === 'RELEASING' ? 'Airing' : anime.airDate ? `Premieres ${anime.airDate}` : 'Upcoming';

  return (
    <a
      className="anime-card"
      href={anime.siteUrl}
      target="_blank"
      rel="noreferrer"
      style={{ '--accent': anime.coverColor || 'var(--c4)' }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onTouchStart={() => setActive((prev) => !prev)}
    >
      <div className="anime-card-cover">
        <img src={anime.coverImage} alt={anime.title} loading="lazy" decoding="async" />
        <span className={`recommended-badge ${anime.status === 'RELEASING' ? 'is-airing' : ''}`}>{badge}</span>
        <div className={`anime-card-overlay ${active ? 'is-active' : ''}`}>
          <span className="recommended-reason">{anime.reason}</span>
        </div>
      </div>
      <p className="anime-card-title" title={anime.title}>{anime.title}</p>
    </a>
  );
}
