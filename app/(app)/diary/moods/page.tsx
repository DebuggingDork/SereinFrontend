"use client";

import { ChartCard } from "@/components/charts/chart-card";
import { BarsChart, TrendChart } from "@/components/charts/marks";
import { MOOD_LABEL, type Mood } from "@/components/diary/shared";
import { PageHeader, StatTile } from "@/components/ui/primitives";
import { useRpc } from "@/lib/data";
import { shortDay } from "@/lib/format";

const SCORE_LABEL: Record<number, string> = { 1: "Low", 2: "Tired", 3: "Restless", 4: "Settled", 5: "Bright" };

export default function MoodsPage() {
  const series = useRpc<{ day: string; score: number | null; mood: Mood | null }[]>("mood_series", { p_days: 30 });
  const counts = useRpc<{ mood: Mood; total: number }[]>("mood_counts", { p_days: 30 });
  const perWeek = useRpc<{ week: string; total: number }[]>("entries_per_week", { p_weeks: 12 });
  const streak = useRpc<{ current_streak: number; longest_streak: number }[]>("writing_streak");

  return (
    <>
      <PageHeader title="Moods" />
      <div className="mb-4 grid grid-cols-2 gap-4">
        <StatTile label="Writing streak" value={`${streak.data?.[0]?.current_streak ?? 0} days`} />
        <StatTile label="Longest streak" value={`${streak.data?.[0]?.longest_streak ?? 0} days`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Mood over time"
          subtitle="Last 30 days"
          className="lg:col-span-2"
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
            domain={[1, 5]}
            connectNulls
          />
        </ChartCard>

        <ChartCard
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

        <ChartCard
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
      </div>
    </>
  );
}
