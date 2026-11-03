"use client";

import { useMemo, useState } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { mondayOf } from "@/components/health/plan-data";
import { useSessions, useSetHistory } from "@/components/health/workout-log";
import { Select } from "@/components/ui/field";
import { BarsChart, DonutChart, HeatStripChart, TrendChart } from "@/components/charts/marks";
import { useRows, useRpc } from "@/lib/data";
import { number, shortDay } from "@/lib/format";

interface ChartProps {
  className?: string;
}

// One family of warm hues for the three macros, ordered dark to light.
const MACROS = [
  { key: "protein", label: "Protein", color: "#b45309" },
  { key: "carbs", label: "Carbs", color: "#f59e0b" },
  { key: "fat", label: "Fat", color: "#fcd34d" },
];

const hourLabel = (hour: number) => `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`;

export function CaloriesVsTargetChart({ className }: ChartProps) {
  const calories = useRpc<{ day: string; calories: number; target: number }[]>("daily_calories", { p_days: 14 });
  const target = Number(calories.data?.[0]?.target ?? 2000);
  return (
    <ChartCard
      className={className}
      title="Calories versus target"
      subtitle="Last 14 days"
      loading={calories.isLoading}
      error={calories.error}
      empty={!calories.data?.some((r) => Number(r.calories) > 0)}
      emptyHint="Log a meal to see it against your target."
      table={{ columns: ["Day", "Calories"], rows: (calories.data ?? []).map((r) => [shortDay(r.day), number(r.calories)]) }}
    >
      <BarsChart
        data={(calories.data ?? []).map((r) => ({ ...r, calories: Number(r.calories) }))}
        x="day"
        xFormat={shortDay}
        series={[{ key: "calories", label: "Calories", color: "var(--health)" }]}
        format={(v) => `${number(v)} kcal`}
        axisFormat={(v) => number(v)}
        target={{ value: target, label: "Target" }}
      />
    </ChartCard>
  );
}

export function MacroSplitChart({ className }: ChartProps) {
  const split = useRpc<{ protein: number; carbs: number; fat: number; calories: number }[]>("macro_split");
  const today = split.data?.[0];
  // Grams to energy, so the split reflects calories rather than weight of food.
  const macroEnergy = MACROS.map((macro) => ({
    name: macro.label,
    value: Number(today?.[macro.key as "protein"] ?? 0) * (macro.key === "fat" ? 9 : 4),
    color: macro.color,
  }));
  const energyTotal = macroEnergy.reduce((sum, item) => sum + item.value, 0);
  return (
    <ChartCard
      className={className}
      title="Macro split"
      subtitle="Today, by energy"
      loading={split.isLoading}
      error={split.error}
      empty={energyTotal === 0}
      emptyHint="Log a meal with macros to see the split."
      legend={macroEnergy.map((m) => ({
        label: `${m.name} ${energyTotal ? Math.round((m.value / energyTotal) * 100) : 0}%`,
        color: m.color,
      }))}
      table={{ columns: ["Macro", "Share"], rows: macroEnergy.map((m) => [m.name, `${Math.round((m.value / (energyTotal || 1)) * 100)}%`]) }}
    >
      <DonutChart
        data={macroEnergy}
        format={(v) => `${number(v)} kcal`}
        center={<span className="figure text-xl">{number(today?.calories)}</span>}
      />
    </ChartCard>
  );
}

export function WeeklyMacrosChart({ className }: ChartProps) {
  const weekly = useRpc<{ week: string; protein: number; carbs: number; fat: number }[]>("weekly_macros", { p_weeks: 8 });
  return (
    <ChartCard
      className={className}
      title="Weekly average macros"
      subtitle="Grams per logged day"
      loading={weekly.isLoading}
      error={weekly.error}
      empty={!weekly.data?.some((r) => Number(r.protein) + Number(r.carbs) + Number(r.fat) > 0)}
      legend={MACROS.map((m) => ({ label: m.label, color: m.color }))}
      table={{ columns: ["Week of", "Protein", "Carbs", "Fat"], rows: (weekly.data ?? []).map((r) => [shortDay(r.week), number(r.protein), number(r.carbs), number(r.fat)]) }}
    >
      <BarsChart
        data={(weekly.data ?? []).map((r) => ({ week: r.week, protein: Number(r.protein), carbs: Number(r.carbs), fat: Number(r.fat) }))}
        x="week"
        xFormat={shortDay}
        stacked
        series={MACROS}
        format={(v) => `${number(v)} g`}
        axisFormat={(v) => number(v)}
      />
    </ChartCard>
  );
}

export function WaterPerDayChart({ className }: ChartProps) {
  const water = useRpc<{ day: string; amount_ml: number; goal_ml: number }[]>("daily_water", { p_days: 14 });
  return (
    <ChartCard
      className={className}
      title="Water per day"
      subtitle="Last 14 days"
      loading={water.isLoading}
      error={water.error}
      empty={!water.data?.some((r) => r.amount_ml > 0)}
      table={{ columns: ["Day", "Water"], rows: (water.data ?? []).map((r) => [shortDay(r.day), `${number(r.amount_ml)} ml`]) }}
    >
      <BarsChart
        data={water.data ?? []}
        x="day"
        xFormat={shortDay}
        series={[{ key: "amount_ml", label: "Water", color: "var(--health)" }]}
        format={(v) => `${number(v)} ml`}
        axisFormat={(v) => number(v)}
        target={water.data?.[0] ? { value: water.data[0].goal_ml, label: "Goal" } : undefined}
      />
    </ChartCard>
  );
}

export function WeightTrendChart({ className }: ChartProps) {
  const weight = useRows<{ logged_on: string; weight_kg: number }>("weight_logs", { order: [["logged_on"]], limit: 180 });
  return (
    <ChartCard
      className={className}
      title="Weight trend"
      loading={weight.isLoading}
      error={weight.error}
      empty={(weight.data?.length ?? 0) < 2}
      emptyHint="Two entries make a line."
      table={{ columns: ["Date", "Weight"], rows: (weight.data ?? []).map((r) => [shortDay(r.logged_on), `${r.weight_kg} kg`]) }}
    >
      <TrendChart
        data={(weight.data ?? []).map((r) => ({ day: r.logged_on, weight: Number(r.weight_kg) }))}
        x="day"
        xFormat={shortDay}
        series={[{ key: "weight", label: "Weight", color: "var(--health)" }]}
        format={(v) => `${number(v, 1)} kg`}
        axisFormat={(v) => number(v, 1)}
      />
    </ChartCard>
  );
}

export function MealTimingChart({ className }: ChartProps) {
  const timing = useRpc<{ hour: number; meals: number }[]>("meal_timing", { p_days: 30 });
  return (
    <ChartCard
      className={className}
      title="Meal timing"
      subtitle="When you ate, last 30 days. Darker means more often."
      loading={timing.isLoading}
      error={timing.error}
      empty={!timing.data?.some((r) => r.meals > 0)}
      table={{ columns: ["Hour", "Meals"], rows: (timing.data ?? []).filter((r) => r.meals > 0).map((r) => [hourLabel(r.hour), r.meals]) }}
    >
      <div className="pt-6">
        <HeatStripChart
          data={(timing.data ?? []).map((r) => ({ label: hourLabel(r.hour), value: r.meals }))}
          format={(v) => `${v} meal${v === 1 ? "" : "s"}`}
        />
      </div>
    </ChartCard>
  );
}

// The heaviest set per session shows whether strength is holding during a cut.
export function LiftProgressChart({ className }: ChartProps) {
  const history = useSetHistory();
  const lifts = useMemo(() => {
    const byName = new Map<string, Map<string, number>>();
    for (const set of history.data ?? []) {
      const day = set.workout_sessions?.logged_on;
      if (!day || set.weight_kg === null) continue;
      const days = byName.get(set.exercise_name) ?? new Map<string, number>();
      days.set(day, Math.max(days.get(day) ?? 0, Number(set.weight_kg)));
      byName.set(set.exercise_name, days);
    }
    return byName;
  }, [history.data]);
  const names = [...lifts.keys()].sort((a, b) => a.localeCompare(b));
  const [picked, setPicked] = useState<string | null>(null);
  const name = picked && lifts.has(picked) ? picked : names[0];
  const rows = [...(name ? lifts.get(name)! : new Map<string, number>()).entries()]
    .map(([day, weight]) => ({ day, weight }))
    .sort((a, b) => a.day.localeCompare(b.day));
  return (
    <ChartCard
      className={className}
      title="Heaviest set by lift"
      subtitle={name ?? "Per session"}
      loading={history.isLoading}
      error={history.error}
      empty={rows.length === 0}
      emptyHint="Log sets with a weight to see each lift here."
      table={{ columns: ["Day", "Weight"], rows: rows.map((r) => [shortDay(r.day), `${r.weight} kg`]) }}
    >
      {names.length > 1 && (
        <div className="mb-3 max-w-xs">
          <Select aria-label="Choose a lift" value={name} onChange={(event) => setPicked(event.target.value)}>
            {names.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      )}
      <TrendChart
        data={rows}
        x="day"
        xFormat={shortDay}
        series={[{ key: "weight", label: "Heaviest set", color: "var(--health)" }]}
        format={(v) => `${number(v, 1)} kg`}
        axisFormat={(v) => number(v, 1)}
      />
    </ChartCard>
  );
}

export function SessionsPerWeekChart({ className }: ChartProps) {
  const sessions = useSessions();
  const rows = useMemo(() => {
    const weeks = new Map<string, number>();
    for (const session of sessions.data ?? []) {
      if (!session.completed_at || session.kind === "rest") continue;
      const monday = mondayOf(session.logged_on);
      weeks.set(monday, (weeks.get(monday) ?? 0) + 1);
    }
    return [...weeks.entries()]
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12);
  }, [sessions.data]);
  return (
    <ChartCard
      className={className}
      title="Sessions per week"
      subtitle="Lifting, cardio and games"
      loading={sessions.isLoading}
      error={sessions.error}
      empty={rows.length === 0}
      emptyHint="Finish a session to start the count."
      table={{ columns: ["Week of", "Sessions"], rows: rows.map((r) => [shortDay(r.week), r.count]) }}
    >
      <BarsChart
        data={rows}
        x="week"
        xFormat={shortDay}
        series={[{ key: "count", label: "Sessions", color: "var(--health)" }]}
        format={(v) => number(v)}
        axisFormat={(v) => number(v)}
      />
    </ChartCard>
  );
}

export function ChecklistChart({ className }: ChartProps) {
  const checkins = useRows<{ logged_on: string; done: string[]; total: number }>("health_checkins", {
    order: [["logged_on", { ascending: false }]],
    limit: 30,
  });
  const rows = [...(checkins.data ?? [])].reverse().map((row) => ({ day: row.logged_on, ticks: row.done.length, total: row.total }));
  const total = rows.at(-1)?.total;
  return (
    <ChartCard
      className={className}
      title="Daily checklist"
      subtitle="Ticks per day, last 30 days"
      loading={checkins.isLoading}
      error={checkins.error}
      empty={rows.length === 0}
      emptyHint="Tick your daily checklist to see your streaks."
      table={{ columns: ["Day", "Ticks"], rows: rows.map((r) => [shortDay(r.day), `${r.ticks} of ${r.total}`]) }}
    >
      <BarsChart
        data={rows}
        x="day"
        xFormat={shortDay}
        series={[{ key: "ticks", label: "Ticks", color: "var(--health)" }]}
        format={(v) => number(v)}
        axisFormat={(v) => number(v)}
        target={total ? { value: total, label: "Clean day" } : undefined}
      />
    </ChartCard>
  );
}
