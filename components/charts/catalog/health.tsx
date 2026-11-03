"use client";

import { ChartCard } from "@/components/charts/chart-card";
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
