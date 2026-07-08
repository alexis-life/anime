import AnimeCard from './AnimeCard';

export default function HighlightRow({ title, entries }) {
  if (entries.length === 0) return null;

  return (
    <section className="highlight-row">
      <h2 className="section-header">{title}</h2>
      <div className="highlight-scroll">
        {entries.map((anime) => (
          <div className="highlight-item" key={anime.siteUrl}>
            <AnimeCard anime={anime} />
          </div>
        ))}
      </div>
    </section>
  );
}
