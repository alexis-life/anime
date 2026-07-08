// Horizontal ranked bars, single hue — each row's text label is the identity
// channel, so color never has to distinguish categories from one another.
export default function RankedBarList({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="ranked-bar-list">
      {data.map((d) => (
        <div className="ranked-bar-row" key={d.label}>
          <span className="ranked-bar-label">{d.label}</span>
          <div className="ranked-bar-track">
            <div className="ranked-bar-fill" style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
          <span className="ranked-bar-count">{d.count}</span>
        </div>
      ))}
    </div>
  );
}
