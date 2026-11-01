"use client";

import { ArrowLeftRight, CheckCircle2, Circle } from "lucide-react";
import { RowActions } from "@/components/ui/row-actions";
import { Chip } from "@/components/ui/primitives";
import { formatDay, formatTime, inrExact } from "@/lib/format";
import { KIND_SIGN, useAccounts, useCategories, type Transaction } from "./shared";

export function TransactionRow({
  tx,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleChecked,
}: {
  tx: Transaction;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onToggleChecked?: () => void;
}) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const account = accounts.find((a) => a.id === tx.account_id);
  const toAccount = accounts.find((a) => a.id === tx.to_account_id);
  const category = categories.find((c) => c.id === tx.category_id);

  const title =
    tx.kind === "transfer"
      ? `${account?.name ?? "Account"} to ${toAccount?.name ?? "account"}`
      : tx.payee || category?.name || (tx.kind === "income" ? "Income" : "Expense");

  return (
    <li className="flex items-center gap-3 py-2.5">
      {onToggleChecked && (
        <button
          type="button"
          role="switch"
          aria-checked={tx.checked}
          aria-label="Checked against bank statement"
          title={tx.checked ? "Checked against statement" : "Not checked yet"}
          onClick={onToggleChecked}
          className="pressable cursor-pointer text-ink-3 hover:text-ink"
        >
          {tx.checked ? <CheckCircle2 size={17} className="text-good" aria-hidden /> : <Circle size={17} aria-hidden />}
        </button>
      )}
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs"
        style={{ background: `color-mix(in srgb, ${category?.color ?? "var(--ink-3)"} 16%, transparent)` }}
        aria-hidden
      >
        {tx.kind === "transfer" ? (
          <ArrowLeftRight size={13} />
        ) : (
          <span className="size-2 rounded-full" style={{ background: category?.color ?? "var(--ink-3)" }} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{title}</p>
        <p className="truncate text-xs text-ink-3">
          {formatDay(tx.occurred_on)}
          {tx.occurred_time && ` · ${formatTime(tx.occurred_time)}`}
          {tx.kind !== "transfer" && account && ` · ${account.name}`}
          {tx.payment_app && ` · ${tx.payment_app}`}
          {category && tx.payee && ` · ${category.name}`}
        </p>
        {tx.notes && (
          <p title={tx.notes} className="display mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-2 italic">
            {tx.notes}
          </p>
        )}
      </div>
      {tx.is_refund && <Chip tone="good">Refund</Chip>}
      {tx.is_adjustment && <Chip>Adjustment</Chip>}
      <span className={`tabular text-sm ${tx.kind === "income" ? "text-good" : ""}`}>
        {KIND_SIGN[tx.kind]}
        {inrExact(tx.amount)}
      </span>
      {(onEdit || onDelete) && (
        <RowActions
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          deleteTitle="Delete this entry?"
          deleteBody="Its amount goes back to the account balance."
        />
      )}
    </li>
  );
}
