// Small hand-drawn charts for the landing page. The real app uses live data
// through components/charts; these stay light so the first paint stays fast.

export function Donut({
  segments,
  size = 120,
  thickness = 22,
  gap = 0,
  children,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
  gap?: number;
  children?: React.ReactNode;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label="Donut chart">
        {segments.map((segment, index) => {
          const length = (segment.value / total) * circumference;
          const circle = (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(length - gap, 0)} ${circumference - length + gap}`}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return circle;
        })}
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

export function MoodLine({
  path,
  width = 360,
  height = 40,
  className = "",
  animate = false,
}: {
  path: string;
  width?: number;
  height?: number;
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} fill="none" aria-hidden>
      <path
        d={path}
        stroke="var(--diary)"
        strokeWidth="2"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={animate ? 1 : undefined}
        style={animate ? { animation: "draw 1.4s var(--ease-out-soft) both" } : undefined}
      />
    </svg>
  );
}

export function WeekBars() {
  // Late completions stacked on top of on-time ones, four weeks.
  const weeks = [
    { onTime: 40, late: 13 },
    { onTime: 60, late: 12 },
    { onTime: 29, late: 20 },
    { onTime: 80, late: 9 },
  ];
  return (
    <div className="flex h-[90px] items-end gap-3" role="img" aria-label="On-time completions growing week by week">
      {weeks.map((week, index) => (
        <div key={index} className="flex flex-1 flex-col justify-end">
          <div style={{ height: week.late }} className="bg-planner/30" />
          <div style={{ height: week.onTime }} className="bg-planner" />
        </div>
      ))}
    </div>
  );
}

const HEAT = [0.12, 0.2, 0.9, 0.3, 0.14, 0.72, 0.34, 0.15, 0.92, 0.28, 0.2, 0.62];

export function HeatStrip() {
  return (
    <div className="grid grid-cols-12 gap-1" role="img" aria-label="Meals cluster around three times of day">
      {HEAT.map((level, index) => (
        <div
          key={index}
          className="h-7 rounded-[3px]"
          style={{ background: `color-mix(in srgb, #d97706 ${Math.round(level * 95)}%, transparent)` }}
        />
      ))}
    </div>
  );
}
