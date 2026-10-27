"use client";

import { ArrowLeftRight, Eye, EyeOff, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { accountOptions, useAccounts, type Account } from "@/components/finance/shared";
import { Button } from "@/components/ui/button";
import { EntityForm, type FieldDef } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { Card, Chip, Empty, ErrorNote, ListSkeleton, PageHeader, ProgressBar, StatTile } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useSave } from "@/lib/data";
import { inr, today } from "@/lib/format";

const KIND_LABEL: Record<Account["kind"], string> = {
  bank: "Bank",
  wallet: "Wallet",
  cash: "Cash",
  card: "Credit card",
  investment: "Investment",
};

const isCard = (values: Record<string, unknown>) => values.kind === "card";

export const ACCOUNT_FIELDS: FieldDef[] = [
  {
    name: "kind",
    label: "Type",
    type: "select",
    required: true,
    half: true,
    options: Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label })),
  },
  { name: "name", label: "Nickname", required: true, half: true, maxLength: 60, placeholder: "Salary account" },
  { name: "bank_name", label: "Bank or provider", half: true, maxLength: 60, placeholder: "HDFC" },
  {
    name: "last_four",
    label: "Last four digits",
    half: true,
    maxLength: 4,
    inputMode: "numeric",
    placeholder: "4092",
    hint: "Only ever the last four.",
  },
  {
    name: "balance",
    label: "Balance today",
    type: "number",
    required: true,
    half: true,
    when: (v) => !isCard(v),
  },
  { name: "credit_limit", label: "Credit limit", type: "number", min: 0, half: true, when: isCard },
  { name: "card_used", label: "Amount used", type: "number", min: 0, required: true, half: true, when: isCard },
  { name: "statement_day", label: "Statement day", type: "number", min: 1, max: 31, half: true, when: isCard },
  { name: "due_day", label: "Due day", type: "number", min: 1, max: 31, half: true, when: isCard },
];

export function accountPayload(values: Record<string, unknown>) {
  const { card_used, ...rest } = values;
  return { ...rest, balance: values.kind === "card" ? card_used : values.balance };
}

function nextDue(day: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), Math.min(day, 28));
  if (date.getDate() < now.getDate()) date.setMonth(date.getMonth() + 1);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function AccountsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: accounts = [], isLoading, error } = useAccounts();
  const [editing, setEditing] = useState<Partial<Account> | null>(params.get("new") ? {} : null);
  const [transferring, setTransferring] = useState(false);
  const save = useSave("accounts", { successMessage: "Saved" });
  const remove = useRemove("accounts");
  const transfer = useSave("transactions", { successMessage: "Transferred", alsoInvalidate: ["accounts"] });

  const visible = accounts.filter((a) => !a.hidden);
  const held = visible.filter((a) => a.kind !== "card").reduce((sum, a) => sum + Number(a.balance), 0);
  const dues = visible.filter((a) => a.kind === "card").reduce((sum, a) => sum + Number(a.balance), 0);

  function close() {
    setEditing(null);
    if (params.get("new")) router.replace("/finance/accounts");
  }

  return (
    <>
      <PageHeader
        title="Accounts and cards"
        subtitle="Nicknames, last four digits and balances you type. Never a full number."
        action={
          <>
            <Button variant="soft" onClick={() => setTransferring(true)} disabled={visible.length < 2}>
              <ArrowLeftRight size={14} aria-hidden /> Transfer
            </Button>
            <Button onClick={() => setEditing({})}>
              <Plus size={15} aria-hidden /> Add
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4">
        <StatTile label="Combined balance" value={inr(held)} />
        <StatTile label="Card dues" value={inr(dues)} />
      </div>

      <ErrorNote error={error} />
      {isLoading ? (
        <ListSkeleton />
      ) : accounts.length === 0 ? (
        <Card>
          <Empty title="No accounts yet" hint="Add where your money sits, and the balance you see today." />
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {accounts.map((account) => {
            const used = Number(account.balance);
            const limit = Number(account.credit_limit ?? 0);
            return (
              <li key={account.id}>
                <Card className={account.hidden ? "opacity-60" : ""}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate">{account.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
                        {KIND_LABEL[account.kind]}
                        {account.bank_name && ` · ${account.bank_name}`}
                        {account.last_four && <Chip tone="finance" className="font-mono">•••• {account.last_four}</Chip>}
                        {account.hidden && <Chip>Hidden from totals</Chip>}
                      </p>
                    </div>
                    <span className="flex items-center">
                      <button
                        type="button"
                        aria-label={account.hidden ? "Show in totals" : "Hide from totals"}
                        title={account.hidden ? "Show in totals" : "Hide from totals"}
                        onClick={() => save.mutate({ id: account.id, hidden: !account.hidden })}
                        className="pressable cursor-pointer rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
                      >
                        {account.hidden ? <Eye size={14} aria-hidden /> : <EyeOff size={14} aria-hidden />}
                      </button>
                      <RowActions
                        onEdit={() => setEditing(account)}
                        onDelete={() => remove.mutate(account.id)}
                        deleteTitle={`Delete ${account.name}?`}
                        deleteBody="Accounts with transactions cannot be deleted. Hide them from totals instead."
                      />
                    </span>
                  </div>

                  {account.kind === "card" ? (
                    <div className="mt-3">
                      <p className="figure text-[28px] leading-tight">{inr(used)}</p>
                      <p className="text-xs text-ink-3">
                        used{limit > 0 && ` of ${inr(limit)} · ${Math.round((used / limit) * 100)}%`}
                      </p>
                      {limit > 0 && (
                        <div className="mt-3">
                          <ProgressBar
                            value={used / limit}
                            color={used / limit > 0.8 ? "var(--bad)" : "var(--finance)"}
                            label="Credit used"
                          />
                        </div>
                      )}
                      <p className="mt-3 flex gap-4 text-xs text-ink-2">
                        {account.statement_day && <span>Statement: {nextDue(account.statement_day)}</span>}
                        {account.due_day && <span>Due: {nextDue(account.due_day)}</span>}
                      </p>
                    </div>
                  ) : (
                    <p className="figure mt-3 text-[28px] leading-tight">{inr(account.balance)}</p>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <Modal title={editing.id ? `Edit ${editing.name}` : "New account"} onClose={close}>
          <EntityForm
            fields={ACCOUNT_FIELDS}
            initial={{ kind: "bank", balance: 0, ...editing, card_used: editing.kind === "card" ? editing.balance : 0 }}
            onCancel={close}
            onSubmit={async (values) => {
              const payload = accountPayload(values);
              await save.mutateAsync(editing.id ? { ...payload, id: editing.id } : payload);
              close();
            }}
          />
        </Modal>
      )}

      {transferring && (
        <Modal title="Transfer" onClose={() => setTransferring(false)}>
          <EntityForm
            submitLabel="Transfer"
            initial={{ occurred_on: today() }}
            fields={[
              { name: "account_id", label: "From", type: "select", required: true, half: true, options: accountOptions(accounts) },
              { name: "to_account_id", label: "To", type: "select", required: true, half: true, options: accountOptions(accounts) },
              { name: "amount", label: "Amount", type: "number", required: true, min: 0.01, half: true },
              { name: "occurred_on", label: "Date", type: "date", required: true, half: true },
            ]}
            onCancel={() => setTransferring(false)}
            onSubmit={async (values) => {
              await transfer.mutateAsync({ ...values, kind: "transfer" });
              setTransferring(false);
            }}
          />
        </Modal>
      )}
    </>
  );
}

export default function AccountsPage() {
  return (
    <Suspense>
      <AccountsContent />
    </Suspense>
  );
}
