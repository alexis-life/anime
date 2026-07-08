import { useState } from 'react';
import { interpolateHex } from '../../utils/color';

// Ordinal color job: one hue, monotone lightness steps by bucket position —
// theme.css's c3 (soft pink) -> c5 (vibrant rose) ramp, light to dark. Shared
// endpoints with the other chart types (ranked bars, line chart).
const RAMP_START = '#ff9ebb';
const RAMP_END = '#e05780';

// Single-hue sequential bar chart (magnitude by ordinal bucket) — one series,
// so no legend is needed; the card title already names what's plotted.
export default function BarChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="bar-chart">
      {data.map((d, i) => {
        const t = data.length > 1 ? i / (data.length - 1) : 0;
        const color = interpolateHex(RAMP_START, RAMP_END, t);
        return (
          <div
            key={d.label}
            className="bar-chart-col"
            tabIndex={0}
            role="img"
            aria-label={`${d.label}: ${d.count}`}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            onFocus={() => setHoverIndex(i)}
            onBlur={() => setHoverIndex(null)}
          >
            {hoverIndex === i && (
              <div className="bar-chart-tooltip">
                <strong>{d.count}</strong> <span>{d.label}</span>
              </div>
            )}
            <div
              className="bar-chart-bar"
              style={{ height: `${(d.count / max) * 100}%`, background: color }}
            />
            <span className="bar-chart-label">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
