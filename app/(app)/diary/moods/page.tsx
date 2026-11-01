"use client";

import { EntriesPerWeekChart, MoodCountsChart, MoodOverTimeChart } from "@/components/charts/catalog/diary";
import { PageHeader, StatTile } from "@/components/ui/primitives";
import { useRpc } from "@/lib/data";

export default function MoodsPage() {
  const streak = useRpc<{ current_streak: number; longest_streak: number }[]>("writing_streak");

  return (
    <>
      <PageHeader title="Moods" />
      <div className="mb-4 grid grid-cols-2 gap-4">
        <StatTile label="Writing streak" value={`${streak.data?.[0]?.current_streak ?? 0} days`} />
        <StatTile label="Longest streak" value={`${streak.data?.[0]?.longest_streak ?? 0} days`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <MoodOverTimeChart className="lg:col-span-2" />
        <MoodCountsChart />
        <EntriesPerWeekChart />
      </div>
    </>
  );
}
