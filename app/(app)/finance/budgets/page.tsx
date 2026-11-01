"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { categoryOptions, useCategories } from "@/components/finance/shared";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { Card, Chip, Empty, ErrorNote, ListSkeleton, PageHeader } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useRpc, useSave } from "@/lib/data";
import { daysBetween, formatDay, inr, today } from "@/lib/format";

interface BudgetProgress {
  id: string;
  category_id: string;
  category_name: string;
  category_color: string;
  period: "weekly" | "monthly";
  limit_amount: number;
  spent: number;
  remaining: number;
  period_start: string;
  period_end: string;
  elapsed: number;
}

function pace(budget: BudgetProgress) {
  const used = Number(budget.spent) / Number(budget.limit_amount);
  if (used >= 1) return { tone: "bad" as const, label: used > 1 ? "Over budget" : "All used" };
  if (used > Number(budget.elapsed) + 0.1) return { tone: "warn" as const, label: "Ahead of pace" };
  return { tone: "good" as const, label: "On pace" };
}

const usedShare = (budget: BudgetProgress) => Number(budget.spent) / Number(budget.limit_amount);
const daysLeft = (budget: BudgetProgress) => Math.max(1, daysBetween(today(), budget.period_end) + 1);
const dayCount = (days: number) => `${days} more day${days === 1 ? "" : "s"}`;

function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: BudgetProgress;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = pace(budget);
  const remaining = Number(budget.remaining);
  const over = remaining < 0;
  const days = daysLeft(budget);
  const used = usedShare(budget);
  const color = over ? "var(--bad)" : budget.category_color;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-line bg-surface p-5 transition-colors hover:border-line-2 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${budget.category_color} 16%, transparent)` }}
        >
          <span className="size-2.5 rounded-full" style={{ background: budget.category_color }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate leading-snug">{budget.category_name}</p>
          <p className="mt-0.5 truncate text-xs text-ink-2">
            {budget.period === "weekly" ? "This week" : "This month"} · {days} day{days === 1 ? "" : "s"} left
          </p>
        </div>
        <RowActions
          onEdit={onEdit}
          onDelete={onDelete}
          deleteTitle={`Delete the ${budget.category_name} budget?`}
          deleteBody="Your transactions stay as they are."
        />
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className={`figure truncate text-[34px] leading-none ${over ? "text-bad" : ""}`}>{inr(Math.abs(remaining))}</p>
          <p className="mt-1.5 text-[13px] text-ink-2">
            {over ? "over" : "left"} of {inr(budget.limit_amount)}
          </p>
        </div>
        <Chip tone={status.tone}>{status.label}</Chip>
      </div>

      <div
        role="progressbar"
        aria-label={`${budget.category_name} budget used`}
        aria-valuenow={Math.round(Math.min(1, used) * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative mt-5 h-2 rounded-full bg-surface-2"
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${Math.min(1, used) * 100}%`, background: color }}
        />
        <span
          title="Today"
          className="absolute -top-1 h-4 w-0.5 rounded-full bg-ink"
          style={{ left: `${Math.min(1, Number(budget.elapsed)) * 100}%` }}
        />
      </div>

      <div className="tabular mt-3 flex items-center justify-between gap-3 text-[13px] text-ink-2">
        <span>{inr(budget.spent)} spent</span>
        <span>{over || remaining === 0 ? "Nothing left to spend" : `About ${inr(remaining / days)} a day`}</span>
      </div>
    </div>
  );
}

function BudgetSummary({ budgets }: { budgets: BudgetProgress[] }) {
  // Weekly and monthly limits can't be added up honestly, so this speaks for whichever has more.
  const monthly = budgets.filter((b) => b.period === "monthly");
  const group = monthly.length >= budgets.length - monthly.length ? monthly : budgets.filter((b) => b.period === "weekly");
  const first = group[0];
  if (!first) return null;

  const limit = group.reduce((sum, b) => sum + Number(b.limit_amount), 0);
  const spent = group.reduce((sum, b) => sum + Number(b.spent), 0);
  const left = limit - spent;
  const used = limit > 0 ? spent / limit : 0;
  const elapsed = Math.min(1, Number(first.elapsed));
  const days = daysLeft(first);
  const period = first.period === "weekly" ? "week" : "month";
  const counts = group.reduce(
    (tally, budget) => {
      tally[pace(budget).tone] += 1;
      return tally;
    },
    { good: 0, warn: 0, bad: 0 },
  );

  return (
    <section data-theme="dark" className="mb-4 rounded-3xl p-6 text-ink sm:p-8" style={{ background: "#0e3b2e" }}>
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
        <div>
          <p className="text-[15px] text-[#c5dcd2]">Left to spend this {period}</p>
          <p className={`figure mt-2 text-[clamp(2.75rem,6vw,3.75rem)] leading-none ${left < 0 ? "text-[#ffb4a8]" : ""}`}>
            {left < 0 ? `${inr(-left)} over` : inr(left)}
          </p>
          <p className="mt-3 text-[#c5dcd2]">
            {Math.round(used * 100)}% of your budgets used, with {Math.round(elapsed * 100)}% of the {period} gone
            {left > 0 ? `. About ${inr(left / days)} a day for ${dayCount(days)}.` : "."}
          </p>
        </div>
        <dl className="flex gap-6 text-sm">
          {[
            ["On pace", counts.good],
            ["Ahead", counts.warn],
            ["Over", counts.bad],
          ].map(([label, count]) => (
            <div key={label}>
              <dd className="figure text-[28px] leading-none">{count}</dd>
              <dt className="mt-1.5 text-[#c5dcd2]">{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div aria-hidden className="relative mt-6 h-2.5 rounded-full bg-white/12">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${Math.min(1, used) * 100}%`, background: used > elapsed + 0.1 ? "#fbbf24" : "#4ade9f" }}
        />
        <span className="absolute -top-1 h-[18px] w-0.5 rounded-full bg-white" style={{ left: `${elapsed * 100}%` }} />
      </div>
    </section>
  );
}

export default function BudgetsPage() {
  const { data = [], isLoading, error } = useRpc<BudgetProgress[]>("budget_progress");
  const { data: categories = [] } = useCategories();
  const [editing, setEditing] = useState<Partial<BudgetProgress> | null>(null);
  const save = useSave("budgets", { successMessage: "Saved" });
  const remove = useRemove("budgets");
  // The ones that need attention come first.
  const sorted = [...data].sort((a, b) => usedShare(b) - usedShare(a));

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle="Each bar fills as you spend. Stay behind the small marker, which shows today, and you're on pace."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus size={15} aria-hidden /> Add
          </Button>
        }
      />

      <ErrorNote error={error} />
      {isLoading ? (
        <ListSkeleton />
      ) : data.length === 0 ? (
        <Card>
          <Empty title="No budgets yet" hint="Pick a category and a weekly or monthly limit." />
        </Card>
      ) : (
        <>
        <BudgetSummary budgets={data} />
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((budget) => {
            return (
              <li key={budget.id}>
                <BudgetCard budget={budget} onEdit={() => setEditing(budget)} onDelete={() => remove.mutate(budget.id)} />
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setEditing({})}
              className="pressable flex h-full min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-line-2 text-sm text-ink-2 hover:border-ink-3 hover:text-ink"
            >
              <Plus size={18} aria-hidden />
              Add another budget
            </button>
          </li>
        </ul>
        </>
      )}

      {editing && (
        <Modal title={editing.id ? "Edit budget" : "New budget"} onClose={() => setEditing(null)}>
          <EntityForm
            initial={{ period: "monthly", ...editing }}
            fields={[
              {
                name: "category_id",
                label: "Category",
                type: "select",
                required: true,
                options: categoryOptions(categories, "expense"),
              },
              {
                name: "period",
                label: "Period",
                type: "select",
                required: true,
                half: true,
                options: [
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                ],
              },
              { name: "limit_amount", label: "Limit", type: "number", required: true, min: 1, half: true },
            ]}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await save.mutateAsync(editing.id ? { ...values, id: editing.id } : values);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
