import { useId, useRef, useState } from 'react';

const WIDTH = 600;
const HEIGHT = 140;
const PAD_X = 12;
const PAD_Y = 14;

// Single-series trend over time — one hue, crosshair + tooltip on hover
// (the pointer only has to be close on the X axis, not dead-center).
export default function LineChart({ data }) {
  const gradientId = useId();
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.count));

  const plotW = WIDTH - PAD_X * 2;
  const plotH = HEIGHT - PAD_Y * 2;
  const stepX = data.length > 1 ? plotW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    ...d,
    x: PAD_X + i * stepX,
    y: PAD_Y + plotH - (d.count / max) * plotH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  function updateHoverFromClientX(clientX) {
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="line-chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="line-chart-svg"
        role="img"
        aria-label="Titles completed per year"
        onMouseMove={(e) => updateHoverFromClientX(e.clientX)}
        onMouseLeave={() => setHoverIndex(null)}
        onTouchMove={(e) => updateHoverFromClientX(e.touches[0].clientX)}
        onTouchEnd={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--c3)" />
            <stop offset="100%" stopColor="var(--c5)" />
          </linearGradient>
        </defs>
        <line
          x1={PAD_X}
          y1={PAD_Y + plotH}
          x2={WIDTH - PAD_X}
          y2={PAD_Y + plotH}
          className="line-chart-baseline"
        />
        {hovered && (
          <line
            x1={hovered.x}
            y1={PAD_Y}
            x2={hovered.x}
            y2={PAD_Y + plotH}
            className="line-chart-crosshair"
          />
        )}
        <path d={pathD} className="line-chart-path" fill="none" stroke={`url(#${gradientId})`} />
        {points.map((p, i) => (
          <circle
            key={p.label}
            cx={p.x}
            cy={p.y}
            r={hoverIndex === i ? 5 : 4}
            className="line-chart-dot"
            fill={`url(#${gradientId})`}
          />
        ))}
      </svg>
      <div className="line-chart-labels">
        {points.map((p) => (
          <span key={p.label} className="line-chart-label">{p.label}</span>
        ))}
      </div>
      {hovered && (
        <div className="line-chart-tooltip" style={{ left: `${(hovered.x / WIDTH) * 100}%` }}>
          <strong>{hovered.count}</strong> <span>{hovered.label}</span>
        </div>
      )}
    </div>
  );
}
