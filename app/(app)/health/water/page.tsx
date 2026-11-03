"use client";

import { ChartCard } from "@/components/charts/chart-card";
import { BarsChart } from "@/components/charts/marks";
import { useTargets } from "@/components/health/shared";
import { WaterButtons } from "@/components/health/water-buttons";
import { Card, PageHeader, ProgressBar } from "@/components/ui/primitives";
import { useRows, useRpc } from "@/lib/data";
import { number, shortDay, today } from "@/lib/format";

export default function WaterPage() {
  const { data: logs = [] } = useRows<{ amount_ml: number }>("water_logs", { filters: [["logged_on", "eq", today()]] });
  const { data: targets } = useTargets();
  const { data: daily = [], isLoading, error } = useRpc<{ day: string; amount_ml: number; goal_ml: number }[]>("daily_water", { p_days: 14 });
  const total = logs.reduce((sum, row) => sum + row.amount_ml, 0);
  const goal = targets?.[0]?.water_ml ?? 2500;

  return (
    <>
      <PageHeader title="Water" />
      <Card className="mb-4">
        <p className="figure text-[48px] leading-none">
          {number(Math.max(total, 0))}
          <span className="ml-2 font-sans text-sm tracking-normal text-ink-3">of {number(goal)} ml</span>
        </p>
        <div className="my-4">
          <ProgressBar value={total / goal} color="var(--health)" label="Water today" />
        </div>
        <WaterButtons current={total} />
      </Card>
      <ChartCard
        title="Water intake per day"
        subtitle="Last 14 days"
        loading={isLoading}
        error={error}
        empty={!daily.some((row) => row.amount_ml > 0)}
        emptyHint="Tap a button above to start."
        table={{ columns: ["Day", "Water"], rows: daily.map((r) => [shortDay(r.day), `${number(r.amount_ml)} ml`]) }}
      >
        <BarsChart
          data={daily}
          x="day"
          xFormat={shortDay}
          series={[{ key: "amount_ml", label: "Water", color: "var(--health)" }]}
          format={(v) => `${number(v)} ml`}
          axisFormat={(v) => number(v)}
          target={{ value: goal, label: "Goal" }}
        />
      </ChartCard>
    </>
  );
}
