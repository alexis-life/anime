import { useState } from 'react';

export default function AnimeCard({ anime }) {
  const [active, setActive] = useState(false);
  const hasScore = typeof anime.scorePercent === 'number' && anime.scorePercent > 0;
  const displayScore = hasScore ? (anime.scorePercent / 10).toFixed(1) : null;
  const hasProgress = anime.episodes ? `${anime.progress} / ${anime.episodes} eps` : `${anime.progress} eps`;

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
        <div className={`anime-card-overlay ${active ? 'is-active' : ''}`}>
          {hasScore && <span className="anime-card-score">★ {displayScore}</span>}
          <span className="anime-card-progress">{hasProgress}</span>
        </div>
      </div>
      <p className="anime-card-title" title={anime.title}>{anime.title}</p>
    </a>
  );
}
