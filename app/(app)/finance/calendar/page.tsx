"use client";

import { useMemo, useState } from "react";
import type { Transaction } from "@/components/finance/shared";
import { TransactionRow } from "@/components/finance/transaction-row";
import { MonthGrid, MonthNav, todayMonth } from "@/components/ui/calendar";
import { Card, PageHeader } from "@/components/ui/primitives";
import { useRows } from "@/lib/data";
import { addDays, formatDayLong, inr, inrCompact, monthBounds, today } from "@/lib/format";

export default function FinanceCalendarPage() {
  const [month, setMonth] = useState(todayMonth);
  const [selected, setSelected] = useState<string>(today());
  const { from, to } = monthBounds(month);
  const gridFrom = addDays(from, -7);
  const gridTo = addDays(to, 7);

  const { data: transactions = [] } = useRows<Transaction>("transactions", {
    filters: [
      ["occurred_on", "gte", gridFrom],
      ["occurred_on", "lte", gridTo],
    ],
  });
  const { data: scheduled = [] } = useRows<{ id: string; name: string; next_run: string; amount: number; kind: string }>(
    "scheduled_items",
    {
      filters: [
        ["active", "eq", true],
        ["next_run", "gte", gridFrom],
        ["next_run", "lte", gridTo],
      ],
    },
  );
  const { data: debts = [] } = useRows<{ id: string; person_name: string; direction: string; due_on: string; remaining: number }>(
    "debt_balances",
    {
      filters: [
        ["due_on", "gte", gridFrom],
        ["due_on", "lte", gridTo],
      ],
    },
  );

  const byDay = useMemo(() => {
    const map = new Map<string, { net: number; income: boolean; expense: boolean; due: number }>();
    const slot = (day: string) => {
      const entry = map.get(day) ?? { net: 0, income: false, expense: false, due: 0 };
      map.set(day, entry);
      return entry;
    };
    for (const tx of transactions) {
      const entry = slot(tx.occurred_on);
      if (tx.kind === "income") {
        entry.net += Number(tx.amount);
        entry.income = true;
      } else if (tx.kind === "expense") {
        entry.net -= Number(tx.amount);
        entry.expense = true;
      }
    }
    for (const item of scheduled) slot(item.next_run).due += 1;
    for (const debt of debts) if (Number(debt.remaining) > 0) slot(debt.due_on).due += 1;
    return map;
  }, [transactions, scheduled, debts]);

  const dayTransactions = transactions.filter((tx) => tx.occurred_on === selected);
  const dayScheduled = scheduled.filter((item) => item.next_run === selected);
  const dayDebts = debts.filter((debt) => debt.due_on === selected && Number(debt.remaining) > 0);

  return (
    <>
      <PageHeader title="Calendar" action={<MonthNav month={month} onChange={setMonth} />} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[1fr_22rem]">
        <Card>
          <MonthGrid
            month={month}
            selected={selected}
            onSelect={setSelected}
            renderDay={(day) => {
              const entry = byDay.get(day);
              if (!entry) return null;
              return (
                <>
                  <span className="mb-0.5 flex gap-0.5">
                    {entry.income && <span title="Income" className="size-1.5 rounded-full bg-finance" />}
                    {entry.expense && <span title="Expense" className="size-1.5 rounded-full bg-ink-3" />}
                    {entry.due > 0 && <span title="Due" className="size-1.5 rounded-full bg-health" />}
                  </span>
                  {entry.net !== 0 && (
                    <span className={`tabular hidden sm:block ${entry.net > 0 ? "text-good" : "text-ink-2"}`}>
                      {entry.net > 0 ? "+" : "−"}
                      {inrCompact(Math.abs(entry.net))}
                    </span>
                  )}
                </>
              );
            }}
          />
          <p className="mt-3 flex flex-wrap gap-4 text-xs text-ink-2">
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-finance" /> Income</span>
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-ink-3" /> Expense</span>
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-health" /> Due</span>
          </p>
        </Card>

        <Card title={formatDayLong(selected)}>
          {dayTransactions.length + dayScheduled.length + dayDebts.length === 0 ? (
            <p className="py-3 text-sm text-ink-3">Nothing on this day.</p>
          ) : (
            <>
              {(dayScheduled.length > 0 || dayDebts.length > 0) && (
                <ul className="mb-3 space-y-1.5 text-sm">
                  {dayScheduled.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.name} due</span>
                      <span className="tabular text-ink-2">{inr(item.amount)}</span>
                    </li>
                  ))}
                  {dayDebts.map((debt) => (
                    <li key={debt.id} className="flex justify-between">
                      <span>{debt.direction === "lent" ? `${debt.person_name} owes you` : `Repay ${debt.person_name}`}</span>
                      <span className="tabular text-ink-2">{inr(debt.remaining)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="divide-y divide-line">
                {dayTransactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
