"use client";

import { useMemo } from "react";
import type { FieldDef } from "@/components/ui/entity-form";
import { useRows } from "@/lib/data";
import { today } from "@/lib/format";

export interface Account {
  id: string;
  name: string;
  kind: "bank" | "wallet" | "cash" | "card" | "investment";
  bank_name: string | null;
  last_four: string | null;
  balance: number;
  credit_limit: number | null;
  statement_day: number | null;
  due_day: number | null;
  hidden: boolean;
}

export interface Category {
  id: string;
  name: string;
  kind: "expense" | "income";
  icon: string;
  color: string;
  parent_id: string | null;
  archived: boolean;
}

export interface Transaction {
  id: string;
  kind: "income" | "expense" | "transfer";
  amount: number;
  category_id: string | null;
  account_id: string;
  to_account_id: string | null;
  payment_app: string | null;
  occurred_on: string;
  occurred_time: string | null;
  payee: string | null;
  notes: string | null;
  checked: boolean;
  is_refund: boolean;
  is_adjustment: boolean;
  tags: string[];
}

export const useAccounts = () => useRows<Account>("accounts", { order: [["hidden"], ["name"]] });
export const useCategories = () =>
  useRows<Category>("categories", { filters: [["archived", "eq", false]], order: [["name"]] });

export const PAYMENT_APPS = ["GPay", "PhonePe", "Paytm", "Card", "Cash", "Netbanking"];

export function accountOptions(accounts: Account[] = []) {
  return accounts.filter((a) => !a.hidden).map((a) => ({
    value: a.id,
    label: a.last_four ? `${a.name} •••• ${a.last_four}` : a.name,
  }));
}

export function categoryOptions(categories: Category[] = [], kind?: "expense" | "income") {
  const parents = new Map(categories.map((c) => [c.id, c.name]));
  return categories
    .filter((c) => !kind || c.kind === kind)
    .map((c) => ({
      value: c.id,
      label: c.parent_id ? `${parents.get(c.parent_id)} / ${c.name}` : c.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function useTransactionFields(): FieldDef[] {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  return useMemo<FieldDef[]>(
    () => [
      {
        name: "kind",
        label: "Type",
        type: "select",
        required: true,
        half: true,
        options: [
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" },
          { value: "transfer", label: "Transfer" },
        ],
      },
      { name: "amount", label: "Amount", type: "number", required: true, min: 0.01, half: true, placeholder: "0" },
      { name: "account_id", label: "Account", type: "select", required: true, half: true, options: accountOptions(accounts) },
      {
        name: "to_account_id",
        label: "To account",
        type: "select",
        required: true,
        half: true,
        options: accountOptions(accounts),
        when: (values) => values.kind === "transfer",
      },
      {
        name: "category_id",
        label: "Category",
        type: "select",
        half: true,
        options: categoryOptions(categories, "expense"),
        when: (values) => values.kind === "expense",
      },
      {
        name: "income_category_id",
        label: "Category",
        type: "select",
        half: true,
        options: categoryOptions(categories, "income"),
        when: (values) => values.kind === "income",
      },
      {
        name: "payment_app",
        label: "Paid with",
        type: "select",
        half: true,
        options: PAYMENT_APPS.map((app) => ({ value: app, label: app })),
        when: (values) => values.kind !== "transfer",
      },
      { name: "occurred_on", label: "Date", type: "date", required: true, half: true },
      { name: "occurred_time", label: "Time", type: "time", half: true },
      { name: "payee", label: "Payee or source", maxLength: 80, placeholder: "Who was this?" },
      { name: "notes", label: "Notes", type: "textarea", maxLength: 500 },
      { name: "checked", label: "Checked against bank statement", type: "checkbox" },
      { name: "is_refund", label: "This is a refund", type: "checkbox", when: (values) => values.kind === "income" },
    ],
    [accounts, categories],
  );
}

// The form splits category by type; the table keeps one column.
export function transactionPayload(values: Record<string, unknown>) {
  const { income_category_id, ...rest } = values;
  return {
    ...rest,
    category_id: values.kind === "income" ? income_category_id : values.category_id,
    is_refund: values.kind === "income" ? Boolean(values.is_refund) : false,
  };
}

export function transactionFormInitial(tx?: Partial<Transaction>) {
  return {
    kind: "expense",
    occurred_on: today(),
    checked: false,
    ...tx,
    income_category_id: tx?.kind === "income" ? tx.category_id : undefined,
  };
}

export const KIND_SIGN = { income: "+", expense: "−", transfer: "" } as const;
