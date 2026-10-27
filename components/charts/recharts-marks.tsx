"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Datum = Record<string, unknown>;
type Format = (value: number) => string;

const AXIS_TICK = { fill: "var(--ink-3)", fontSize: 11 };
const defaultFormat: Format = (value) => value.toLocaleString("en-IN");

const niceStep = (rough: number, wholeOnly: boolean) => {
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 5, 10].find((m) => m * magnitude >= rough) ?? 10) * magnitude;
  return wholeOnly ? Math.max(1, Math.ceil(step)) : step;
};

// Round gridlines people can read at a glance, rather than whatever divides the maximum.
function niceTicks(low: number, high: number, wholeOnly: boolean, count = 4) {
  if (high <= low) high = low + (wholeOnly ? 1 : Math.abs(low) * 0.1 || 1);
  const step = niceStep((high - low) / count, wholeOnly);
  const first = Math.floor(low / step) * step;
  const last = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  for (let tick = first; tick <= last + step / 2; tick += step) ticks.push(Number(tick.toFixed(6)));
  return ticks;
}

const seriesValues = (data: Datum[], series: Series[]) =>
  data.flatMap((row) => series.map((item) => row[item.key])).filter((value): value is number => typeof value === "number");

export interface Series {
  key: string;
  label: string;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  format,
  labelFormat,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; payload?: Datum }[];
  label?: string | number;
  format: Format;
  labelFormat?: (value: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-card">
      {label !== undefined && <p className="mb-1 text-ink-3">{labelFormat ? labelFormat(String(label)) : label}</p>}
      {payload.map((item) => (
        <p key={item.name} className="flex items-center gap-2">
          <span className="size-2 rounded-[2px]" style={{ background: item.color }} />
          <span className="text-ink-2">{item.name}</span>
          <span className="tabular ml-auto pl-3">{format(Number(item.value ?? 0))}</span>
        </p>
      ))}
    </div>
  );
}

function axes(
  x: string,
  xFormat: ((value: string) => string) | undefined,
  yFormat: Format,
  ticks: number[],
  yWidth = 44,
) {
  return [
    <CartesianGrid key="grid" vertical={false} stroke="var(--line)" />,
    <XAxis
      key="x"
      dataKey={x}
      tick={AXIS_TICK}
      tickLine={false}
      axisLine={{ stroke: "var(--line)" }}
      tickFormatter={xFormat}
      minTickGap={24}
    />,
    <YAxis
      key="y"
      tick={AXIS_TICK}
      tickLine={false}
      axisLine={false}
      width={yWidth}
      tickFormatter={yFormat}
      ticks={ticks}
      domain={[ticks[0]!, ticks[ticks.length - 1]!]}
      interval={0}
    />,
  ];
}

export function BarsChart({
  data,
  x,
  series,
  stacked,
  height = 220,
  format = defaultFormat,
  axisFormat,
  xFormat,
  target,
}: {
  data: Datum[];
  x: string;
  series: Series[];
  stacked?: boolean;
  height?: number;
  format?: Format;
  axisFormat?: Format;
  xFormat?: (value: string) => string;
  target?: { value: number; label: string };
}) {
  const values = stacked
    ? data.map((row) => series.reduce((sum, item) => sum + (Number(row[item.key]) || 0), 0))
    : seriesValues(data, series);
  const ticks = niceTicks(0, Math.max(0, target?.value ?? 0, ...values), values.every(Number.isInteger));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barCategoryGap="32%" barGap={2}>
        {axes(x, xFormat, axisFormat ?? format, ticks)}
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          content={<ChartTooltip format={format} labelFormat={xFormat} />}
        />
        {target && (
          <ReferenceLine
            y={target.value}
            stroke="var(--ink-2)"
            strokeDasharray="4 4"
            label={{ value: target.label, position: "insideTopRight", fill: "var(--ink-2)", fontSize: 11 }}
          />
        )}
        {series.map((item, index) => (
          <Bar
            key={item.key}
            dataKey={item.key}
            name={item.label}
            fill={item.color}
            stackId={stacked ? "stack" : undefined}
            radius={!stacked || index === series.length - 1 ? [4, 4, 0, 0] : 0}
            stroke={stacked ? "var(--surface)" : undefined}
            strokeWidth={stacked ? 2 : 0}
            maxBarSize={28}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({
  data,
  x,
  series,
  height = 220,
  format = defaultFormat,
  axisFormat,
  xFormat,
  domain,
  connectNulls = false,
  yTicks,
  yWidth,
  dots = false,
}: {
  data: Datum[];
  x: string;
  series: Series[];
  height?: number;
  format?: Format;
  axisFormat?: Format;
  xFormat?: (value: string) => string;
  // A fixed scale, such as 0 to 100 percent. Without one the axis hugs the data.
  domain?: [number, number];
  connectNulls?: boolean;
  yTicks?: number[];
  yWidth?: number;
  // For sparse or ordinal data, where each point is an actual reading.
  dots?: boolean;
}) {
  const values = seriesValues(data, series);
  const ticks =
    yTicks ??
    (domain
      ? niceTicks(domain[0], domain[1], true)
      : niceTicks(Math.min(...values, Infinity), Math.max(...values, -Infinity), values.every(Number.isInteger)));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        {axes(x, xFormat, axisFormat ?? format, ticks, yWidth)}
        <Tooltip
          cursor={{ stroke: "var(--line-2)" }}
          content={<ChartTooltip format={format} labelFormat={xFormat} />}
        />
        {series.map((item) => (
          <Line
            key={item.key}
            type={dots ? "linear" : "monotone"}
            dataKey={item.key}
            name={item.label}
            stroke={item.color}
            strokeWidth={dots ? 1.5 : 2}
            dot={dots ? { r: 3.5, fill: item.color, stroke: "var(--surface)", strokeWidth: 1.5 } : false}
            activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
            connectNulls={connectNulls}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaTrendChart({
  data,
  x,
  series,
  height = 240,
  format = defaultFormat,
  axisFormat,
  xFormat,
}: {
  data: Datum[];
  x: string;
  series: Series;
  height?: number;
  format?: Format;
  axisFormat?: Format;
  xFormat?: (value: string) => string;
}) {
  const id = `area-${series.key}`;
  const values = seriesValues(data, [series]);
  const ticks = niceTicks(0, Math.max(0, ...values), values.every(Number.isInteger));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={series.color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={series.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {axes(x, xFormat, axisFormat ?? format, ticks)}
        <Tooltip
          cursor={{ stroke: "var(--line-2)" }}
          content={<ChartTooltip format={format} labelFormat={xFormat} />}
        />
        <Area
          type="monotone"
          dataKey={series.key}
          name={series.label}
          stroke={series.color}
          strokeWidth={2}
          fill={`url(#${id})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  height = 220,
  format = defaultFormat,
  center,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
  format?: Format;
  center?: React.ReactNode;
}) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip format={format} />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={data.length > 1 ? 1.5 : 0}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {center && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {center}
        </div>
      )}
    </div>
  );
}
