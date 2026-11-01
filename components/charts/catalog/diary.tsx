"use client";

import { ChartCard } from "@/components/charts/chart-card";
import { BarsChart, TrendChart } from "@/components/charts/marks";
import { MOOD_LABEL, type Mood } from "@/components/diary/shared";
import { useRpc } from "@/lib/data";
import { shortDay } from "@/lib/format";

interface ChartProps {
  className?: string;
}

const SCORE_LABEL: Record<number, string> = { 1: "Low", 2: "Tired", 3: "Restless", 4: "Settled", 5: "Bright" };

export function MoodOverTimeChart({ className }: ChartProps) {
  const series = useRpc<{ day: string; score: number | null; mood: Mood | null }[]>("mood_series", { p_days: 30 });
  return (
    <ChartCard
      className={className}
      title="Mood over time"
      subtitle="Last 30 days"
      loading={series.isLoading}
      error={series.error}
      empty={!series.data?.some((r) => r.score !== null)}
      emptyHint="Pick a mood when you write. The line starts there."
      table={{
        columns: ["Day", "Mood"],
        rows: (series.data ?? []).filter((r) => r.mood).map((r) => [shortDay(r.day), MOOD_LABEL[r.mood!]]),
      }}
    >
      <TrendChart
        data={(series.data ?? []).map((r) => ({ day: r.day, score: r.score === null ? null : Number(r.score) }))}
        x="day"
        xFormat={shortDay}
        series={[{ key: "score", label: "Mood", color: "var(--diary)" }]}
        format={(v) => SCORE_LABEL[Math.round(v)] ?? ""}
        yTicks={[1, 2, 3, 4, 5]}
        yWidth={56}
        dots
        connectNulls
      />
    </ChartCard>
  );
}

export function MoodCountsChart({ className }: ChartProps) {
  const counts = useRpc<{ mood: Mood; total: number }[]>("mood_counts", { p_days: 30 });
  return (
    <ChartCard
      className={className}
      title="Mood counts"
      subtitle="Last 30 days"
      loading={counts.isLoading}
      error={counts.error}
      empty={!counts.data?.some((r) => r.total > 0)}
      table={{ columns: ["Mood", "Days"], rows: (counts.data ?? []).map((r) => [MOOD_LABEL[r.mood], r.total]) }}
    >
      <BarsChart
        data={(counts.data ?? []).map((r) => ({ mood: MOOD_LABEL[r.mood], total: r.total }))}
        x="mood"
        series={[{ key: "total", label: "Entries", color: "var(--diary)" }]}
      />
    </ChartCard>
  );
}

export function EntriesPerWeekChart({ className }: ChartProps) {
  const perWeek = useRpc<{ week: string; total: number }[]>("entries_per_week", { p_weeks: 12 });
  return (
    <ChartCard
      className={className}
      title="Entries written per week"
      loading={perWeek.isLoading}
      error={perWeek.error}
      empty={!perWeek.data?.some((r) => r.total > 0)}
      table={{ columns: ["Week of", "Entries"], rows: (perWeek.data ?? []).map((r) => [shortDay(r.week), r.total]) }}
    >
      <BarsChart
        data={perWeek.data ?? []}
        x="week"
        xFormat={shortDay}
        series={[{ key: "total", label: "Entries", color: "var(--diary)" }]}
      />
    </ChartCard>
  );
}
