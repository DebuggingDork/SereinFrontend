"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/primitives";
import { useSave } from "@/lib/data";
import { inr, today } from "@/lib/format";
import { looksLikeLongNumber, LONG_NUMBER_WARNING } from "@/lib/guards";
import { PAYMENT_APPS, useAccounts, useCategories, type Account, type Category } from "./shared";

interface Parsed {
  amount: number;
  payee: string;
  account?: Account;
  category?: Category;
  app?: string;
}

// Rule-based: "200 rapido from HDFC" or "450 groceries paytm". Nothing leaves the
// browser. The card below shows what was understood before anything is saved.
export function parseQuickEntry(text: string, accounts: Account[], categories: Category[]): Parsed | null {
  const match = text.match(/(?:₹|rs\.?\s*)?(\d[\d,]*(?:\.\d{1,2})?)/i);
  if (!match?.[1]) return null;
  const amount = Number(match[1].replace(/,/g, ""));
  if (!amount) return null;

  let rest = text.replace(match[0], " ");
  const lower = rest.toLowerCase();

  const account = accounts.find(
    (a) =>
      !a.hidden &&
      (lower.includes(a.name.toLowerCase()) || (a.bank_name && lower.includes(a.bank_name.toLowerCase()))),
  );
  if (account) {
    for (const token of [account.name, account.bank_name]) {
      if (token) rest = rest.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), " ");
    }
  }

  const app = PAYMENT_APPS.find((name) => rest.toLowerCase().includes(name.toLowerCase()));
  if (app) rest = rest.replace(new RegExp(app, "i"), " ");

  rest = rest.replace(/\b(from|via|using|on|with|paid|for|at)\b/gi, " ").replace(/\s+/g, " ").trim();

  const words = rest.toLowerCase();
  const category = categories
    .filter((c) => c.kind === "expense")
    .find((c) => words.includes(c.name.toLowerCase()));

  return { amount, payee: rest, account, category, app };
}

export function QuickAdd({ autoFocus }: { autoFocus?: boolean }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const save = useSave("transactions", { successMessage: "Saved", alsoInvalidate: ["accounts"] });

  const unsafe = looksLikeLongNumber(text);
  const parsed = useMemo(
    () => (unsafe ? null : parseQuickEntry(text, accounts, categories)),
    [text, accounts, categories, unsafe],
  );
  const fallback = accounts.find((a) => !a.hidden && a.kind !== "card" && a.kind !== "investment") ?? accounts[0];
  const account = parsed?.account ?? fallback;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!parsed || !account) return;
    setSaving(true);
    try {
      await save.mutateAsync({
        kind: "expense",
        amount: parsed.amount,
        account_id: account.id,
        category_id: parsed.category?.id ?? null,
        payment_app: parsed.app ?? null,
        payee: parsed.payee || null,
        occurred_on: today(),
      });
      setText("");
    } catch {
      // The mutation toast explains; keep the text so nothing is lost.
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit}>
      <div className="flex gap-2">
        <input
          aria-label="Quick add an expense"
          value={text}
          autoFocus={autoFocus}
          onChange={(event) => setText(event.target.value)}
          placeholder="200 rapido from HDFC"
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-field px-4 text-[15px] outline-none transition-colors placeholder:text-ink-3 focus:border-ink-3"
        />
        <Button type="submit" size="lg" className="!px-5" disabled={!parsed || !account || saving}>
          Add
        </Button>
      </div>
      {unsafe && (
        <p role="alert" className="mt-2 text-[13px] text-bad">
          {LONG_NUMBER_WARNING}
        </p>
      )}
      {parsed && (
        <div className="fade-in mt-2.5 flex flex-wrap items-center gap-1.5">
          <Chip tone="finance">{inr(parsed.amount)}</Chip>
          {parsed.payee && <Chip>{parsed.payee}</Chip>}
          <Chip>{account ? account.name : "Add an account first"}</Chip>
          {parsed.category && <Chip>{parsed.category.name}</Chip>}
          {parsed.app && <Chip>{parsed.app}</Chip>}
        </div>
      )}
    </form>
  );
}
