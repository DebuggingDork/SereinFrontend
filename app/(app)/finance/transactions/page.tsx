"use client";

import { Bookmark, Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { QuickAdd } from "@/components/finance/quick-add";
import {
  accountOptions,
  categoryOptions,
  useAccounts,
  useCategories,
  type Transaction,
} from "@/components/finance/shared";
import { TransactionRow } from "@/components/finance/transaction-row";
import { Button } from "@/components/ui/button";
import { MonthNav, todayMonth } from "@/components/ui/calendar";
import { TransactionForm } from "@/components/finance/transaction-form";
import { EntityForm, type FieldDef } from "@/components/ui/entity-form";
import { Select, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Card, Empty, ErrorNote, ListSkeleton, PageHeader } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useToast } from "@/components/ui/toast";
import { useRemove, useRows, useSave } from "@/lib/data";
import { inr, monthBounds, today } from "@/lib/format";

interface Template {
  id: string;
  name: string;
  kind: "income" | "expense";
  amount: number;
  category_id: string | null;
  account_id: string | null;
  payment_app: string | null;
  payee: string | null;
}

function Templates({ onSaveNew }: { onSaveNew: () => void }) {
  const { data: templates = [] } = useRows<Template>("transaction_templates", { order: [["name"]] });
  const { data: accounts = [] } = useAccounts();
  const addTx = useSave("transactions", { successMessage: "Added", alsoInvalidate: ["accounts"] });
  const remove = useRemove("transaction_templates");

  const fallback = accounts.find((a) => !a.hidden && a.kind !== "card")?.id;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {templates.map((template) => (
        <span key={template.id} className="group flex items-center rounded-full border border-line pr-1 pl-3 text-[13px]">
          <button
            type="button"
            className="pressable cursor-pointer py-1"
            onClick={() =>
              addTx.mutate({
                kind: template.kind,
                amount: template.amount,
                category_id: template.category_id,
                account_id: template.account_id ?? fallback,
                payment_app: template.payment_app,
                payee: template.payee ?? template.name,
                occurred_on: today(),
              })
            }
          >
            {template.name} · {inr(template.amount)}
          </button>
          <RowActions
            onDelete={() => remove.mutate(template.id)}
            deleteTitle={`Delete "${template.name}"?`}
            deleteBody="Past entries made from it stay as they are."
          />
        </span>
      ))}
      <Button variant="ghost" size="sm" onClick={onSaveNew}>
        <Bookmark size={13} aria-hidden /> New template
      </Button>
    </div>
  );
}

function TemplateForm({ onClose }: { onClose: () => void }) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const save = useSave("transaction_templates", { successMessage: "Template saved" });
  const fields: FieldDef[] = [
    { name: "name", label: "Name", required: true, maxLength: 40, placeholder: "Tea" },
    { name: "amount", label: "Amount", type: "number", required: true, min: 0.01, half: true },
    { name: "category_id", label: "Category", type: "select", half: true, options: categoryOptions(categories, "expense") },
    { name: "account_id", label: "Account", type: "select", half: true, options: accountOptions(accounts) },
    { name: "payee", label: "Payee", half: true },
  ];
  return (
    <Modal title="New template" onClose={onClose}>
      <EntityForm
        fields={fields}
        onCancel={onClose}
        onSubmit={async (values) => {
          await save.mutateAsync({ ...values, kind: "expense" });
          onClose();
        }}
      />
    </Modal>
  );
}

function TransactionsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [month, setMonth] = useState(todayMonth);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [checked, setChecked] = useState("");
  const [editing, setEditing] = useState<Partial<Transaction> | null>(params.get("new") ? {} : null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const { toast } = useToast();

  const { from, to } = monthBounds(month);
  const { data: rows = [], isLoading, error } = useRows<Transaction>("transactions", {
    filters: [
      ["occurred_on", "gte", from],
      ["occurred_on", "lte", to],
    ],
    order: [["occurred_on", { ascending: false }], ["created_at", { ascending: false }]],
  });
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const save = useSave("transactions", { alsoInvalidate: ["accounts"] });
  const remove = useRemove("transactions", { alsoInvalidate: ["accounts"] });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((tx) => {
      if (kind && tx.kind !== kind) return false;
      if (accountId && tx.account_id !== accountId && tx.to_account_id !== accountId) return false;
      if (categoryId && tx.category_id !== categoryId) return false;
      if (checked === "unchecked" && tx.checked) return false;
      if (checked === "checked" && !tx.checked) return false;
      if (!q) return true;
      const category = categories.find((c) => c.id === tx.category_id)?.name ?? "";
      return `${tx.payee ?? ""} ${tx.notes ?? ""} ${tx.payment_app ?? ""} ${category}`.toLowerCase().includes(q);
    });
  }, [rows, search, kind, accountId, categoryId, checked, categories]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, tx) => {
          if (tx.kind === "expense") acc.out += Number(tx.amount);
          if (tx.kind === "income") acc.in += Number(tx.amount);
          return acc;
        },
        { in: 0, out: 0 },
      ),
    [filtered],
  );

  function closeForm() {
    setEditing(null);
    if (params.get("new")) router.replace("/finance/transactions");
  }

  async function submit(values: Record<string, unknown>, mode: "primary" | "secondary") {
    await save.mutateAsync(editing?.id ? { ...values, id: editing.id } : values);
    toast("Saved");
    if (mode === "primary") closeForm();
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        action={
          <Button onClick={() => setEditing({})}>
            <Plus size={15} aria-hidden /> Add
          </Button>
        }
      />

      <Card className="mb-4">
        <QuickAdd />
        <Templates onSaveNew={() => setTemplateOpen(true)} />
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MonthNav month={month} onChange={setMonth} />
          <p className="tabular text-sm text-ink-2">
            {filtered.length} entries · <span className="text-good">+{inr(totals.in)}</span> · −{inr(totals.out)}
          </p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-1">
            <Search size={14} aria-hidden className="absolute top-3.5 left-3 text-ink-3" />
            <Input
              aria-label="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="!h-10 pl-8 text-sm"
            />
          </div>
          <Select aria-label="Type" value={kind} onChange={(e) => setKind(e.target.value)} className="!h-10 text-sm">
            <option value="">All types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </Select>
          <Select aria-label="Account" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="!h-10 text-sm">
            <option value="">All accounts</option>
            {accountOptions(accounts).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select aria-label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="!h-10 text-sm">
            <option value="">All categories</option>
            {categoryOptions(categories).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select aria-label="Checked" value={checked} onChange={(e) => setChecked(e.target.value)} className="!h-10 text-sm">
            <option value="">Checked or not</option>
            <option value="unchecked">Unchecked only</option>
            <option value="checked">Checked only</option>
          </Select>
        </div>

        <div className="mt-4">
          <ErrorNote error={error} />
          {isLoading ? (
            <ListSkeleton />
          ) : filtered.length === 0 ? (
            <Empty
              title={rows.length ? "Nothing matches those filters" : "A quiet month"}
              hint={rows.length ? "Try clearing a filter." : "Add your first entry above."}
            />
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  onEdit={() => setEditing(tx)}
                  onDuplicate={() => {
                    setEditing({ ...tx, id: undefined, occurred_on: today(), checked: false });
                  }}
                  onDelete={() => remove.mutate(tx.id)}
                  onToggleChecked={() => save.mutate({ id: tx.id, checked: !tx.checked })}
                />
              ))}
            </ul>
          )}
        </div>
      </Card>

      {editing && (
        <Modal title={editing.id ? "Edit entry" : "New entry"} onClose={closeForm}>
          <TransactionForm key={editing.id ?? "new"} initial={editing} onCancel={closeForm} onSubmit={submit} />
        </Modal>
      )}
      {templateOpen && <TemplateForm onClose={() => setTemplateOpen(false)} />}
    </>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionsContent />
    </Suspense>
  );
}
