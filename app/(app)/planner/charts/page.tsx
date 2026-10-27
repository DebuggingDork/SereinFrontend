"use client";

import { ChartCard } from "@/components/charts/chart-card";
import { BarsChart, DonutChart, TrendChart } from "@/components/charts/marks";
import { PageHeader, StatTile } from "@/components/ui/primitives";
import { useRpc } from "@/lib/data";
import { shortDay } from "@/lib/format";

// Fixed order, so a category keeps its colour between visits. Beyond this it folds into Other.
const CATEGORY_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
const OTHER_COLOR = "#85878a";

export default function PlannerChartsPage() {
  const rate = useRpc<{ day: string; due: number; completed: number; rate: number | null }[]>("completion_rate_daily", { p_days: 30 });
  const flow = useRpc<{ week: string; created: number; completed: number }[]>("tasks_created_vs_completed", { p_weeks: 8 });
  const byCategory = useRpc<{ category: string; total: number }[]>("tasks_by_category");
  const punctuality = useRpc<{ week: string; on_time: number; late: number }[]>("on_time_vs_late", { p_weeks: 8 });
  const streaks = useRpc<{ current_streak: number; longest_streak: number }[]>("task_streaks");

  const categories = byCategory.data ?? [];
  const top = categories.slice(0, CATEGORY_COLORS.length).map((row, index) => ({
    name: row.category,
    value: row.total,
    color: CATEGORY_COLORS[index]!,
  }));
  const rest = categories.slice(CATEGORY_COLORS.length).reduce((sum, row) => sum + row.total, 0);
  if (rest > 0) top.push({ name: "Other", value: rest, color: OTHER_COLOR });

  return (
    <>
      <PageHeader title="Charts" />
      <div className="mb-4 grid grid-cols-2 gap-4">
        <StatTile label="Current streak" value={`${streaks.data?.[0]?.current_streak ?? 0} days`} />
        <StatTile label="Longest streak" value={`${streaks.data?.[0]?.longest_streak ?? 0} days`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Completion rate"
          subtitle="Per day, last 30 days"
          loading={rate.isLoading}
          error={rate.error}
          empty={!rate.data?.some((r) => r.due > 0)}
          emptyHint="Finish a few tasks to see your rate."
          table={{ columns: ["Day", "Done", "Due", "Rate"], rows: (rate.data ?? []).map((r) => [shortDay(r.day), r.completed, r.due, r.rate === null ? "–" : `${r.rate}%`]) }}
        >
          <TrendChart
            data={(rate.data ?? []).map((r) => ({ day: r.day, rate: r.rate === null ? null : Number(r.rate) }))}
            x="day"
            xFormat={shortDay}
            series={[{ key: "rate", label: "Completion", color: "var(--planner)" }]}
            format={(v) => `${v}%`}
            connectNulls
          />
        </ChartCard>

        <ChartCard
          title="On time versus late"
          subtitle="By week"
          loading={punctuality.isLoading}
          error={punctuality.error}
          empty={!punctuality.data?.some((r) => r.on_time + r.late > 0)}
          emptyHint="Tasks with due dates show up here once finished."
          legend={[
            { label: "On time", color: "var(--planner)" },
            { label: "Late", color: "color-mix(in srgb, var(--planner) 30%, var(--surface))" },
          ]}
          table={{ columns: ["Week of", "On time", "Late"], rows: (punctuality.data ?? []).map((r) => [shortDay(r.week), r.on_time, r.late]) }}
        >
          <BarsChart
            data={punctuality.data ?? []}
            x="week"
            xFormat={shortDay}
            stacked
            series={[
              { key: "on_time", label: "On time", color: "var(--planner)" },
              { key: "late", label: "Late", color: "color-mix(in srgb, var(--planner) 30%, var(--surface))" },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Created versus completed"
          subtitle="By week"
          loading={flow.isLoading}
          error={flow.error}
          empty={!flow.data?.some((r) => r.created + r.completed > 0)}
          legend={[
            { label: "Created", color: "var(--ink-3)" },
            { label: "Completed", color: "var(--planner)" },
          ]}
          table={{ columns: ["Week of", "Created", "Completed"], rows: (flow.data ?? []).map((r) => [shortDay(r.week), r.created, r.completed]) }}
        >
          <BarsChart
            data={flow.data ?? []}
            x="week"
            xFormat={shortDay}
            series={[
              { key: "created", label: "Created", color: "var(--ink-3)" },
              { key: "completed", label: "Completed", color: "var(--planner)" },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Tasks by category"
          loading={byCategory.isLoading}
          error={byCategory.error}
          empty={categories.length === 0}
          legend={top.map((t) => ({ label: t.name, color: t.color }))}
          table={{ columns: ["Category", "Tasks"], rows: categories.map((r) => [r.category, r.total]) }}
        >
          <DonutChart data={top} />
        </ChartCard>
      </div>
    </>
  );
}
