"use client";

import { NotebookPen } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRows, useSave } from "@/lib/data";
import { addDays, inr, today } from "@/lib/format";
import { looksLikeLongNumber, LONG_NUMBER_WARNING } from "@/lib/guards";
import { useProfile } from "@/lib/profile";
import { PAYMENT_APPS, useAccounts, useCategories, type Account, type Category, type Transaction } from "./shared";

interface Parsed {
  amount: number;
  payee: string;
  account?: Account;
  category?: Category;
  app?: string;
}

// Rule-based: "200 rapido from HDFC" or "450 groceries paytm". Nothing leaves the browser.
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

  // Connecting words only go when removing an account or app left them dangling at an end.
  const dangling = "(?:from|via|using|on|with|paid|for|at)";
  rest = rest
    .replace(/\s+/g, " ")
    .trim()
    .replace(new RegExp(`^(?:${dangling}\\s+)+|(?:\\s+${dangling})+$`, "gi"), "")
    .trim();

  const words = rest.toLowerCase();
  const category = categories
    .filter((c) => c.kind === "expense")
    .find((c) => words.includes(c.name.toLowerCase()));

  return { amount, payee: rest, account, category, app };
}

type Kind = "expense" | "income";

const CATEGORY_CHIPS = 6;

function byUse<T extends { id: string }>(items: T[], uses: Map<string, number>) {
  return [...items].sort((a, b) => (uses.get(b.id) ?? 0) - (uses.get(a.id) ?? 0));
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex rounded-full bg-surface-2 p-0.5">
      {options.map(([option, text]) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`pressable h-8 cursor-pointer rounded-full px-3 text-[13px] ${
            value === option ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:text-ink"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function PickChip({
  on,
  dot,
  onClick,
  children,
}: {
  on: boolean;
  dot?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`pressable flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] ${
        on ? "border-transparent bg-inverse text-on-inverse" : "border-line text-ink-2 hover:border-line-2 hover:text-ink"
      }`}
    >
      {dot && <span className="size-2 rounded-full" style={{ background: dot }} aria-hidden />}
      {children}
    </button>
  );
}

export function QuickAdd({ autoFocus }: { autoFocus?: boolean }) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<Kind>("expense");
  const [day, setDay] = useState<"today" | "yesterday">("today");
  const [pickedCategory, setPickedCategory] = useState<string | null>(null);
  const [pickedAccount, setPickedAccount] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const { data: profile } = useProfile();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: recent = [] } = useRows<Transaction>("transactions", {
    order: [["occurred_on", { ascending: false }], ["created_at", { ascending: false }]],
    limit: 100,
  });
  const save = useSave("transactions", { successMessage: "Saved", alsoInvalidate: ["accounts"] });

  const unsafe = looksLikeLongNumber(text) || looksLikeLongNumber(note);
  const parsed = useMemo(
    () => (looksLikeLongNumber(text) ? null : parseQuickEntry(text, accounts, categories)),
    [text, accounts, categories],
  );

  const sameKind = useMemo(() => recent.filter((tx) => tx.kind === kind), [recent, kind]);
  const payee = parsed?.payee.toLowerCase();
  // The last time this payee came up decides the defaults, so repeat spends need no tapping.
  const remembered = payee ? sameKind.find((tx) => tx.payee?.toLowerCase() === payee) : undefined;

  const visibleAccounts = accounts.filter((a) => !a.hidden && (kind === "expense" || a.kind !== "card"));
  const salaryAccount = kind === "income" ? visibleAccounts.find((a) => a.id === profile?.preferences.salaryAccountId) : undefined;
  const fallback = visibleAccounts.find((a) => a.kind !== "card" && a.kind !== "investment") ?? visibleAccounts[0];
  const accountId =
    pickedAccount ??
    parsed?.account?.id ??
    remembered?.account_id ??
    salaryAccount?.id ??
    sameKind[0]?.account_id ??
    fallback?.id ??
    null;
  const categoryId = pickedCategory ?? (kind === "expense" ? parsed?.category?.id : undefined) ?? remembered?.category_id ?? null;

  const uses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of sameKind) {
      for (const id of [tx.category_id, tx.account_id]) {
        if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return counts;
  }, [sameKind]);

  const ranked = byUse(categories.filter((c) => c.kind === kind), uses);
  const chips = ranked.slice(0, CATEGORY_CHIPS);
  const chosen = ranked.find((c) => c.id === categoryId);
  if (chosen && !chips.includes(chosen)) chips[chips.length - 1] = chosen;

  function changeKind(next: Kind) {
    setKind(next);
    setPickedCategory(null);
    setPickedAccount(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!parsed || !accountId || unsafe) return;
    setSaving(true);
    try {
      await save.mutateAsync({
        kind,
        amount: parsed.amount,
        account_id: accountId,
        category_id: categoryId,
        payment_app: parsed.app ?? null,
        payee: parsed.payee || null,
        notes: note.trim() || null,
        occurred_on: day === "today" ? today() : addDays(today(), -1),
      });
      setText("");
      setNote("");
      setDay("today");
      setPickedCategory(null);
      setPickedAccount(null);
      input.current?.focus();
    } catch {
      // The mutation toast explains; keep the text so nothing is lost.
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          label="Type of entry"
          value={kind}
          onChange={changeKind}
          options={[
            ["expense", "Spent"],
            ["income", "Received"],
          ]}
        />
        <Segmented
          label="Day"
          value={day}
          onChange={setDay}
          options={[
            ["today", "Today"],
            ["yesterday", "Yesterday"],
          ]}
        />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          ref={input}
          aria-label={kind === "expense" ? "Quick add an expense" : "Quick add income"}
          value={text}
          autoFocus={autoFocus}
          onChange={(event) => setText(event.target.value)}
          placeholder={kind === "expense" ? "200 rapido from HDFC" : "82000 salary"}
          className="h-12 min-w-0 flex-1 rounded-full border border-line bg-field px-5 text-base outline-none transition-colors placeholder:text-ink-3 focus:border-ink-3"
        />
        <Button type="submit" size="lg" className="!h-12 !px-5" disabled={!parsed || !accountId || saving || unsafe}>
          {parsed ? `Add ${inr(parsed.amount)}` : "Add"}
        </Button>
      </div>
      {unsafe && (
        <p role="alert" className="mt-2 text-[13px] text-bad">
          {LONG_NUMBER_WARNING}
        </p>
      )}

      {ranked.length > 0 && (
        <div role="group" aria-label="Category" className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((category) => (
            <PickChip
              key={category.id}
              on={category.id === categoryId}
              dot={category.color}
              onClick={() => setPickedCategory(category.id === categoryId ? null : category.id)}
            >
              {category.name}
            </PickChip>
          ))}
        </div>
      )}

      {visibleAccounts.length > 1 && (
        <div role="group" aria-label="Account" className="mt-2 flex flex-wrap gap-1.5">
          {byUse(visibleAccounts, uses).map((account) => (
            <PickChip key={account.id} on={account.id === accountId} onClick={() => setPickedAccount(account.id)}>
              {account.name}
            </PickChip>
          ))}
        </div>
      )}

      <label className="mt-3 flex h-10 items-center gap-2.5 rounded-xl border border-transparent bg-surface-2 px-3 transition-colors focus-within:border-line-2">
        <NotebookPen size={14} className="shrink-0 text-ink-2" aria-hidden />
        <span className="sr-only">Note</span>
        <input
          value={note}
          maxLength={500}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add a note, if there is a story"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-2"
        />
      </label>
    </form>
  );
}
