"use client";

import { useMemo, useState } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { BarsChart, DonutChart, TrendChart } from "@/components/charts/marks";
import { PageHeader, ProgressBar, Ring, SegmentedControl } from "@/components/ui/primitives";
import { useRows, useRpc } from "@/lib/data";
import { addDays, inr, inrCompact, monthBounds, monthLabel, shiftMonth, shortDay, today } from "@/lib/format";

type Range = "month" | "last" | "90";

function rangeBounds(range: Range) {
  if (range === "month") return monthBounds();
  if (range === "last") return monthBounds(shiftMonth(today(), -1));
  return { from: addDays(today(), -89), to: today() };
}

// Fixed order so a source keeps its colour however the data is filtered.
const SOURCE_COLORS = ["var(--finance)", "var(--planner)", "var(--diet)", "var(--diary)"];

export default function FinanceChartsPage() {
  const [range, setRange] = useState<Range>("month");
  const { from, to } = rangeBounds(range);

  const category = useRpc<{ category: string; color: string; total: number }[]>("spending_by_category", { p_from: from, p_to: to });
  const income = useRpc<{ month: string; income: number; expense: number }[]>("income_vs_expense", { p_months: 6 });
  const daily = useRpc<{ day: string; total: number }[]>("daily_spending", { p_days: 30 });
  const balance = useRpc<{ day: string; balance: number }[]>("balance_trend", { p_days: 30 });
  const source = useRpc<{ account: string; payment_app: string; total: number }[]>("spending_by_source", { p_from: from, p_to: to });
  const budgets = useRpc<{ id: string; category_name: string; spent: number; limit_amount: number; elapsed: number; category_color: string }[]>("budget_progress");
  const subs = useRpc<{ month: string; total: number }[]>("subscription_cost_by_month", { p_months: 12 });
  const debts = useRpc<{ person: string; owed_to_me: number; i_owe: number }[]>("debts_by_person");
  const snapshots = useRows<{ taken_on: string; assets: number; liabilities: number }>("net_worth_snapshots", { order: [["taken_on"]], limit: 365 });
  const goals = useRows<{ id: string; name: string; target: number; saved: number }>("goals", { order: [["name"]] });

  const stacked = useMemo(() => {
    const rows = source.data ?? [];
    const apps = [...new Set(rows.map((r) => r.payment_app))].slice(0, 4);
    const accounts = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      const entry = accounts.get(row.account) ?? { account: row.account };
      if (apps.includes(row.payment_app)) entry[row.payment_app] = Number(row.total);
      accounts.set(row.account, entry);
    }
    return {
      data: [...accounts.values()],
      series: apps.map((app, index) => ({ key: app, label: app, color: SOURCE_COLORS[index]! })),
    };
  }, [source.data]);

  const compare = useRpc<{ day: string; total: number }[]>("daily_spending", { p_days: 62 });
  const monthCompare = useMemo(() => {
    const rows = compare.data ?? [];
    const thisMonth = monthBounds();
    const lastMonth = monthBounds(shiftMonth(today(), -1));
    // Days that have not happened yet stay empty, so the line stops at today.
    const days = new Map<number, { day: number; thisMonth: number | null; lastMonth: number | null }>();
    let thisRun = 0;
    let lastRun = 0;
    for (const row of rows) {
      const dayNumber = Number(row.day.slice(8, 10));
      const entry = days.get(dayNumber) ?? { day: dayNumber, thisMonth: null, lastMonth: null };
      if (row.day >= thisMonth.from && row.day <= thisMonth.to) {
        thisRun += Number(row.total);
        entry.thisMonth = thisRun;
      } else if (row.day >= lastMonth.from && row.day <= lastMonth.to) {
        lastRun += Number(row.total);
        entry.lastMonth = lastRun;
      }
      days.set(dayNumber, entry);
    }
    return [...days.values()].sort((a, b) => a.day - b.day);
  }, [compare.data]);

  const hasSpend = (rows: { total: number }[] | undefined) => rows?.some((r) => Number(r.total) > 0);

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
        <ChartCard
          title="Spending by category"
          loading={category.isLoading}
          error={category.error}
          empty={!category.data?.length}
          table={{ columns: ["Category", "Spent"], rows: (category.data ?? []).map((r) => [r.category, inr(r.total)]) }}
          legend={(category.data ?? []).slice(0, 8).map((r) => ({ label: r.category, color: r.color }))}
        >
          <DonutChart
            data={(category.data ?? []).map((r) => ({ name: r.category, value: Number(r.total), color: r.color }))}
            format={inr}
            center={<span className="figure text-xl">{inr((category.data ?? []).reduce((s, r) => s + Number(r.total), 0))}</span>}
          />
        </ChartCard>

        <ChartCard
          title="Income versus expenses"
          subtitle="By month"
          loading={income.isLoading}
          error={income.error}
          empty={!income.data?.some((r) => Number(r.income) || Number(r.expense))}
          legend={[
            { label: "Income", color: "var(--finance)" },
            { label: "Expenses", color: "var(--planner)" },
          ]}
          table={{ columns: ["Month", "Income", "Expenses"], rows: (income.data ?? []).map((r) => [monthLabel(r.month), inr(r.income), inr(r.expense)]) }}
        >
          <BarsChart
            data={(income.data ?? []).map((r) => ({ ...r, income: Number(r.income), expense: Number(r.expense) }))}
            x="month"
            xFormat={monthLabel}
            series={[
              { key: "income", label: "Income", color: "var(--finance)" },
              { key: "expense", label: "Expenses", color: "var(--planner)" },
            ]}
            format={inr}
            axisFormat={inrCompact}
          />
        </ChartCard>

        <ChartCard
          title="Daily spending"
          subtitle="Last 30 days"
          loading={daily.isLoading}
          error={daily.error}
          empty={!hasSpend(daily.data)}
          table={{ columns: ["Day", "Spent"], rows: (daily.data ?? []).map((r) => [shortDay(r.day), inr(r.total)]) }}
        >
          <BarsChart
            data={(daily.data ?? []).map((r) => ({ ...r, total: Number(r.total) }))}
            x="day"
            xFormat={shortDay}
            series={[{ key: "total", label: "Spent", color: "var(--finance)" }]}
            format={inr}
            axisFormat={inrCompact}
          />
        </ChartCard>

        <ChartCard
          title="Balance trend"
          subtitle="Last 30 days, across visible accounts"
          loading={balance.isLoading}
          error={balance.error}
          empty={!balance.data?.some((r) => Number(r.balance) !== 0)}
          table={{ columns: ["Day", "Balance"], rows: (balance.data ?? []).map((r) => [shortDay(r.day), inr(r.balance)]) }}
        >
          <TrendChart
            data={(balance.data ?? []).map((r) => ({ ...r, balance: Number(r.balance) }))}
            x="day"
            xFormat={shortDay}
            series={[{ key: "balance", label: "Balance", color: "var(--finance)" }]}
            format={inr}
            axisFormat={inrCompact}
          />
        </ChartCard>

        <ChartCard
          title="This month versus last"
          subtitle="Running total by day of the month"
          loading={compare.isLoading}
          error={compare.error}
          empty={!hasSpend(compare.data)}
          legend={[
            { label: "This month", color: "var(--finance)" },
            { label: "Last month", color: "var(--ink-3)" },
          ]}
        >
          <TrendChart
            data={monthCompare}
            x="day"
            series={[
              { key: "thisMonth", label: "This month", color: "var(--finance)" },
              { key: "lastMonth", label: "Last month", color: "var(--ink-3)" },
            ]}
            format={inr}
            axisFormat={inrCompact}
          />
        </ChartCard>

        <ChartCard
          title="Spending by account and payment app"
          loading={source.isLoading}
          error={source.error}
          empty={stacked.data.length === 0}
          legend={stacked.series.map((s) => ({ label: s.label, color: s.color }))}
          table={{ columns: ["Account", "Paid with", "Spent"], rows: (source.data ?? []).map((r) => [r.account, r.payment_app, inr(r.total)]) }}
        >
          <BarsChart data={stacked.data} x="account" series={stacked.series} stacked format={inr} axisFormat={inrCompact} />
        </ChartCard>

        <ChartCard
          title="Budget progress"
          subtitle="The tick marks today"
          loading={budgets.isLoading}
          error={budgets.error}
          empty={!budgets.data?.length}
          emptyHint="Set a budget to track it here."
        >
          <ul className="space-y-3.5">
            {(budgets.data ?? []).map((b) => (
              <li key={b.id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{b.category_name}</span>
                  <span className="tabular text-ink-2">
                    {inr(b.spent)} / {inr(b.limit_amount)}
                  </span>
                </div>
                <ProgressBar value={Number(b.spent) / Number(b.limit_amount)} color={b.category_color} marker={Number(b.elapsed)} label={b.category_name} />
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard
          title="Subscription cost by month"
          subtitle="Next 12 months"
          loading={subs.isLoading}
          error={subs.error}
          empty={!hasSpend(subs.data)}
          emptyHint="Mark a scheduled item as a subscription."
          table={{ columns: ["Month", "Cost"], rows: (subs.data ?? []).map((r) => [monthLabel(r.month), inr(r.total)]) }}
        >
          <BarsChart
            data={(subs.data ?? []).map((r) => ({ ...r, total: Number(r.total) }))}
            x="month"
            xFormat={monthLabel}
            series={[{ key: "total", label: "Cost", color: "var(--finance)" }]}
            format={inr}
            axisFormat={inrCompact}
          />
        </ChartCard>

        <ChartCard
          title="Net worth over time"
          loading={snapshots.isLoading}
          error={snapshots.error}
          empty={(snapshots.data?.length ?? 0) < 2}
          emptyHint="A point is recorded daily. Your line starts tomorrow."
          table={{
            columns: ["Date", "Net worth"],
            rows: (snapshots.data ?? []).map((r) => [shortDay(r.taken_on), inr(Number(r.assets) - Number(r.liabilities))]),
          }}
        >
          <TrendChart
            data={(snapshots.data ?? []).map((r) => ({ day: r.taken_on, net: Number(r.assets) - Number(r.liabilities) }))}
            x="day"
            xFormat={shortDay}
            series={[{ key: "net", label: "Net worth", color: "var(--finance)" }]}
            format={inr}
            axisFormat={inrCompact}
          />
        </ChartCard>

        <ChartCard
          title="Debts: remaining per person"
          loading={debts.isLoading}
          error={debts.error}
          empty={!debts.data?.length}
          emptyHint="Nobody owes anybody."
          legend={[
            { label: "Owed to you", color: "var(--finance)" },
            { label: "You owe", color: "var(--planner)" },
          ]}
          table={{ columns: ["Person", "Owed to you", "You owe"], rows: (debts.data ?? []).map((r) => [r.person, inr(r.owed_to_me), inr(r.i_owe)]) }}
        >
          <BarsChart
            data={(debts.data ?? []).map((r) => ({ ...r, owed_to_me: Number(r.owed_to_me), i_owe: Number(r.i_owe) }))}
            x="person"
            series={[
              { key: "owed_to_me", label: "Owed to you", color: "var(--finance)" },
              { key: "i_owe", label: "You owe", color: "var(--planner)" },
            ]}
            format={inr}
            axisFormat={inrCompact}
          />
        </ChartCard>

        <ChartCard
          title="Goal progress"
          loading={goals.isLoading}
          error={goals.error}
          empty={!goals.data?.length}
          emptyHint="Set a goal to see its ring here."
          className="lg:col-span-2"
        >
          <ul className="flex flex-wrap gap-6">
            {(goals.data ?? []).map((goal) => (
              <li key={goal.id} className="flex items-center gap-3">
                <Ring value={Number(goal.saved) / Number(goal.target)} color="var(--finance)">
                  <span className="tabular">{Math.round((Number(goal.saved) / Number(goal.target)) * 100)}%</span>
                </Ring>
                <div className="text-sm">
                  <p>{goal.name}</p>
                  <p className="tabular text-xs text-ink-3">
                    {inr(goal.saved)} of {inr(goal.target)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </>
  );
}
