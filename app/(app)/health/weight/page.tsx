"use client";

import { useMemo } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { TrendChart } from "@/components/charts/marks";
import { CheckpointList } from "@/components/health/checkpoints";
import { Measurements } from "@/components/health/measurements";
import { inSection, mondayVerdict, usePlan, usePlanItems, useWeights, weeklyAverages } from "@/components/health/plan-data";
import { Callout, SectionTitle } from "@/components/health/plan-items";
import { QuickWeigh } from "@/components/health/quick-weigh";
import { Card, ErrorNote, PageHeader } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove } from "@/lib/data";
import { formatDay, number, shortDay } from "@/lib/format";

export default function ProgressPage() {
  const { data: logs = [], isLoading, error } = useWeights();
  const { plan } = usePlan();
  const { data: items = [] } = usePlanItems();
  const remove = useRemove("weight_logs");

  const latest = logs[logs.length - 1];
  const first = logs[0];
  const change = latest && first ? Number(latest.weight_kg) - Number(first.weight_kg) : 0;
  const weeks = useMemo(() => weeklyAverages(logs), [logs]);
  const review = mondayVerdict(weeks);
  const reviewNotes = inSection(items, "review");
  const target = plan?.target_weight_kg === null || plan?.target_weight_kg === undefined ? null : Number(plan.target_weight_kg);

  // The daily number jumps around, so a seven-entry average runs alongside it.
  const chartData = logs.map((log, index) => {
    const window = logs.slice(Math.max(0, index - 6), index + 1);
    return {
      day: log.logged_on,
      weight: Number(log.weight_kg),
      average: window.reduce((sum, row) => sum + Number(row.weight_kg), 0) / window.length,
      ...(target !== null ? { goal: target } : {}),
    };
  });

  return (
    <>
      <PageHeader title="Progress" subtitle={plan?.title} />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <ChartCard
          title="Weight trend"
          loading={isLoading}
          error={error}
          empty={logs.length < 2}
          emptyHint="Two entries make a line."
          legend={[
            { label: "Weigh-in", color: "var(--health)" },
            { label: "7-entry average", color: "var(--ink)" },
            ...(target !== null ? [{ label: "Goal", color: "var(--ink-3)" }] : []),
          ]}
          table={{ columns: ["Date", "Weight"], rows: logs.map((l) => [shortDay(l.logged_on), `${l.weight_kg} kg`]) }}
        >
          <TrendChart
            data={chartData}
            x="day"
            xFormat={shortDay}
            series={[
              { key: "weight", label: "Weigh-in", color: "var(--health)" },
              { key: "average", label: "7-entry average", color: "var(--ink)" },
              ...(target !== null ? [{ key: "goal", label: "Goal", color: "var(--ink-3)" }] : []),
            ]}
            format={(v) => `${number(v, 1)} kg`}
            axisFormat={(v) => number(v, 1)}
            height={260}
          />
        </ChartCard>

        <div className="space-y-4">
          <Card title="Today">
            <QuickWeigh />
            {latest && (
              <p className="mt-3 text-[13px] text-ink-2">
                Latest {number(latest.weight_kg, 1)} kg
                {logs.length > 1 && ` · ${change > 0 ? "+" : ""}${number(change, 1)} kg since ${formatDay(first!.logged_on)}`}
              </p>
            )}
          </Card>
          <ErrorNote error={error} />
          {logs.length > 0 && (
            <Card title="History">
              <ul className="max-h-72 divide-y divide-line overflow-y-auto">
                {[...logs].reverse().map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                    <span className="text-ink-2">{formatDay(entry.logged_on)}</span>
                    <span className="tabular ml-auto">{number(entry.weight_kg, 1)} kg</span>
                    <RowActions onDelete={() => remove.mutate(entry.id)} deleteTitle="Delete this entry?" />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {plan && (
        <>
          <SectionTitle>Every Monday</SectionTitle>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <Card title="This week's review">
              {review ? (
                <>
                  <p className="figure text-[34px] leading-tight">
                    {review.drop >= 0 ? "−" : "+"}
                    {number(Math.abs(review.drop), 1)}
                    <span className="ml-1 font-sans text-sm tracking-normal text-ink-3">kg on the week before</span>
                  </p>
                  <p className="tabular mt-1 mb-3 text-[13px] text-ink-2">
                    Average {number(review.previous.average, 1)} → {number(review.last.average, 1)} kg
                  </p>
                  <Callout tone={review.verdict.tone}>{review.verdict.text}</Callout>
                </>
              ) : (
                <p className="text-sm leading-relaxed text-ink-2">Needs two full weeks of weigh-ins. Keep logging each morning.</p>
              )}
              {weeks.length > 0 && (
                <ul className="mt-4 divide-y divide-line border-t border-line">
                  {weeks
                    .slice(-6)
                    .reverse()
                    .map((week) => (
                      <li key={week.monday} className="tabular flex justify-between py-2 text-sm">
                        <span className="text-ink-2">Week of {formatDay(week.monday)}</span>
                        <span>
                          {number(week.average, 1)} kg <span className="text-[13px] text-ink-3">({week.count})</span>
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </Card>
            {reviewNotes.length > 0 && (
              <Card title="How to read it">
                <div className="space-y-3 text-sm leading-relaxed text-pretty">
                  {reviewNotes.map((item) => (
                    <div key={item.id}>
                      <p>{item.label}</p>
                      {item.detail && <p className="mt-1 text-ink-2">{item.detail}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <SectionTitle>Checkpoints</SectionTitle>
          <CheckpointList />
        </>
      )}

      <div className="mt-4">
        <Measurements />
      </div>
    </>
  );
}
