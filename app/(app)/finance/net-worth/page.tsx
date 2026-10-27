"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { AreaTrendChart } from "@/components/charts/marks";
import { useAccounts, type Account } from "@/components/finance/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Card, PageHeader, StatTile } from "@/components/ui/primitives";
import { useRows, useRpc, useRpcAction, useSave } from "@/lib/data";
import { inr, inrCompact, shortDay, today } from "@/lib/format";

function ReconcileRow({ account }: { account: Account }) {
  const [actual, setActual] = useState("");
  const adjust = useSave("transactions", { successMessage: "Adjustment added", alsoInvalidate: ["accounts"] });

  const expected = Number(account.balance);
  const entered = actual.trim() === "" ? null : Number(actual);
  const difference = entered === null || Number.isNaN(entered) ? null : entered - expected;
  const isCard = account.kind === "card";

  function addAdjustment() {
    if (!difference) return;
    // On a card, a higher real balance means more was spent than was logged.
    const asExpense = isCard ? difference > 0 : difference < 0;
    adjust.mutate(
      {
        kind: asExpense ? "expense" : "income",
        amount: Math.abs(difference),
        account_id: account.id,
        occurred_on: today(),
        payee: "Balance adjustment",
        is_adjustment: true,
        checked: true,
      },
      { onSuccess: () => setActual("") },
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate text-sm">{account.name}</p>
        <p className="tabular text-xs text-ink-3">
          Expected {inr(expected)}
          {isCard && " used"}
        </p>
      </div>
      <Input
        aria-label={`Real balance of ${account.name}`}
        inputMode="decimal"
        placeholder="Real balance"
        value={actual}
        onChange={(event) => setActual(event.target.value)}
        className="!h-9 !w-32 text-sm"
      />
      {difference !== null &&
        (difference === 0 ? (
          <span className="text-[13px] text-good">Matches</span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="tabular text-[13px] text-warn">
              {difference > 0 ? "+" : "−"}
              {inr(Math.abs(difference))}
            </span>
            <Button size="sm" variant="soft" onClick={addAdjustment} disabled={adjust.isPending}>
              Add adjustment
            </Button>
          </span>
        ))}
    </li>
  );
}

export default function NetWorthPage() {
  const { data: now } = useRpc<{ assets: number; liabilities: number; net: number }[]>("net_worth_now");
  const { data: accounts = [] } = useAccounts();
  const { data: snapshots = [], isLoading, error } = useRows<{ taken_on: string; assets: number; liabilities: number }>(
    "net_worth_snapshots",
    { order: [["taken_on"]], limit: 365 },
  );
  const capture = useRpcAction<Record<string, never>>("capture_net_worth", { invalidate: ["net_worth_snapshots"] });

  useEffect(() => {
    // Opening this page records today's point, so the trend has history from day one.
    capture.mutate({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const series = useMemo(
    () =>
      snapshots.map((row) => ({
        day: row.taken_on,
        net: Number(row.assets) - Number(row.liabilities),
      })),
    [snapshots],
  );

  const current = now?.[0];
  const trackable = accounts.filter((a) => !a.hidden);

  return (
    <>
      <PageHeader title="Net worth" subtitle="What you own, minus what you owe." />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatTile label="Net worth" value={inr(current?.net)} />
        <StatTile label="Assets" value={inr(current?.assets)} note="Balances, plus money lent" />
        <StatTile label="Liabilities" value={inr(current?.liabilities)} note="Card dues, plus money borrowed" />
      </div>

      <ChartCard
        title="Net worth over time"
        loading={isLoading}
        error={error}
        empty={series.length < 2}
        emptyHint="A point is recorded every day. Come back tomorrow for your first line."
        table={{ columns: ["Date", "Net worth"], rows: series.map((row) => [shortDay(row.day), inr(row.net)]) }}
        className="mb-4"
      >
        <AreaTrendChart
          data={series}
          x="day"
          xFormat={shortDay}
          series={{ key: "net", label: "Net worth", color: "var(--finance)" }}
          format={inr}
          axisFormat={inrCompact}
          height={280}
        />
      </ChartCard>

      <Card title="Check against your bank">
        <p className="-mt-2 mb-2 text-[13px] leading-relaxed text-ink-2">
          Type the balance your bank shows. A difference usually means a forgotten expense, and one tap settles it.
        </p>
        {trackable.length === 0 ? (
          <p className="py-3 text-sm text-ink-3">Add an account to reconcile it.</p>
        ) : (
          <ul className="divide-y divide-line">
            {trackable.map((account) => (
              <ReconcileRow key={account.id} account={account} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
