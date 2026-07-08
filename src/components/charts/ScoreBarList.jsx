// Same visual language as RankedBarList, but the bar encodes an absolute
// 0-100 score rather than a share of a total — genre name is the identity
// channel, the bar length and the printed value both read as "how good".
export default function ScoreBarList({ data }) {
  return (
    <div className="ranked-bar-list">
      {data.map((d) => (
        <div className="ranked-bar-row" key={d.label}>
          <span className="ranked-bar-label">{d.label}</span>
          <div className="ranked-bar-track">
            <div className="ranked-bar-fill" style={{ width: `${d.meanScore}%` }} />
          </div>
          <span className="ranked-bar-count">{d.meanScore.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}
