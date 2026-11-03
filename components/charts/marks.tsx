"use client";

import dynamic from "next/dynamic";
import type { ComponentProps, ComponentType } from "react";
import type { AreaTrendChart as Area, BarsChart as Bars, DonutChart as Donut, TrendChart as Trend } from "./recharts-marks";

// Recharts is the heaviest thing in the app and never part of first paint, so each
// chart loads it on demand, holding its height so nothing below moves when it lands.
const shell = () => <div className="skeleton absolute inset-0" aria-busy />;

const LazyBars = dynamic(() => import("./recharts-marks").then((m) => m.BarsChart), { ssr: false, loading: shell });
const LazyTrend = dynamic(() => import("./recharts-marks").then((m) => m.TrendChart), { ssr: false, loading: shell });
const LazyArea = dynamic(() => import("./recharts-marks").then((m) => m.AreaTrendChart), { ssr: false, loading: shell });
const LazyDonut = dynamic(() => import("./recharts-marks").then((m) => m.DonutChart), { ssr: false, loading: shell });

function held<P extends { height?: number }>(Chart: ComponentType<P>, fallback: number) {
  return function HeldChart(props: P) {
    return (
      <div className="relative min-w-0" style={{ minHeight: props.height ?? fallback }}>
        <Chart {...props} />
      </div>
    );
  };
}

export const BarsChart = held(LazyBars as ComponentType<ComponentProps<typeof Bars>>, 220);
export const TrendChart = held(LazyTrend as ComponentType<ComponentProps<typeof Trend>>, 220);
export const AreaTrendChart = held(LazyArea as ComponentType<ComponentProps<typeof Area>>, 240);
export const DonutChart = held(LazyDonut as ComponentType<ComponentProps<typeof Donut>>, 220);

// A single-hue strip where darker means more. Used for meal timing.
export function HeatStripChart({
  data,
  color = "var(--health)",
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
