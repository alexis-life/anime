import BarChart from './charts/BarChart';
import RankedBarList from './charts/RankedBarList';
import LineChart from './charts/LineChart';
import ScoreBarList from './charts/ScoreBarList';
import {
  scoreDistribution,
  episodeCountDistribution,
  formatDistribution,
  statusDistribution,
  watchYearDistribution,
  meanScoreByGenre,
} from '../utils/stats';

export default function StatsSection({ entries }) {
  const score = scoreDistribution(entries);
  const episodes = episodeCountDistribution(entries);
  const format = formatDistribution(entries);
  const status = statusDistribution(entries);
  const watchYear = watchYearDistribution(entries);
  const genreScores = meanScoreByGenre(entries);

  return (
    <section className="stats-section">
      <h2 className="section-header">Stats</h2>
      <div className="stats-grid">
        <div className="stats-card">
          <h3 className="stats-card-title">Score Distribution</h3>
          <BarChart data={score} />
        </div>
        <div className="stats-card">
          <h3 className="stats-card-title">Episode Count</h3>
          <BarChart data={episodes} />
        </div>
        {watchYear.length > 0 && (
          <div className="stats-card">
            <h3 className="stats-card-title">Watch Year</h3>
            <LineChart data={watchYear} />
          </div>
        )}
        <div className="stats-card">
          <h3 className="stats-card-title">Status</h3>
          <RankedBarList data={status} />
        </div>
        <div className="stats-card">
          <h3 className="stats-card-title">Format</h3>
          <RankedBarList data={format} />
        </div>
        {genreScores.length > 0 && (
          <div className="stats-card">
            <h3 className="stats-card-title">Mean Score by Genre</h3>
            <ScoreBarList data={genreScores} />
          </div>
        )}
      </div>
    </section>
  );
}
