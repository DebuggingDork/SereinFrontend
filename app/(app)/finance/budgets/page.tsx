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
  const color = over ? "var(--bad)" : budget.category_color;

  return (
    <div className="relative h-full overflow-hidden rounded-3xl border border-line bg-surface">
      {/* The card fills like a tank as the money goes. */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
        style={{
          width: `${Math.min(1, usedShare(budget)) * 100}%`,
          background: `color-mix(in srgb, ${color} 18%, transparent)`,
        }}
      />
      <div
        aria-hidden
        title="Today"
        className="absolute inset-y-0 w-px border-l border-dashed border-ink-3"
        style={{ left: `${Math.min(1, Number(budget.elapsed)) * 100}%` }}
      />

      <div className="relative flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: budget.category_color }} />
            <span className="truncate">{budget.category_name}</span>
          </p>
          <span className="flex shrink-0 items-center gap-1">
            <Chip tone={status.tone}>{status.label}</Chip>
            <RowActions
              onEdit={onEdit}
              onDelete={onDelete}
              deleteTitle={`Delete the ${budget.category_name} budget?`}
              deleteBody="Your transactions stay as they are."
            />
          </span>
        </div>

        <p className={`figure mt-4 text-[36px] leading-none ${over ? "text-bad" : ""}`}>
          {inr(Math.abs(remaining))}
          <span className="ml-2 font-sans text-sm tracking-normal text-ink-2">{over ? "over" : "left"}</span>
        </p>
        <p className="mt-2 text-sm text-ink-2">
          {over
            ? "Time to ease off for a while."
            : remaining === 0
              ? "Nothing left until this resets."
              : `About ${inr(remaining / days)} a day for ${dayCount(days)}.`}
        </p>

        <p className="tabular mt-auto pt-5 text-xs text-ink-2">
          {inr(budget.spent)} of {inr(budget.limit_amount)} · {budget.period === "weekly" ? "This week" : "This month"}, {formatDay(budget.period_start)} to {formatDay(budget.period_end)}
        </p>
      </div>
    </div>
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
        subtitle="Each card fills as you spend. Stay behind the dashed line, which marks today, and you're on pace."
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
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((budget) => {
            return (
              <li key={budget.id}>
                <BudgetCard budget={budget} onEdit={() => setEditing(budget)} onDelete={() => remove.mutate(budget.id)} />
              </li>
            );
          })}
        </ul>
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
