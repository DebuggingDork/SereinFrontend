"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { BarsChart } from "@/components/charts/marks";
import { accountOptions, useAccounts } from "@/components/finance/shared";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { Card, Chip, Empty, ErrorNote, ListSkeleton, PageHeader, ProgressBar, StatTile } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useRows, useRpc, useRpcAction, useSave } from "@/lib/data";
import { formatDay, inr, inrCompact, relativeDay, today } from "@/lib/format";

interface DebtBalance {
  id: string;
  person_id: string;
  person_name: string;
  direction: "lent" | "borrowed";
  amount: number;
  opened_on: string;
  due_on: string | null;
  notes: string | null;
  paid: number;
  remaining: number;
}

interface Payment {
  id: string;
  debt_id: string;
  amount: number;
  paid_on: string;
}

function DebtCard({
  debt,
  payments,
  onEdit,
  onDelete,
  onRepay,
}: {
  debt: DebtBalance;
  payments: Payment[];
  onEdit: () => void;
  onDelete: () => void;
  onRepay: () => void;
}) {
  const settled = Number(debt.remaining) <= 0;
  const overdue = !settled && debt.due_on && debt.due_on < today();
  return (
    <li className="py-3.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span>{debt.direction === "lent" ? `${debt.person_name} owes you` : `You owe ${debt.person_name}`}</span>
          {settled && <Chip tone="good">Settled</Chip>}
          {overdue && <Chip tone="bad">{relativeDay(debt.due_on!)}</Chip>}
          {!settled && !overdue && debt.due_on && <Chip>{relativeDay(debt.due_on)}</Chip>}
        </span>
        <span className="tabular shrink-0 text-ink-2">
          {inr(debt.paid)} / {inr(debt.amount)}
        </span>
      </div>
      <div className="mt-2">
        <ProgressBar
          value={Number(debt.paid) / Number(debt.amount)}
          color="var(--finance)"
          label={`Repaid to ${debt.person_name}`}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs text-ink-3">
          From {formatDay(debt.opened_on)}
          {debt.notes && ` · ${debt.notes}`}
          {payments.length > 0 && ` · last repaid ${formatDay(payments[0]!.paid_on)}`}
        </p>
        <span className="flex items-center gap-1">
          {!settled && (
            <Button size="sm" variant="soft" onClick={onRepay}>
              Record repayment
            </Button>
          )}
          <RowActions
            onEdit={onEdit}
            onDelete={onDelete}
            deleteTitle="Delete this debt?"
            deleteBody="Its repayment history goes with it. Linked transactions stay."
          />
        </span>
      </div>
    </li>
  );
}

export default function DebtsPage() {
  const { data: debts = [], isLoading, error } = useRows<DebtBalance>("debt_balances", {
    order: [["due_on", { ascending: true, nullsFirst: false }]],
  });
  const { data: payments = [] } = useRows<Payment>("debt_payments", { order: [["paid_on", { ascending: false }]] });
  const { data: people = [] } = useRows<{ id: string; name: string }>("people", { order: [["name"]] });
  const { data: accounts = [] } = useAccounts();
  const { data: byPerson = [], isLoading: loadingChart, error: chartError } = useRpc<
    { person: string; owed_to_me: number; i_owe: number }[]
  >("debts_by_person");

  const [editing, setEditing] = useState<Partial<DebtBalance> | null>(null);
  const [repaying, setRepaying] = useState<DebtBalance | null>(null);
  const [person, setPerson] = useState<string | null>(null);

  const saveDebt = useSave("debts", { successMessage: "Saved", alsoInvalidate: ["debt_balances"] });
  const removeDebt = useRemove("debts", { alsoInvalidate: ["debt_balances", "debt_payments"] });
  const addPerson = useSave("people");
  const repay = useRpcAction<{ p_debt_id: string; p_amount: number; p_paid_on: string; p_account_id: string | null }>(
    "record_debt_payment",
    {
      invalidate: ["debt_balances", "debt_payments", "transactions", "accounts"],
      successMessage: "Repayment recorded",
    },
  );

  const open = debts.filter((d) => Number(d.remaining) > 0);
  const owedToMe = open.filter((d) => d.direction === "lent").reduce((s, d) => s + Number(d.remaining), 0);
  const iOwe = open.filter((d) => d.direction === "borrowed").reduce((s, d) => s + Number(d.remaining), 0);

  const shown = useMemo(() => (person ? debts.filter((d) => d.person_name === person) : debts), [debts, person]);
  const paymentsFor = (id: string) => payments.filter((p) => p.debt_id === id);

  // Finds or creates the person, so typing a new name just works.
  async function personIdFor(name: string) {
    const existing = people.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;
    const created = await addPerson.mutateAsync({ name });
    return created.id;
  }

  const names = [...new Set(debts.map((d) => d.person_name))];

  return (
    <>
      <PageHeader
        title="Debts and credits"
        subtitle="Who owes you, whom you owe, how much, and by when."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus size={15} aria-hidden /> Add
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4">
        <StatTile label="Owed to you" value={inr(owedToMe)} />
        <StatTile label="You owe" value={inr(iOwe)} />
      </div>

      <ErrorNote error={error} />

      {names.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Button size="sm" variant={person ? "ghost" : "primary"} onClick={() => setPerson(null)}>
            Everyone
          </Button>
          {names.map((name) => (
            <Button key={name} size="sm" variant={person === name ? "primary" : "ghost"} onClick={() => setPerson(name)}>
              {name}
            </Button>
          ))}
        </div>
      )}

      {isLoading ? (
        <ListSkeleton />
      ) : shown.length === 0 ? (
        <Card>
          <Empty title="All square" hint="Nobody owes anybody. Add a loan when that changes." />
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <ul className="divide-y divide-line">
              {shown.map((debt) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  payments={paymentsFor(debt.id)}
                  onEdit={() => setEditing(debt)}
                  onDelete={() => removeDebt.mutate(debt.id)}
                  onRepay={() => setRepaying(debt)}
                />
              ))}
            </ul>
          </Card>
          <ChartCard
            title="Remaining by person"
            loading={loadingChart}
            error={chartError}
            empty={byPerson.length === 0}
            emptyHint="All settled."
            legend={[
              { label: "Owed to you", color: "var(--finance)" },
              { label: "You owe", color: "var(--planner)" },
            ]}
            table={{
              columns: ["Person", "Owed to you", "You owe"],
              rows: byPerson.map((r) => [r.person, inr(r.owed_to_me), inr(r.i_owe)]),
            }}
          >
            <BarsChart
              data={byPerson.map((r) => ({ ...r, owed_to_me: Number(r.owed_to_me), i_owe: Number(r.i_owe) }))}
              x="person"
              series={[
                { key: "owed_to_me", label: "Owed to you", color: "var(--finance)" },
                { key: "i_owe", label: "You owe", color: "var(--planner)" },
              ]}
              format={inr}
              axisFormat={inrCompact}
            />
          </ChartCard>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? "Edit debt" : "New debt"} onClose={() => setEditing(null)}>
          <EntityForm
            initial={{ direction: "lent", opened_on: today(), ...editing }}
            fields={[
              { name: "person_name", label: "Person", required: true, maxLength: 60, placeholder: "Ravi" },
              {
                name: "direction",
                label: "Direction",
                type: "select",
                required: true,
                half: true,
                options: [
                  { value: "lent", label: "I lent money" },
                  { value: "borrowed", label: "I borrowed money" },
                ],
              },
              { name: "amount", label: "Amount", type: "number", required: true, min: 0.01, half: true },
              { name: "opened_on", label: "Date", type: "date", required: true, half: true },
              { name: "due_on", label: "Due date", type: "date", half: true },
              { name: "notes", label: "Notes", maxLength: 200 },
            ]}
            onCancel={() => setEditing(null)}
            onSubmit={async ({ person_name, ...values }) => {
              const person_id = await personIdFor(String(person_name));
              await saveDebt.mutateAsync({ ...values, person_id, ...(editing.id ? { id: editing.id } : {}) });
              setEditing(null);
            }}
          />
        </Modal>
      )}

      {repaying && (
        <Modal title="Record repayment" onClose={() => setRepaying(null)}>
          <p className="mb-4 text-sm text-ink-2">
            {inr(repaying.remaining)} left {repaying.direction === "lent" ? `from ${repaying.person_name}` : `to ${repaying.person_name}`}.
          </p>
          <EntityForm
            submitLabel="Record"
            initial={{ amount: repaying.remaining, paid_on: today() }}
            fields={[
              { name: "amount", label: "Amount", type: "number", required: true, min: 0.01, max: Number(repaying.remaining), half: true },
              { name: "paid_on", label: "Date", type: "date", required: true, half: true },
              {
                name: "account_id",
                label: "Also record in account",
                type: "select",
                options: accountOptions(accounts),
                hint: "Optional. Creates the matching transaction and moves the balance.",
              },
            ]}
            onCancel={() => setRepaying(null)}
            onSubmit={async (values) => {
              await repay.mutateAsync({
                p_debt_id: repaying.id,
                p_amount: Number(values.amount),
                p_paid_on: String(values.paid_on),
                p_account_id: (values.account_id as string | null) ?? null,
              });
              setRepaying(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}

