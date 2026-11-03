"use client";

import { Circle } from "lucide-react";
import Link from "next/link";
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
import {
  CaloriesVsTargetChart,
  MacroSplitChart,
  MealTimingChart,
  WaterPerDayChart,
  WeeklyMacrosChart,
  WeightTrendChart,
} from "@/components/charts/catalog/health";
import { EntriesPerWeekChart, MoodCountsChart, MoodOverTimeChart } from "@/components/charts/catalog/diary";
import {
  CompletionRateChart,
  CreatedVsCompletedChart,
  OnTimeVsLateChart,
  TasksByCategoryChart,
} from "@/components/charts/catalog/planner";
import { WaterButtons } from "@/components/health/water-buttons";
import { ComingUp, PanelTitle, SafeToSpendPanel, WhereItWent } from "@/components/finance/panels";
import { QuickAdd } from "@/components/finance/quick-add";
import { Card, ProgressBar, Ring } from "@/components/ui/primitives";
import { useRows } from "@/lib/data";
import { formatDay, inr, number, relativeDay, today } from "@/lib/format";

export interface HomeSummary {
  today: string;
  net_worth: { assets: number; liabilities: number; net: number } | null;
  safe_to_spend: { per_day: number; days_left: number; status: "comfortable" | "tight" | "over" } | null;
  spent_today: number;
  tasks: { due: number; done: number };
  task_streak: number;
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
  targets: { calories: number; protein: number; carbs: number; fat: number; water_ml: number } | null;
  water_ml: number;
  latest_entry: { entry_on: string; title: string; mood: string | null; body: string } | null;
}

function Tile({
  title,
  href,
  color,
  tint,
  children,
  aside,
}: {
  title: string;
  href: string;
  color: string;
  tint?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-3xl p-5 sm:p-6 ${tint ? "" : "border border-line bg-surface"}`}
      style={tint ? { background: tint } : undefined}
    >
      <div className="mb-3 flex items-center justify-between gap-2 text-sm">
        <Link href={href} className="flex items-center gap-2 text-ink-2 underline-offset-2 hover:text-ink hover:underline">
          <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
          {title}
        </Link>
        {aside}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

type WidgetProps = { summary: HomeSummary };

const SPARK_WIDTH = 240;
const SPARK_HEIGHT = 56;

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const low = Math.min(...values);
  const span = Math.max(...values) - low || 1;
  const points = values.map(
    (value, index) =>
      `${(index / (values.length - 1)) * SPARK_WIDTH},${SPARK_HEIGHT - 4 - ((value - low) / span) * (SPARK_HEIGHT - 8)}`,
  );
  return (
    <svg
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden
      className="mt-3 h-14 w-full"
    >
      <polygon points={`0,${SPARK_HEIGHT} ${points.join(" ")} ${SPARK_WIDTH},${SPARK_HEIGHT}`} fill="var(--finance-soft)" />
      <polyline points={points.join(" ")} fill="none" stroke="var(--finance)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function BalanceWidget({ summary }: WidgetProps) {
  const { data: snapshots = [] } = useRows<{ taken_on: string; assets: number; liabilities: number }>("net_worth_snapshots", {
    order: [["taken_on", { ascending: false }]],
    limit: 60,
  });
  const trend = snapshots.map((s) => Number(s.assets) - Number(s.liabilities)).reverse();
  return (
    <Tile title="Net worth" href="/finance/net-worth" color="var(--finance)">
      <p className="figure text-[38px] leading-tight">{inr(summary.net_worth?.net)}</p>
      <p className="mt-1.5 text-sm text-ink-2">
        {inr(summary.net_worth?.assets)} owned · {inr(summary.net_worth?.liabilities)} owed
      </p>
      <Sparkline values={trend} />
    </Tile>
  );
}

function TasksWidget({ summary }: WidgetProps) {
  const { data: tasks = [] } = useRows<{ id: string; title: string; due_on: string | null; status: string }>("tasks", {
    filters: [
      ["status", "in", "(todo,doing)"],
      ["due_on", "lte", today()],
      ["parent_id", "is", null],
    ],
    order: [["due_on"]],
    limit: 4,
  });
  const total = Number(summary.tasks.due) + Number(summary.tasks.done);
  return (
    <Tile
      title="Today"
      href="/planner"
      color="var(--planner)"
      aside={summary.task_streak > 0 && <span className="text-[13px] text-planner">{summary.task_streak}-day streak</span>}
    >
      {tasks.length === 0 ? (
        <p className="text-sm leading-relaxed text-ink-2">
          {total > 0 ? "All done for today." : "Nothing due today. "}
          {total === 0 && (
            <Link href="/planner" className="underline underline-offset-2 hover:text-ink">
              Plan something
            </Link>
          )}
        </p>
      ) : (
        <ul className="space-y-2 text-sm">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2.5">
              <Circle size={14} className="shrink-0 text-ink-2" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{task.title}</span>
              {task.due_on && task.due_on < today() && (
                <span className="shrink-0 text-xs text-warn">{relativeDay(task.due_on)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {total > 0 && (
        <div className="mt-4">
          <ProgressBar value={Number(summary.tasks.done) / total} color="var(--planner)" label="Tasks done today" />
        </div>
      )}
    </Tile>
  );
}

function CaloriesWidget({ summary }: WidgetProps) {
  const eaten = Number(summary.nutrition.calories);
  const target = Number(summary.targets?.calories ?? 2000);
  return (
    <Tile title="Calories today" href="/health" color="var(--health)">
      <div className="flex items-center gap-4">
        <Ring value={eaten / target} color="var(--health)" size={84} thickness={9}>
          <span className="tabular text-sm">{Math.round((eaten / target) * 100)}%</span>
        </Ring>
        <div className="min-w-0">
          <p className="figure text-[30px] leading-tight">{number(eaten)}</p>
          <p className="text-sm text-ink-2">of {number(target)} kcal</p>
          <p className="tabular mt-1 text-xs text-ink-2">
            P {number(summary.nutrition.protein)} · C {number(summary.nutrition.carbs)} · F {number(summary.nutrition.fat)}
          </p>
        </div>
      </div>
    </Tile>
  );
}

function WaterWidget({ summary }: WidgetProps) {
  const goal = Number(summary.targets?.water_ml ?? 2500);
  return (
    <Tile title="Water today" href="/health/water" color="var(--health)">
      <p className="figure text-[30px] leading-tight">
        {number(summary.water_ml)} <span className="text-base text-ink-2">of {number(goal)} ml</span>
      </p>
      <div className="mt-3">
        <ProgressBar value={Number(summary.water_ml) / goal} color="var(--health)" label="Water goal" />
      </div>
      <div className="mt-4">
        <WaterButtons current={Number(summary.water_ml)} />
      </div>
    </Tile>
  );
}

const MOOD_LABEL: Record<string, string> = {
  bright: "Bright",
  settled: "Settled",
  restless: "Restless",
  tired: "Tired",
  low: "Low",
};

function MoodWidget({ summary }: WidgetProps) {
  const entry = summary.latest_entry;
  return (
    <Tile
      title="Latest mood"
      href="/diary"
      color="var(--diary)"
      tint="var(--diary-soft)"
      aside={entry?.mood && <span className="text-[13px] text-ink">{MOOD_LABEL[entry.mood]}</span>}
    >
      {entry ? (
        <>
          <p className="display line-clamp-4 text-lg leading-snug italic">
            “{entry.body || entry.title || "An entry without words."}”
          </p>
          <p className="mt-2 text-xs text-ink-2">{formatDay(entry.entry_on)}</p>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-ink-2">
          Nothing written yet.{" "}
          <Link href="/diary" className="underline underline-offset-2 hover:text-ink">
            One line is enough
          </Link>
        </p>
      )}
    </Tile>
  );
}

// Columns out of twelve. "n" and "w" pair up as the narrow and wide halves of a row.
export type WidgetSize = "s" | "n" | "m" | "w" | "l";
export const WIDGET_COLUMNS: Record<WidgetSize, number> = { s: 4, n: 5, m: 6, w: 7, l: 12 };
export const NEXT_WIDGET_SIZE: Record<WidgetSize, WidgetSize> = { s: "m", n: "m", m: "l", w: "l", l: "s" };

const SPAN_CLASS: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
};

// A widget that would leave a hole at the end of its row grows to close it.
export function widgetSpans(items: { size: WidgetSize }[]) {
  let used = 0;
  return items.map((item, index) => {
    const next = items[index + 1];
    const width = WIDGET_COLUMNS[item.size];
    const fits = next && used + width + WIDGET_COLUMNS[next.size] <= 12;
    const span = fits ? width : 12 - used;
    used = fits ? used + width : 0;
    return SPAN_CLASS[span]!;
  });
}

export interface WidgetDef {
  id: string;
  label: string;
  module: "Finance" | "Planner" | "Health" | "Diary";
  description: string;
  size: WidgetSize;
  chart?: boolean;
  render: (summary: HomeSummary) => React.ReactNode;
}

const chart = (id: string, label: string, module: WidgetDef["module"], description: string, Chart: (props: { className?: string }) => React.ReactNode): WidgetDef => ({
  id,
  label,
  module,
  description,
  size: "m",
  chart: true,
  render: () => <Chart className="h-full" />,
});

export const WIDGETS: WidgetDef[] = [
  { id: "safe", label: "Safe to spend", module: "Finance", description: "Today's number, until salary", size: "w", render: () => <SafeToSpendPanel /> },
  {
    id: "log",
    label: "Log it now",
    module: "Finance",
    description: "Add a transaction in seconds",
    size: "n",
    render: () => (
      <Card className="h-full" title={<PanelTitle>Log it now</PanelTitle>}>
        <QuickAdd />
      </Card>
    ),
  },
  { id: "spending", label: "Where it went", module: "Finance", description: "This month, ranked by category", size: "w", render: () => <WhereItWent className="h-full" /> },
  { id: "alerts", label: "Coming up", module: "Finance", description: "Bills, dues and overdue tasks", size: "n", render: () => <ComingUp className="h-full" /> },
  { id: "balance", label: "Net worth", module: "Finance", description: "What you own minus what you owe", size: "m", render: (s) => <BalanceWidget summary={s} /> },
  { id: "tasks", label: "Tasks due today", module: "Planner", description: "Including anything carried over", size: "m", render: (s) => <TasksWidget summary={s} /> },
  { id: "calories", label: "Calories today", module: "Health", description: "Against your target", size: "m", render: (s) => <CaloriesWidget summary={s} /> },
  { id: "water", label: "Water today", module: "Health", description: "Against your goal", size: "m", render: (s) => <WaterWidget summary={s} /> },
  { id: "mood", label: "Latest mood", module: "Diary", description: "Your last entry", size: "m", render: (s) => <MoodWidget summary={s} /> },

  chart("chart-category", "Spending by category", "Finance", "Donut chart, this month", SpendingByCategoryChart),
  chart("chart-income", "Income versus expenses", "Finance", "By month", IncomeVsExpensesChart),
  chart("chart-daily", "Daily spending", "Finance", "Last 30 days", DailySpendingChart),
  chart("chart-balance", "Balance trend", "Finance", "Last 30 days", BalanceTrendChart),
  chart("chart-compare", "This month versus last", "Finance", "Running total by day", MonthCompareChart),
  chart("chart-source", "Spending by account and app", "Finance", "This month", SpendingBySourceChart),
  chart("chart-budgets", "Budget progress", "Finance", "Against the month so far", BudgetProgressChart),
  chart("chart-subscriptions", "Subscription cost", "Finance", "Next 12 months", SubscriptionCostChart),
  chart("chart-networth", "Net worth over time", "Finance", "Recorded daily", NetWorthChart),
  chart("chart-debts", "Debts per person", "Finance", "What remains", DebtsChart),
  chart("chart-goals", "Goal progress", "Finance", "A ring for each goal", GoalProgressChart),

  chart("chart-completion", "Completion rate", "Planner", "Per day, last 30 days", CompletionRateChart),
  chart("chart-ontime", "On time versus late", "Planner", "By week", OnTimeVsLateChart),
  chart("chart-flow", "Created versus completed", "Planner", "By week", CreatedVsCompletedChart),
  chart("chart-tasks", "Tasks by category", "Planner", "All tasks", TasksByCategoryChart),

  chart("chart-calories", "Calories versus target", "Health", "Last 14 days", CaloriesVsTargetChart),
  chart("chart-macros", "Macro split", "Health", "Today, by energy", MacroSplitChart),
  chart("chart-weekly-macros", "Weekly average macros", "Health", "Grams per logged day", WeeklyMacrosChart),
  chart("chart-water", "Water per day", "Health", "Last 14 days", WaterPerDayChart),
  chart("chart-weight", "Weight trend", "Health", "All your entries", WeightTrendChart),
  chart("chart-timing", "Meal timing", "Health", "When you ate, last 30 days", MealTimingChart),

  chart("chart-mood", "Mood over time", "Diary", "Last 30 days", MoodOverTimeChart),
  chart("chart-mood-counts", "Mood counts", "Diary", "Last 30 days", MoodCountsChart),
  chart("chart-entries", "Entries written per week", "Diary", "Last 12 weeks", EntriesPerWeekChart),
];

export const DEFAULT_LAYOUT: { id: string; size: WidgetSize }[] = [
  { id: "safe", size: "w" },
  { id: "log", size: "n" },
  { id: "spending", size: "w" },
  { id: "alerts", size: "n" },
  { id: "balance", size: "m" },
  { id: "tasks", size: "m" },
  { id: "calories", size: "m" },
  { id: "mood", size: "m" },
];
