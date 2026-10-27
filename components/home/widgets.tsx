"use client";

import Link from "next/link";
import { ChartCard } from "@/components/charts/chart-card";
import { DonutChart } from "@/components/charts/marks";
import { Chip, ProgressBar, Ring, Skeleton } from "@/components/ui/primitives";
import { useRows, useRpc } from "@/lib/data";
import { formatDay, inr, monthBounds, number, relativeDay, today } from "@/lib/format";

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
  children,
  aside,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-line bg-surface p-5">
      <div className="mb-2 flex items-center justify-between gap-2 text-[13px]">
        <Link href={href} className="text-ink-2 underline-offset-2 hover:text-ink hover:underline">
          {title}
        </Link>
        {aside}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

type WidgetProps = { summary: HomeSummary };

function BalanceWidget({ summary }: WidgetProps) {
  return (
    <Tile title="Net worth" href="/finance/net-worth">
      <p className="figure text-[34px] leading-tight">{inr(summary.net_worth?.net)}</p>
      <p className="mt-2 text-[13px] text-ink-2">
        {inr(summary.net_worth?.assets)} owned · {inr(summary.net_worth?.liabilities)} owed
      </p>
    </Tile>
  );
}

const SAFE_TONE = { comfortable: "good", tight: "warn", over: "bad" } as const;

function SafeToSpendWidget({ summary }: WidgetProps) {
  const safe = summary.safe_to_spend;
  return (
    <Tile
      title="Safe to spend today"
      href="/finance"
      aside={safe && <Chip tone={SAFE_TONE[safe.status]}>{safe.status[0]!.toUpperCase() + safe.status.slice(1)}</Chip>}
    >
      <p className="figure text-[34px] leading-tight">{inr(Math.max(0, Number(safe?.per_day ?? 0)))}</p>
      <p className="mt-2 text-[13px] text-ink-2">
        {inr(summary.spent_today)} spent today · {safe?.days_left ?? 0} days to salary
      </p>
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
      aside={summary.task_streak > 0 && <span className="text-[13px] text-planner">{summary.task_streak}-day streak</span>}
    >
      {tasks.length === 0 ? (
        <p className="mt-2 text-sm text-ink-3">{total > 0 ? "All done. Go outside." : "Nothing due today."}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {tasks.map((task) => (
            <li key={task.id} className="flex justify-between gap-2">
              <span className="truncate">{task.title}</span>
              {task.due_on && task.due_on < today() && (
                <span className="shrink-0 text-xs text-warn">{relativeDay(task.due_on)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {total > 0 && (
        <div className="mt-3">
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
    <Tile title="Calories today" href="/diet">
      <div className="flex items-center gap-4">
        <Ring value={eaten / target} color="var(--diet)" size={64}>
          <span className="tabular text-xs">{Math.round((eaten / target) * 100)}%</span>
        </Ring>
        <div>
          <p className="text-sm">
            <span className="figure text-2xl">{number(eaten)}</span> / {number(target)} kcal
          </p>
          <p className="tabular text-xs text-ink-2">
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
    <Tile title="Water today" href="/diet/water">
      <p className="figure text-[34px] leading-tight">{number(summary.water_ml)} ml</p>
      <div className="mt-3">
        <ProgressBar value={Number(summary.water_ml) / goal} color="var(--diet)" label="Water goal" />
      </div>
      <p className="mt-2 text-[13px] text-ink-2">of {number(goal)} ml</p>
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
      aside={entry?.mood && <Chip tone="diary">{MOOD_LABEL[entry.mood]}</Chip>}
    >
      {entry ? (
        <>
          <p className="display line-clamp-3 text-[15px] leading-snug italic">
            “{entry.body || entry.title || "An entry without words."}”
          </p>
          <p className="mt-2 text-xs text-ink-3">{formatDay(entry.entry_on)}</p>
        </>
      ) : (
        <p className="text-sm text-ink-3">Nothing written yet. One line is enough.</p>
      )}
    </Tile>
  );
}

function SpendingWidget() {
  const { from, to } = monthBounds();
  const { data = [], isLoading, error } = useRpc<{ category: string; color: string; total: number }[]>(
    "spending_by_category",
    { p_from: from, p_to: to },
  );
  return (
    <ChartCard
      title="Spending this month"
      loading={isLoading}
      error={error}
      empty={data.length === 0}
      emptyHint="Add an expense and it appears here."
      legend={data.slice(0, 5).map((r) => ({ label: r.category, color: r.color }))}
      table={{ columns: ["Category", "Spent"], rows: data.map((r) => [r.category, inr(r.total)]) }}
      className="h-full"
    >
      <DonutChart
        height={180}
        data={data.map((r) => ({ name: r.category, value: Number(r.total), color: r.color }))}
        format={inr}
        center={<span className="figure text-lg">{inr(data.reduce((s, r) => s + Number(r.total), 0))}</span>}
      />
    </ChartCard>
  );
}

function AlertsWidget() {
  const { data = [], isLoading } = useRpc<
    { kind: string; title: string; due_on: string | null; amount: number | null; severity: string; href: string }[]
  >("upcoming_alerts");
  return (
    <Tile title="Coming up" href="/finance/scheduled">
      {isLoading ? (
        <Skeleton className="h-16" />
      ) : data.length === 0 ? (
        <p className="text-sm text-ink-3">Nothing needs you this week.</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {data.slice(0, 5).map((alert, index) => (
            <li key={index}>
              <Link href={alert.href} className="flex justify-between gap-3 hover:opacity-75">
                <span className="truncate">{alert.title}</span>
                {alert.due_on && (
                  <span className={`shrink-0 text-xs ${alert.severity === "high" ? "text-bad" : "text-ink-3"}`}>
                    {relativeDay(alert.due_on)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}

export type WidgetSize = "s" | "m" | "l";

export interface WidgetDef {
  id: string;
  label: string;
  module: string;
  description: string;
  render: (summary: HomeSummary) => React.ReactNode;
}

export const WIDGETS: WidgetDef[] = [
  { id: "balance", label: "Net worth", module: "Finance", description: "What you own minus what you owe", render: (s) => <BalanceWidget summary={s} /> },
  { id: "safe", label: "Safe to spend", module: "Finance", description: "Today's number, until salary", render: (s) => <SafeToSpendWidget summary={s} /> },
  { id: "spending", label: "Spending donut", module: "Finance", description: "This month by category", render: () => <SpendingWidget /> },
  { id: "alerts", label: "Coming up", module: "Finance", description: "Bills, dues and overdue tasks", render: () => <AlertsWidget /> },
  { id: "tasks", label: "Tasks due today", module: "Planner", description: "Including anything carried over", render: (s) => <TasksWidget summary={s} /> },
  { id: "calories", label: "Calories today", module: "Diet", description: "Against your target", render: (s) => <CaloriesWidget summary={s} /> },
  { id: "water", label: "Water today", module: "Diet", description: "Against your goal", render: (s) => <WaterWidget summary={s} /> },
  { id: "mood", label: "Latest mood", module: "Diary", description: "Your last entry", render: (s) => <MoodWidget summary={s} /> },
];

export const DEFAULT_LAYOUT: { id: string; size: WidgetSize }[] = [
  { id: "balance", size: "m" },
  { id: "tasks", size: "m" },
  { id: "calories", size: "m" },
  { id: "mood", size: "m" },
];
