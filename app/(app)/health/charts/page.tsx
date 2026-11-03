"use client";

import {
  CaloriesVsTargetChart,
  ChecklistChart,
  LiftProgressChart,
  MacroSplitChart,
  MealTimingChart,
  SessionsPerWeekChart,
  WaterPerDayChart,
  WeeklyMacrosChart,
  WeightTrendChart,
} from "@/components/charts/catalog/health";
import { PageHeader } from "@/components/ui/primitives";

export default function HealthChartsPage() {
  return (
    <>
      <PageHeader title="Charts" />
      <div className="grid gap-4 lg:grid-cols-2">
        <LiftProgressChart />
        <SessionsPerWeekChart />
        <ChecklistChart />
        <CaloriesVsTargetChart />
        <MacroSplitChart />
        <WeeklyMacrosChart />
        <WaterPerDayChart />
        <WeightTrendChart />
        <MealTimingChart />
      </div>
    </>
  );
}
