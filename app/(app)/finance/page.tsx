"use client";

import { AlertTriangle, CalendarClock, CreditCard, ListChecks, Target, Users } from "lucide-react";
import Link from "next/link";
import { ChartCard } from "@/components/charts/chart-card";
import { DonutChart } from "@/components/charts/marks";
import { QuickAdd } from "@/components/finance/quick-add";
import { TransactionRow } from "@/components/finance/transaction-row";
import { useAccounts, type Transaction } from "@/components/finance/shared";
import { Card, Chip, Empty, PageHeader, ProgressBar, Skeleton, StatTile } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { useRows, useRpc } from "@/lib/data";
import { inr, monthBounds, relativeDay } from "@/lib/format";

interface SafeToSpend {
  available: number;
  committed: number;
  set_aside: number;
  remaining: number;
  days_left: number;
  per_day: number;
  daily_average: number;
  status: "comfortable" | "tight" | "over";
}

interface Alert {
  kind: string;
  title: string;
  due_on: string | null;
  amount: number | null;
  severity: "high" | "normal";
  href: string;
}

const ALERT_ICONS: Record<string, typeof Target> = {
  bill: CalendarClock,
  card: CreditCard,
  collect: Users,
  repay: Users,
  budget: Target,
  task: ListChecks,
};

const STATUS: Record<SafeToSpend["status"], { tone: "good" | "warn" | "bad"; label: string }> = {
  comfortable: { tone: "good", label: "Comfortable" },
  tight: { tone: "warn", label: "Tight" },
  over: { tone: "bad", label: "Over" },
};

function SafeToSpendHero() {
  const { data, isLoading } = useRpc<SafeToSpend[]>("safe_to_spend");
  const safe = data?.[0];
  if (isLoading || !safe) return <Skeleton className="h-52 rounded-3xl" />;

  const status = STATUS[safe.status];
  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-[15px] text-ink-2">You can spend about</p>
          <Chip tone={status.tone}>{status.label}</Chip>
        </div>
        <p className="figure mt-2 text-[56px] leading-none">{inr(Math.max(0, Number(safe.per_day)))}</p>
        <p className="mt-2 text-sm text-ink-2">
          today, with {safe.days_left} day{safe.days_left === 1 ? "" : "s"} until salary.
        </p>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-[13px]">
        <div>
          <dt className="text-ink-3">Available</dt>
          <dd className="tabular mt-0.5">{inr(safe.available)}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Committed</dt>
          <dd className="tabular mt-0.5">{inr(safe.committed)}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Set aside</dt>
          <dd className="tabular mt-0.5">{inr(safe.set_aside)}</dd>
        </div>
      </dl>
    </Card>
  );
}

function Alerts() {
  const { data = [], isLoading } = useRpc<Alert[]>("upcoming_alerts");
  const money = data.filter((alert) => alert.kind !== "task");

  return (
    <Card title="Coming up">
      {isLoading ? (
        <Skeleton className="h-24" />
      ) : money.length === 0 ? (
        <p className="py-4 text-sm text-ink-3">Nothing due in the next seven days.</p>
      ) : (
        <ul className="space-y-1">
          {money.slice(0, 6).map((alert, index) => {
            const Icon = alert.severity === "high" ? AlertTriangle : (ALERT_ICONS[alert.kind] ?? CalendarClock);
            return (
              <li key={index}>
                <Link href={alert.href} className="flex items-center gap-3 rounded-xl py-1.5 text-sm hover:opacity-75">
                  <Icon
                    size={15}
                    aria-hidden
                    className={alert.severity === "high" ? "text-bad" : "text-ink-3"}
                  />
                  <span className="min-w-0 flex-1 truncate">{alert.title}</span>
                  {alert.amount !== null && <span className="tabular text-ink-2">{inr(alert.amount)}</span>}
                  {alert.due_on && <span className="w-20 text-right text-xs text-ink-3">{relativeDay(alert.due_on)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function SpendingDonut() {
  const { from, to } = monthBounds();
  const { data = [], isLoading, error } = useRpc<{ category: string; color: string; total: number }[]>(
    "spending_by_category",
    { p_from: from, p_to: to },
  );
  const total = data.reduce((sum, row) => sum + Number(row.total), 0);

  return (
    <ChartCard
      title="Spending by category"
      subtitle="This month"
      loading={isLoading}
      error={error}
      empty={data.length === 0}
      emptyHint="Add an expense and it appears here."
      table={{ columns: ["Category", "Spent"], rows: data.map((r) => [r.category, inr(r.total)]) }}
      legend={data.slice(0, 6).map((r) => ({ label: r.category, color: r.color }))}
    >
      <DonutChart
        data={data.map((r) => ({ name: r.category, value: Number(r.total), color: r.color }))}
        format={inr}
        center={<span className="figure text-xl">{inr(total)}</span>}
      />
    </ChartCard>
  );
}

function RecentTransactions() {
  const { data = [], isLoading } = useRows<Transaction>("transactions", {
    order: [["occurred_on", { ascending: false }], ["created_at", { ascending: false }]],
    limit: 6,
  });
  return (
    <Card
      title="Recent"
      action={
        <Link href="/finance/transactions" className="text-[13px] text-ink-2 underline-offset-2 hover:underline">
          See all
        </Link>
      }
    >
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : data.length === 0 ? (
        <Empty compact title="No entries yet" hint="Type one in the box above. It takes five seconds." />
      ) : (
        <ul className="divide-y divide-line">
          {data.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function BudgetsSummary() {
  const { data = [], isLoading } = useRpc<
    { id: string; category_name: string; spent: number; limit_amount: number; elapsed: number; category_color: string }[]
  >("budget_progress");
  return (
    <Card
      title="Budgets"
      action={
        <Link href="/finance/budgets" className="text-[13px] text-ink-2 underline-offset-2 hover:underline">
          Manage
        </Link>
      }
    >
      {isLoading ? (
        <Skeleton className="h-24" />
      ) : data.length === 0 ? (
        <p className="py-4 text-sm text-ink-3">No budgets yet. Set one to see your pace.</p>
      ) : (
        <ul className="space-y-3.5">
          {data.slice(0, 4).map((budget) => (
            <li key={budget.id}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span>{budget.category_name}</span>
                <span className="tabular text-ink-2">
                  {inr(budget.spent)} / {inr(budget.limit_amount)}
                </span>
              </div>
              <ProgressBar
                value={Number(budget.spent) / Number(budget.limit_amount)}
                color={budget.category_color}
                marker={Number(budget.elapsed)}
                label={`${budget.category_name} budget`}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function FinanceOverviewPage() {
  const { data: accounts, isLoading } = useAccounts();
  const { data: worth } = useRpc<{ assets: number; liabilities: number; net: number }[]>("net_worth_now");
  const net = worth?.[0];
  const noAccounts = !isLoading && accounts?.length === 0;

  return (
    <>
      <PageHeader title="Overview" subtitle="Where your money stands today." />

      {noAccounts && (
        <Card className="mb-4">
          <Empty
            compact
            title="Add your first account"
            hint="A nickname, the last four digits and the balance you see in your bank app. That is all Serein ever asks."
            action={<LinkButton href="/finance/accounts?new=1">Add an account</LinkButton>}
          />
        </Card>
      )}

      <Card className="mb-4">
        <QuickAdd />
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SafeToSpendHero />
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-1">
          <StatTile label="Net worth" value={inr(net?.net)} href="/finance/net-worth" note="Assets minus what you owe" />
          <StatTile label="You owe" value={inr(net?.liabilities)} href="/finance/debts" note="Cards and people" />
        </div>
        <SpendingDonut />
        <div className="grid gap-4 xl:col-span-2">
          <Alerts />
          <BudgetsSummary />
        </div>
        <div className="xl:col-span-3">
          <RecentTransactions />
        </div>
      </div>
    </>
  );
}
