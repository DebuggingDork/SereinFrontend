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

function axes(x: string, xFormat: ((value: string) => string) | undefined, yFormat: Format, hideY = false) {
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
      hide={hideY}
      tick={AXIS_TICK}
      tickLine={false}
      axisLine={false}
      width={44}
      tickFormatter={yFormat}
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
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barCategoryGap="24%" barGap={2}>
        {axes(x, xFormat, axisFormat ?? format)}
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
            strokeWidth={stacked ? 1 : 0}
            maxBarSize={36}
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
}: {
  data: Datum[];
  x: string;
  series: Series[];
  height?: number;
  format?: Format;
  axisFormat?: Format;
  xFormat?: (value: string) => string;
  domain?: [number | "auto", number | "auto"];
  connectNulls?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        {axes(x, xFormat, axisFormat ?? format)}
        {domain && <YAxis hide domain={domain} />}
        <Tooltip
          cursor={{ stroke: "var(--line-2)" }}
          content={<ChartTooltip format={format} labelFormat={xFormat} />}
        />
        {series.map((item) => (
          <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.label}
            stroke={item.color}
            strokeWidth={2}
            dot={false}
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
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={series.color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={series.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {axes(x, xFormat, axisFormat ?? format)}
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

// A single-hue strip where darker means more. Used for meal timing.
export function HeatStripChart({
  data,
  color = "var(--diet)",
  format,
}: {
  data: { label: string; value: number }[];
  color?: string;
  format: (value: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
        role="img"
        aria-label="Meal timing heat strip"
      >
        {data.map((item) => (
          <div
            key={item.label}
            title={`${item.label}: ${format(item.value)}`}
            className="h-10 rounded-[3px] bg-surface-2"
            style={
              item.value
                ? { background: `color-mix(in srgb, ${color} ${Math.round(18 + (item.value / max) * 82)}%, transparent)` }
                : undefined
            }
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-3">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
