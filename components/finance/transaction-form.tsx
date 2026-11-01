"use client";

import { ArrowDown, Banknote, CreditCard, Landmark, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useRows } from "@/lib/data";
import { addDays, inr, today } from "@/lib/format";
import { looksLikeLongNumber, LONG_NUMBER_WARNING } from "@/lib/guards";
import { byUse, PickChip, Segmented } from "./quick-add";
import { categoryOptions, PAYMENT_APPS, useAccounts, useCategories, type Account, type Transaction } from "./shared";

type Kind = Transaction["kind"];

const CATEGORY_CHIPS = 7;
const PAYEE_MAX = 80;
const NOTES_MAX = 500;

const AMOUNT_COLOR: Record<Kind, string> = {
  expense: "text-ink",
  income: "text-good",
  transfer: "text-planner",
};

const KIND_ICON: Record<Account["kind"], typeof Wallet> = {
  bank: Landmark,
  wallet: Wallet,
  cash: Banknote,
  card: CreditCard,
  investment: TrendingUp,
};

const ACCOUNT_LABEL: Record<Kind, string> = { expense: "Paid from", income: "Received in", transfer: "From" };

function FormRow({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <p className="mb-2 text-[13px] text-ink-2">{label}</p>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-[13px] text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

function AccountChips({
  accounts,
  value,
  onChange,
}: {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {accounts.map((account) => {
        const Icon = KIND_ICON[account.kind];
        return (
          <PickChip key={account.id} on={account.id === value} onClick={() => onChange(account.id)}>
            <Icon size={13} aria-hidden />
            {account.name}
            {account.last_four && <span className="tabular opacity-70">{account.last_four}</span>}
          </PickChip>
        );
      })}
    </div>
  );
}

export function TransactionForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial: Partial<Transaction>;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>, mode: "primary" | "secondary") => Promise<unknown>;
}) {
  const editing = Boolean(initial.id);
  const { data: allAccounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: recent = [] } = useRows<Transaction>("transactions", {
    order: [["occurred_on", { ascending: false }], ["created_at", { ascending: false }]],
    limit: 100,
  });

  const [kind, setKind] = useState<Kind>(initial.kind ?? "expense");
  const [amount, setAmount] = useState(initial.amount ? String(initial.amount) : "");
  const [payee, setPayee] = useState(initial.payee ?? "");
  const [categoryId, setCategoryId] = useState(initial.category_id ?? "");
  const [pickedAccount, setPickedAccount] = useState(initial.account_id ?? "");
  const [toAccount, setToAccount] = useState(initial.to_account_id ?? "");
  const [app, setApp] = useState(initial.payment_app ?? "");
  const [day, setDay] = useState(initial.occurred_on ?? today());
  const [time, setTime] = useState(initial.occurred_time?.slice(0, 5) ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [checked, setChecked] = useState(Boolean(initial.checked));
  const [refund, setRefund] = useState(Boolean(initial.is_refund));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"primary" | "secondary" | null>(null);
  const amountInput = useRef<HTMLInputElement>(null);

  const uses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of recent) {
      for (const id of [tx.category_id, tx.account_id]) {
        if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return counts;
  }, [recent]);

  // A hidden account stays selectable only when this entry already belongs to it.
  const accounts = byUse(allAccounts.filter((a) => !a.hidden || a.id === initial.account_id || a.id === initial.to_account_id), uses);
  const accountId = pickedAccount || accounts[0]?.id || "";

  const ranked = byUse(categories.filter((c) => c.kind === kind), uses);
  const chips = ranked.slice(0, CATEGORY_CHIPS);
  const chosen = ranked.find((c) => c.id === categoryId);
  if (chosen && !chips.includes(chosen)) chips[chips.length - 1] = chosen;

  const parsedAmount = Number(amount);
  const hasAmount = amount !== "" && parsedAmount > 0;

  function changeKind(next: Kind) {
    setKind(next);
    setCategoryId("");
    setErrors({});
  }

  function validate() {
    const found: Record<string, string> = {};
    if (!hasAmount) found.amount = "Enter an amount above zero.";
    if (!accountId) found.account = "Add an account first.";
    if (kind === "transfer") {
      if (!toAccount) found.to = "Choose where it's going.";
      else if (toAccount === accountId) found.to = "Choose a different account.";
    }
    if (!day) found.day = "Choose a date.";
    if (looksLikeLongNumber(payee)) found.payee = LONG_NUMBER_WARNING;
    if (looksLikeLongNumber(notes)) found.notes = LONG_NUMBER_WARNING;
    return found;
  }

  async function submit(mode: "primary" | "secondary") {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(mode);
    try {
      await onSubmit(
        {
          kind,
          amount: parsedAmount,
          account_id: accountId,
          to_account_id: kind === "transfer" ? toAccount : null,
          category_id: kind === "transfer" ? null : categoryId || null,
          payment_app: kind === "transfer" ? null : app || null,
          occurred_on: day,
          occurred_time: time || null,
          payee: payee.trim() || null,
          notes: notes.trim() || null,
          checked,
          is_refund: kind === "income" ? refund : false,
        },
        mode,
      );
      if (mode === "secondary") {
        setAmount("");
        setPayee("");
        setNotes("");
        amountInput.current?.focus();
      }
    } catch {
      // The mutation has already shown a toast; keep the form so nothing typed is lost.
    }
    setBusy(null);
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit("primary");
      }}
    >
      <div className="flex justify-center">
        <Segmented
          label="Type of entry"
          value={kind}
          onChange={changeKind}
          options={[
            ["expense", "Expense"],
            ["income", "Income"],
            ["transfer", "Transfer"],
          ]}
        />
      </div>

      <div className="mt-5 text-center">
        <label htmlFor="tx-amount" className="sr-only">
          Amount
        </label>
        <div className={`flex items-baseline justify-center gap-1 ${AMOUNT_COLOR[kind]}`}>
          <span aria-hidden className="figure text-[34px] leading-none opacity-60">
            ₹
          </span>
          <input
            ref={amountInput}
            id="tx-amount"
            data-autofocus
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={amount}
            aria-invalid={Boolean(errors.amount)}
            onChange={(event) => {
              setAmount(event.target.value.replace(/[^0-9.]/g, ""));
              setErrors(({ amount: _cleared, ...rest }) => rest);
            }}
            style={{ width: `${Math.max(amount.length, 1) + 0.6}ch` }}
            className="figure max-w-[80%] min-w-[1.6ch] bg-transparent text-[56px] leading-none outline-none placeholder:text-line-2"
          />
        </div>
        {errors.amount && (
          <p role="alert" className="mt-1 text-[13px] text-bad">
            {errors.amount}
          </p>
        )}
      </div>

      <div className="mt-6 space-y-5">
        <FormRow label={ACCOUNT_LABEL[kind]} error={errors.account}>
          <AccountChips accounts={accounts} value={accountId} onChange={setPickedAccount} />
        </FormRow>

        {kind === "transfer" ? (
          <>
            <div aria-hidden className="-my-2 flex justify-center text-ink-2">
              <ArrowDown size={16} />
            </div>
            <FormRow label="To" error={errors.to}>
              <AccountChips accounts={accounts.filter((a) => a.id !== accountId)} value={toAccount} onChange={setToAccount} />
            </FormRow>
          </>
        ) : (
          <FormRow label="Category">
            <div className="flex flex-wrap items-center gap-1.5">
              {chips.map((category) => (
                <PickChip
                  key={category.id}
                  on={category.id === categoryId}
                  dot={category.color}
                  onClick={() => setCategoryId(category.id === categoryId ? "" : category.id)}
                >
                  {category.name}
                </PickChip>
              ))}
              {ranked.length > CATEGORY_CHIPS && (
                <Select
                  aria-label="All categories"
                  value=""
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="!h-8 !w-auto !rounded-full !py-0 !pr-7 !pl-3 !text-[13px]"
                >
                  <option value="">More</option>
                  {categoryOptions(categories, kind === "income" ? "income" : "expense").map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </FormRow>
        )}

        <FormRow label="When" error={errors.day}>
          <div className="flex flex-wrap items-center gap-1.5">
            <PickChip on={day === today()} onClick={() => setDay(today())}>
              Today
            </PickChip>
            <PickChip on={day === addDays(today(), -1)} onClick={() => setDay(addDays(today(), -1))}>
              Yesterday
            </PickChip>
            <input
              type="date"
              aria-label="Date"
              value={day}
              onChange={(event) => setDay(event.target.value)}
              className="h-8 rounded-full border border-line bg-field px-3 text-[13px] outline-none focus:border-ink-3"
            />
            <input
              type="time"
              aria-label="Time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="h-8 rounded-full border border-line bg-field px-3 text-[13px] outline-none focus:border-ink-3"
            />
          </div>
        </FormRow>

        {kind !== "transfer" && (
          <FormRow label="Paid with">
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_APPS.map((name) => (
                <PickChip key={name} on={app === name} onClick={() => setApp(app === name ? "" : name)}>
                  {name}
                </PickChip>
              ))}
            </div>
          </FormRow>
        )}

        <Field label={kind === "income" ? "From who" : "To who"} htmlFor="tx-payee" error={errors.payee}>
          <Input
            id="tx-payee"
            value={payee}
            maxLength={PAYEE_MAX}
            placeholder={kind === "income" ? "Acme Corp" : "Rapido"}
            onChange={(event) => setPayee(event.target.value)}
          />
        </Field>

        <Field label="Note" htmlFor="tx-notes" error={errors.notes}>
          <Textarea
            id="tx-notes"
            rows={2}
            value={notes}
            maxLength={NOTES_MAX}
            placeholder="If there's a story behind it"
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>

        <div className="space-y-2 text-sm">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="size-4 accent-[var(--finance)]" />
            Matches my bank statement
          </label>
          {kind === "income" && (
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={refund} onChange={(event) => setRefund(event.target.checked)} className="size-4 accent-[var(--finance)]" />
              This is a refund
            </label>
          )}
        </div>
      </div>

      {/* Stays in view, so saving never means scrolling to the end of the form first. */}
      <div className="sticky -bottom-6 -mx-6 -mb-6 mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface px-6 py-4">
        <Button type="button" variant="ghost" className="max-sm:hidden" onClick={onCancel}>
          Cancel
        </Button>
        {!editing && (
          <Button type="button" variant="soft" disabled={busy !== null} onClick={() => void submit("secondary")}>
            Save and add another
          </Button>
        )}
        <Button type="submit" disabled={busy !== null}>
          {hasAmount ? `Save ${inr(parsedAmount)}` : "Save"}
        </Button>
      </div>
    </form>
  );
}
