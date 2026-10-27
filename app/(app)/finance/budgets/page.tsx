"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { categoryOptions, useCategories } from "@/components/finance/shared";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { Card, Chip, Empty, ErrorNote, ListSkeleton, PageHeader, ProgressBar } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useRpc, useSave } from "@/lib/data";
import { formatDay, inr } from "@/lib/format";

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
  if (used >= 1) return { tone: "bad" as const, label: "Over budget" };
  if (used > Number(budget.elapsed) + 0.1) return { tone: "warn" as const, label: "Ahead of pace" };
  return { tone: "good" as const, label: "On pace" };
}

export default function BudgetsPage() {
  const { data = [], isLoading, error } = useRpc<BudgetProgress[]>("budget_progress");
  const { data: categories = [] } = useCategories();
  const [editing, setEditing] = useState<Partial<BudgetProgress> | null>(null);
  const save = useSave("budgets", { successMessage: "Saved" });
  const remove = useRemove("budgets");

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle="The tick marks today. If the bar has passed it, you are spending ahead of pace."
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
        <ul className="grid gap-4 lg:grid-cols-2">
          {data.map((budget) => {
            const status = pace(budget);
            return (
              <li key={budget.id}>
                <Card>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: budget.category_color }} />
                        {budget.category_name}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-3">
                        {budget.period === "weekly" ? "Weekly" : "Monthly"} · {formatDay(budget.period_start)} to{" "}
                        {formatDay(budget.period_end)}
                      </p>
                    </div>
                    <span className="flex items-center gap-1">
                      <Chip tone={status.tone}>{status.label}</Chip>
                      <RowActions
                        onEdit={() => setEditing(budget)}
                        onDelete={() => remove.mutate(budget.id)}
                        deleteTitle={`Delete the ${budget.category_name} budget?`}
                        deleteBody="Your transactions stay as they are."
                      />
                    </span>
                  </div>
                  <p className="figure mt-3 text-[28px] leading-tight">
                    {inr(Math.max(0, Number(budget.remaining)))}
                    <span className="ml-2 font-sans text-[13px] tracking-normal text-ink-3">left</span>
                  </p>
                  <div className="mt-3">
                    <ProgressBar
                      value={Number(budget.spent) / Number(budget.limit_amount)}
                      color={budget.category_color}
                      marker={Number(budget.elapsed)}
                      label={`${budget.category_name} budget used`}
                    />
                  </div>
                  <p className="tabular mt-2 text-xs text-ink-2">
                    {inr(budget.spent)} of {inr(budget.limit_amount)}
                  </p>
                </Card>
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
