"use client";

import { useRows } from "@/lib/data";

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

export const KIND_SIGN = { income: "+", expense: "−", transfer: "" } as const;
