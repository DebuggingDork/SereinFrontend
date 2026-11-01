"use client";

import { useState } from "react";
import {
  BalanceTrendChart,
  BudgetProgressChart,
  DailySpendingChart,
  DebtsChart,
  GoalProgressChart,
  IncomeVsExpensesChart,
  MonthCompareChart,
  NetWorthChart,
  SpendingByCategoryChart,
  SpendingBySourceChart,
  SubscriptionCostChart,
} from "@/components/charts/catalog/finance";
import { PageHeader, SegmentedControl } from "@/components/ui/primitives";
import { addDays, monthBounds, shiftMonth, today } from "@/lib/format";

type Range = "month" | "last" | "90";

function rangeBounds(range: Range) {
  if (range === "month") return monthBounds();
  if (range === "last") return monthBounds(shiftMonth(today(), -1));
  return { from: addDays(today(), -89), to: today() };
}

export default function FinanceChartsPage() {
  const [range, setRange] = useState<Range>("month");
  const bounds = rangeBounds(range);

  return (
    <>
      <PageHeader
        title="Charts"
        action={
          <SegmentedControl
            label="Date range"
            value={range}
            onChange={setRange}
            options={[
              { value: "month", label: "This month" },
              { value: "last", label: "Last month" },
              { value: "90", label: "90 days" },
            ]}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SpendingByCategoryChart range={bounds} />
        <IncomeVsExpensesChart />
        <DailySpendingChart />
        <BalanceTrendChart />
        <MonthCompareChart />
        <SpendingBySourceChart range={bounds} />
        <BudgetProgressChart />
        <SubscriptionCostChart />
        <NetWorthChart />
        <DebtsChart />
        <GoalProgressChart className="lg:col-span-2" />
      </div>
    </>
  );
}
