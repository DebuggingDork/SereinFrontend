"use client";

import { ArrowLeftRight, Eye, EyeOff, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ACCOUNT_FIELDS, ACCOUNT_KIND_LABEL, accountPayload } from "@/components/finance/account-fields";
import { AccountArt, accountArtFromForm } from "@/components/finance/account-art";
import { accountOptions, useAccounts, type Account } from "@/components/finance/shared";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { Card, Chip, Empty, ErrorNote, ListSkeleton, PageHeader, StatTile } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useSave } from "@/lib/data";
import { inr, today } from "@/lib/format";

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
        <ul className="grid gap-x-5 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            return (
              <li key={account.id}>
                <div className={account.hidden ? "opacity-60" : ""}>
                  <AccountArt
                    kind={account.kind}
                    name={account.name}
                    bank={account.bank_name}
                    lastFour={account.last_four}
                    balance={Number(account.balance)}
                    limit={account.credit_limit}
                    dueLabel={account.due_day ? nextDue(account.due_day) : null}
                  />
                  <div className="mt-2 flex items-center justify-between gap-2 px-1">
                    <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-2">
                      <span>{ACCOUNT_KIND_LABEL[account.kind]}</span>
                      {account.statement_day && <span>Statement {nextDue(account.statement_day)}</span>}
                      {account.hidden && <Chip>Hidden from totals</Chip>}
                    </p>
                    <span className="flex shrink-0 items-center">
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
                </div>
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
