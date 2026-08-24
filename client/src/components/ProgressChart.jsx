const WIDTH = 320;
const HEIGHT = 170;
const PAD_X = 12;
const PAD_TOP = 14;
const PAD_BOTTOM = 24;

const LINES = [
  { key: "nutritionScore", color: "#a855f7", label: "Nutrition Score" },
  { key: "moneySaved", color: "#22c55e", label: "Money Saved" },
  { key: "workoutsCompleted", color: "#3b82f6", label: "Workouts Completed" },
];

function buildPoints(series, key) {
  const values = series.map((point) => Number(point[key]) || 0);
  const max = Math.max(...values, 1);
  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const step = series.length > 1 ? plotWidth / (series.length - 1) : 0;

  return values.map((value, idx) => {
    const x = PAD_X + step * idx;
    const ratio = value / max;
    const y = PAD_TOP + plotHeight * (1 - ratio);
    return { x, y, value };
  });
}

export default function ProgressChart({ series }) {
  if (!series || series.length === 0) {
    return (
      <div className="flex h-[170px] items-center justify-center text-xs text-white/30">
        No data yet — scan a meal or complete a workout to see your trends.
      </div>
    );
  }

  const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) * t);
  const tickIndexes = pickTickIndexes(series.length);

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Progress over time">
        {gridY.map((y, idx) => (
          <line key={idx} x1={PAD_X} x2={WIDTH - PAD_X} y1={y} y2={y} stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1" />
        ))}

        {tickIndexes.map((idx) => {
          const point = series[idx];
          const x = PAD_X + (WIDTH - PAD_X * 2) * (series.length > 1 ? idx / (series.length - 1) : 0);
          return (
            <text key={idx} x={x} y={HEIGHT - 6} fontSize="7" textAnchor="middle" fill="#ffffff66">
              {formatDay(point.day)}
            </text>
          );
        })}

        {LINES.map((line) => {
          const points = buildPoints(series, line.key);
          const path = points.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
          return (
            <g key={line.key}>
              <path d={path} fill="none" stroke={line.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((p, idx) => (
                <circle key={idx} cx={p.x} cy={p.y} r="2.1" fill={line.color} />
              ))}
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {LINES.map((line) => (
          <div key={line.key} className="flex items-center gap-1.5 text-[10px] text-white/50">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: line.color }} />
            {line.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function pickTickIndexes(length) {
  if (length <= 5) return Array.from({ length }, (_, i) => i);
  const step = Math.ceil(length / 5);
  const indexes = [];
  for (let i = 0; i < length; i += step) indexes.push(i);
  if (indexes[indexes.length - 1] !== length - 1) indexes.push(length - 1);
  return indexes;
}

function formatDay(isoDay) {
  const date = new Date(`${isoDay}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDay;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}
