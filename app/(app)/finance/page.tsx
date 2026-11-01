"use client";

import { Banknote, CreditCard, Landmark, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { ChartCard } from "@/components/charts/chart-card";
import { TrendChart } from "@/components/charts/marks";
import { useMonthCompare } from "@/components/finance/month-compare";
import { ComingUp, PanelLink, PanelTitle, SafeToSpendPanel, WhereItWent } from "@/components/finance/panels";
import { QuickAdd } from "@/components/finance/quick-add";
import { useAccounts, type Account, type Transaction } from "@/components/finance/shared";
import { TransactionRow } from "@/components/finance/transaction-row";
import { Card, Empty, PageHeader, ProgressBar, Skeleton } from "@/components/ui/primitives";
import { useRows, useRpc } from "@/lib/data";
import { formatDay, inr, inrCompact, today } from "@/lib/format";

const KIND_ICONS: Record<Account["kind"], typeof Wallet> = {
  bank: Landmark,
  wallet: Wallet,
  cash: Banknote,
  card: CreditCard,
  investment: TrendingUp,
};

function AccountTile({ account }: { account: Account }) {
  const Icon = KIND_ICONS[account.kind];
  const isCard = account.kind === "card";
  const limit = Number(account.credit_limit ?? 0);

  return (
    <Link href="/finance/accounts" className="pressable block rounded-2xl bg-surface-2 p-4 transition-colors hover:bg-line">
      <div className="flex items-center gap-2 text-[13px] text-ink-2">
        <Icon size={14} aria-hidden className="shrink-0" />
        <span className="truncate">{account.name}</span>
        {account.last_four && <span className="tabular ml-auto shrink-0">•••• {account.last_four}</span>}
      </div>
      <p className="figure mt-2.5 text-[26px] leading-tight">{inr(account.balance)}</p>
      {isCard && (
        <div className="mt-2">
          {limit > 0 && <ProgressBar value={Number(account.balance) / limit} color="var(--warn)" label={`${account.name} limit used`} />}
          <p className="mt-1.5 text-xs text-ink-2">{limit > 0 ? `Due, of ${inr(limit)} limit` : "Due on this card"}</p>
        </div>
      )}
    </Link>
  );
}

function YourMoney() {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: worth } = useRpc<{ assets: number; liabilities: number; net: number }[]>("net_worth_now");
  const visible = accounts.filter((account) => !account.hidden);
  if (!isLoading && visible.length === 0) return null;

  return (
    <Card
      title={
        <span className="flex flex-wrap items-baseline gap-x-3">
          <PanelTitle>Your money</PanelTitle>
          <Link href="/finance/net-worth" className="text-sm text-ink-2 hover:text-ink">
            Net worth <span className="tabular text-ink">{inr(worth?.[0]?.net)}</span>
          </Link>
        </span>
      }
      action={<PanelLink href="/finance/accounts">Manage</PanelLink>}
    >
      {isLoading ? (
        <Skeleton className="h-24" />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
          {visible.map((account) => (
            <AccountTile key={account.id} account={account} />
          ))}
        </div>
      )}
    </Card>
  );
}

function ThisMonthChart() {
  const { query, points } = useMonthCompare();
  const hasSpend = points.some((point) => (point.thisMonth ?? 0) > 0 || (point.lastMonth ?? 0) > 0);

  return (
    <ChartCard
      title="This month against last"
      subtitle="Running total by day of the month"
      loading={query.isLoading}
      error={query.error}
      empty={!hasSpend}
      emptyHint="Spending shows up here as you log it."
      legend={[
        { label: "This month", color: "var(--finance)" },
        { label: "Last month", color: "var(--ink-3)" },
      ]}
    >
      <TrendChart
        data={points}
        x="day"
        series={[
          { key: "thisMonth", label: "This month", color: "var(--finance)" },
          { key: "lastMonth", label: "Last month", color: "var(--ink-3)" },
        ]}
        format={inr}
        axisFormat={inrCompact}
        height={240}
      />
    </ChartCard>
  );
}

function RecentTransactions() {
  const { data = [], isLoading } = useRows<Transaction>("transactions", {
    order: [["occurred_on", { ascending: false }], ["created_at", { ascending: false }]],
    limit: 7,
  });
  return (
    <Card title={<PanelTitle>Recent</PanelTitle>} action={<PanelLink href="/finance/transactions">See all</PanelLink>}>
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
    <Card title={<PanelTitle>Budgets</PanelTitle>} action={<PanelLink href="/finance/budgets">Manage</PanelLink>}>
      {isLoading ? (
        <Skeleton className="h-24" />
      ) : data.length === 0 ? (
        <p className="py-4 text-sm leading-relaxed text-ink-2">No budgets yet. Set one to see your pace against the month.</p>
      ) : (
        <ul className="space-y-4">
          {data.slice(0, 4).map((budget) => {
            const left = Number(budget.limit_amount) - Number(budget.spent);
            return (
              <li key={budget.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate">{budget.category_name}</span>
                  <span className={`tabular shrink-0 ${left < 0 ? "text-bad" : "text-ink-2"}`}>
                    {left < 0 ? `${inr(-left)} over` : `${inr(left)} left`}
                  </span>
                </div>
                <ProgressBar
                  value={Number(budget.spent) / Number(budget.limit_amount)}
                  color={budget.category_color}
                  marker={Number(budget.elapsed)}
                  label={`${budget.category_name} budget`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function MonthHeader() {
  const { query, spent, spentLastMonthSoFar } = useMonthCompare();
  const month = formatDay(today(), { month: "long" });
  const difference = spent - spentLastMonthSoFar;

  let subtitle = "Log what you spend and your month takes shape here.";
  if (query.isLoading) subtitle = " ";
  else if (spentLastMonthSoFar > 0 && difference < 0) subtitle = `${inr(-difference)} less than this point last month.`;
  else if (spentLastMonthSoFar > 0 && difference > 0) subtitle = `${inr(difference)} more than this point last month.`;
  else if (spentLastMonthSoFar > 0) subtitle = "The same as this point last month.";

  return <PageHeader title={query.isLoading ? "Overview" : `${inr(spent)} spent in ${month}`} subtitle={subtitle} />;
}

export default function FinanceOverviewPage() {
  return (
    <>
      <MonthHeader />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SafeToSpendPanel />
        </div>
        <Card className="lg:col-span-5" title={<PanelTitle>Log it now</PanelTitle>}>
          <QuickAdd />
        </Card>

        <div className="lg:col-span-12">
          <YourMoney />
        </div>

        <div className="min-w-0 lg:col-span-7">
          <ThisMonthChart />
        </div>
        <WhereItWent className="lg:col-span-5" />

        <div className="lg:col-span-7">
          <RecentTransactions />
        </div>
        <div className="grid content-start gap-4 lg:col-span-5">
          <ComingUp moneyOnly />
          <BudgetsSummary />
        </div>
      </div>
    </>
  );
}
