import RecommendedCard from './RecommendedCard';

export default function RecommendedSection({ recommendations }) {
  const { items, basedOn, generatedAt } = recommendations;

  if (!generatedAt || items.length === 0) {
    return (
      <p className="text-meta empty-state">
        No recommendations yet — these are picked during the daily build, check back after the next run.
      </p>
    );
  }

  return (
    <section className="anime-section">
      <div className="recommended-banner">
        <div>
          <h2 className="section-header">Recommended for you</h2>
          {basedOn.length > 0 && (
            <p className="text-meta recommended-banner-sub">
              Based on {basedOn.slice(0, 2).join(', ')}
              {basedOn.length > 2 ? `, and ${basedOn.length - 2} more` : ''} — excludes anything on your Watching or Completed lists.
            </p>
          )}
        </div>
      </div>
      <div className="anime-grid">
        {items.map((anime) => (
          <RecommendedCard key={anime.siteUrl} anime={anime} />
        ))}
      </div>
    </section>
  );
}
