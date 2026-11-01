"use client";

import {
  CompletionRateChart,
  CreatedVsCompletedChart,
  OnTimeVsLateChart,
  TasksByCategoryChart,
} from "@/components/charts/catalog/planner";
import { PageHeader, StatTile } from "@/components/ui/primitives";
import { useRpc } from "@/lib/data";

export default function PlannerChartsPage() {
  const streaks = useRpc<{ current_streak: number; longest_streak: number }[]>("task_streaks");

  return (
    <>
      <PageHeader title="Charts" />
      <div className="mb-4 grid grid-cols-2 gap-4">
        <StatTile label="Current streak" value={`${streaks.data?.[0]?.current_streak ?? 0} days`} />
        <StatTile label="Longest streak" value={`${streaks.data?.[0]?.longest_streak ?? 0} days`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CompletionRateChart />
        <OnTimeVsLateChart />
        <CreatedVsCompletedChart />
        <TasksByCategoryChart />
      </div>
    </>
  );
}
