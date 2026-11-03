"use client";

import {
  CaloriesVsTargetChart,
  MacroSplitChart,
  MealTimingChart,
  WaterPerDayChart,
  WeeklyMacrosChart,
  WeightTrendChart,
} from "@/components/charts/catalog/diet";
import { PageHeader } from "@/components/ui/primitives";

export default function DietChartsPage() {
  return (
    <>
      <PageHeader title="Charts" />
      <div className="grid gap-4 lg:grid-cols-2">
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
