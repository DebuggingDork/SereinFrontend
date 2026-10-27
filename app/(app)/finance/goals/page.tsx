"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { accountOptions, useAccounts } from "@/components/finance/shared";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { Card, Chip, Empty, ErrorNote, ListSkeleton, PageHeader, Ring } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useRows, useSave } from "@/lib/data";
import { daysBetween, formatDay, inr, today } from "@/lib/format";

interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string | null;
  account_id: string | null;
  created_at: string;
}

function goalStatus(goal: Goal) {
  const target = Number(goal.target);
  const saved = Number(goal.saved);
  if (saved >= target) return { tone: "good" as const, label: "Done", perMonth: 0 };
  if (!goal.deadline) return { tone: "neutral" as const, label: "No deadline", perMonth: null };

  const daysLeft = daysBetween(today(), goal.deadline);
  if (daysLeft <= 0) return { tone: "bad" as const, label: "Past deadline", perMonth: target - saved };

  const perMonth = (target - saved) / Math.max(daysLeft / 30.44, 1);
  const totalDays = Math.max(daysBetween(goal.created_at.slice(0, 10), goal.deadline), 1);
  const expected = target * (1 - daysLeft / totalDays);
  if (saved >= expected * 1.1) return { tone: "good" as const, label: "Ahead", perMonth };
  if (saved >= expected * 0.9) return { tone: "finance" as const, label: "On track", perMonth };
  return { tone: "warn" as const, label: "Behind", perMonth };
}

export default function GoalsPage() {
  const { data: goals = [], isLoading, error } = useRows<Goal>("goals", { order: [["deadline", { nullsFirst: false }]] });
  const { data: accounts = [] } = useAccounts();
  const [editing, setEditing] = useState<Partial<Goal> | null>(null);
  const [adding, setAdding] = useState<Goal | null>(null);
  const save = useSave("goals", { successMessage: "Saved" });
  const remove = useRemove("goals");

  return (
    <>
      <PageHeader
        title="Goals"
        subtitle="Big plans, turned into a monthly number."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus size={15} aria-hidden /> Add
          </Button>
        }
      />
      <ErrorNote error={error} />
      {isLoading ? (
        <ListSkeleton />
      ) : goals.length === 0 ? (
        <Card>
          <Empty title="No goals yet" hint="A laptop, a trip, an emergency fund. Give it a number and a date." />
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const status = goalStatus(goal);
            const progress = Number(goal.saved) / Number(goal.target);
            return (
              <li key={goal.id}>
                <Card className="h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate">{goal.name}</p>
                      <p className="text-xs text-ink-3">{goal.deadline ? `By ${formatDay(goal.deadline, { month: "short", year: "numeric" })}` : "Whenever"}</p>
                    </div>
                    <RowActions
                      onEdit={() => setEditing(goal)}
                      onDelete={() => remove.mutate(goal.id)}
                      deleteTitle={`Delete ${goal.name}?`}
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <Ring value={progress} color="var(--finance)" size={84} thickness={8}>
                      <span className="tabular">{Math.round(progress * 100)}%</span>
                    </Ring>
                    <div className="min-w-0">
                      <p className="figure text-2xl leading-tight">{inr(goal.saved)}</p>
                      <p className="text-xs text-ink-3">of {inr(goal.target)}</p>
                      <Chip tone={status.tone} className="mt-1.5">
                        {status.label}
                      </Chip>
                    </div>
                  </div>
                  {status.perMonth !== null && status.perMonth > 0 && (
                    <p className="mt-3 text-[13px] text-ink-2">
                      Save <span className="tabular text-ink">{inr(status.perMonth)}</span> a month to get there.
                    </p>
                  )}
                  <Button size="sm" variant="soft" className="mt-3" onClick={() => setAdding(goal)}>
                    Add money
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <Modal title={editing.id ? `Edit ${editing.name}` : "New goal"} onClose={() => setEditing(null)}>
          <EntityForm
            initial={{ saved: 0, ...editing }}
            fields={[
              { name: "name", label: "Name", required: true, maxLength: 60, placeholder: "Emergency fund" },
              { name: "target", label: "Target", type: "number", required: true, min: 1, half: true },
              { name: "saved", label: "Saved so far", type: "number", required: true, min: 0, half: true },
              { name: "deadline", label: "Deadline", type: "date", half: true },
              { name: "account_id", label: "Linked account", type: "select", half: true, options: accountOptions(accounts) },
            ]}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await save.mutateAsync(editing.id ? { ...values, id: editing.id } : values);
              setEditing(null);
            }}
          />
        </Modal>
      )}

      {adding && (
        <Modal title={`Add to ${adding.name}`} onClose={() => setAdding(null)}>
          <EntityForm
            submitLabel="Add"
            fields={[{ name: "amount", label: "Amount", type: "number", required: true, min: 0.01 }]}
            onCancel={() => setAdding(null)}
            onSubmit={async (values) => {
              await save.mutateAsync({ id: adding.id, saved: Number(adding.saved) + Number(values.amount) });
              setAdding(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
