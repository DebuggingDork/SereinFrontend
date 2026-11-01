"use client";

import { Check, NotebookPen } from "lucide-react";
import { useEffect, useState } from "react";
import { inr } from "@/lib/format";

interface Row {
  id: string;
  payee: string;
  detail: string;
  amount: number;
  note?: string;
  income?: boolean;
  color: string;
}

interface Entry extends Row {
  typed: string;
  category: string;
}

const COLORS = { Food: "#f59e0b", Bills: "#3b82f6", Transport: "#06b6d4", Fun: "#ec4899" };
type Category = keyof typeof COLORS;

// Every figure on the panel comes from these, so the sums stay true as entries land.
const IN_ACCOUNTS = 41_040;
const BILLS = 21_400;
const GOALS = 6_000;
const DAYS_TO_SALARY = 11;
const SPENT: Record<Category, number> = { Food: 6_200, Bills: 2_300, Transport: 1_400, Fun: 900 };

const FIRST_ROWS: Row[] = [
  { id: "salary", payee: "Salary", detail: "HDFC · 31 Oct", amount: 82_000, income: true, color: "#10b981" },
  { id: "rent", payee: "Landlord", detail: "HDFC · 1 Nov", amount: 18_000, color: "#8b5cf6" },
  { id: "metro", payee: "Metro top-up", detail: "GPay · Today", amount: 150, color: COLORS.Transport },
];

const SCRIPT: (Entry & { category: Category })[] = [
  { id: "rapido", typed: "200 rapido from HDFC", payee: "Rapido", detail: "HDFC · Today", amount: 200, category: "Transport", color: COLORS.Transport },
  { id: "groceries", typed: "450 groceries paytm", payee: "Groceries", detail: "Paytm · Today", amount: 450, category: "Food", color: COLORS.Food },
  { id: "dinner", typed: "799 dinner with asha", payee: "Dinner with Asha", detail: "HDFC · Today", amount: 799, category: "Fun", note: "Her birthday. Worth it.", color: COLORS.Fun },
];

const TYPE_MS = 55;
const BEFORE_TYPING_MS = 1_300;
const BEFORE_SAVING_MS = 450;
const AFTER_SAVING_MS = 2_100;
const BEFORE_REPLAY_MS = 3_000;

export function LivePreview() {
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState(FIRST_ROWS);
  const [spent, setSpent] = useState(SPENT);

  useEffect(() => {
    // Without motion the opening state stands on its own.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let alive = true;
    let timer = 0;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = window.setTimeout(resolve, ms);
      });
    async function type(text: string, show: (value: string) => void) {
      for (let i = 1; i <= text.length && alive; i++) {
        show(text.slice(0, i));
        await wait(TYPE_MS);
      }
    }

    async function play() {
      while (alive) {
        for (const entry of SCRIPT) {
          await wait(BEFORE_TYPING_MS);
          if (!alive) return;
          await type(entry.typed, setTyped);
          if (entry.note) await type(entry.note, setNote);
          await wait(BEFORE_SAVING_MS);
          if (!alive) return;
          setTyped("");
          setNote("");
          setRows((current) => [entry, ...current].slice(0, FIRST_ROWS.length));
          setSpent((current) => ({ ...current, [entry.category]: current[entry.category] + entry.amount }));
          await wait(AFTER_SAVING_MS);
        }
        await wait(BEFORE_REPLAY_MS);
        if (!alive) return;
        setRows(FIRST_ROWS);
        setSpent(SPENT);
      }
    }
    void play();

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  const logged = Object.values(spent).reduce((sum, value) => sum + value, 0) - Object.values(SPENT).reduce((sum, value) => sum + value, 0);
  const inAccounts = IN_ACCOUNTS - logged;
  const perDay = Math.round((inAccounts - BILLS - GOALS) / DAYS_TO_SALARY);
  const monthTotal = Object.values(spent).reduce((sum, value) => sum + value, 0);
  const categories = (Object.entries(spent) as [Category, number][]).sort((a, b) => b[1] - a[1]);
  const largest = categories[0]![1];

  return (
    <div
      role="img"
      aria-label="Serein's finance dashboard. An expense is typed in, it lands in the recent list, and today's safe to spend figure drops to match."
      className="rise relative isolate"
      style={{ "--delay": "160ms" } as React.CSSProperties}
    >
      <div aria-hidden className="absolute inset-x-8 top-10 bottom-0 -z-10 rounded-full bg-[#10b981]/25 blur-3xl" />

      {/* Always dark, whichever theme the page is in: the panel is a window into the app. */}
      <div aria-hidden data-theme="dark" className="rounded-[26px] border border-line-2 bg-[#14171c] p-3 text-ink shadow-2xl sm:p-4">
        <div className="flex items-baseline justify-between gap-3 px-1.5 pt-1 pb-3">
          <p className="display text-[19px] leading-tight sm:text-[22px]">
            <span className="tabular">{inr(monthTotal)}</span> spent in November
          </p>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-2">
            <span className="size-1.5 rounded-full bg-[#4ade9f]" />
            Up to date
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-12">
          <section className="flex flex-col rounded-2xl bg-[#0e3b2e] p-5 sm:col-span-7">
            <div className="flex items-center justify-between gap-2 text-[13px] text-[#c5dcd2]">
              <span>Safe to spend today</span>
              <span className="rounded-full bg-white/12 px-2.5 py-0.5 text-xs text-ink">Comfortable</span>
            </div>
            <p key={perDay} className="figure pop-in mt-2 text-[52px] leading-none">
              {inr(perDay)}
            </p>
            <p className="mt-2 text-[13px] text-[#c5dcd2]">Salary lands in {DAYS_TO_SALARY} days, in HDFC.</p>
            <div className="mt-auto flex gap-[3px] pt-5">
              {Array.from({ length: DAYS_TO_SALARY }, (_, index) => (
                <span key={index} className={`h-1.5 flex-1 rounded-full ${index === 0 ? "bg-[#4ade9f]" : "bg-white/15"}`} />
              ))}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
              {[
                ["In accounts", inAccounts],
                ["Bills", BILLS],
                ["Goals", GOALS],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[#c5dcd2]">{label}</dt>
                  <dd className="tabular mt-0.5 text-[13px]">{inr(value)}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl bg-[#1b1f25] p-4 sm:col-span-5">
            <h3 className="text-[13px] text-ink-2">Where it went</h3>
            <ul className="mt-3 space-y-3">
              {categories.map(([name, value]) => (
                <li key={name}>
                  <div className="flex justify-between text-[13px]">
                    <span>{name}</span>
                    <span className="tabular text-ink-2">{inr(value)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: `${(value / largest) * 100}%`, background: COLORS[name] }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-[#1b1f25] p-3 sm:col-span-12">
            <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr]">
              <div className="flex h-10 items-center rounded-full bg-[#0d0f12] pr-1 pl-4 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {typed || <span className="text-ink-2">200 rapido from HDFC</span>}
                  {typed && <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-ink" />}
                </span>
                <span
                  className={`flex h-8 shrink-0 items-center rounded-full px-3.5 text-xs font-medium transition-colors ${
                    typed ? "bg-[#ecebe6] text-[#14171c]" : "bg-white/10 text-ink-2"
                  }`}
                >
                  Add
                </span>
              </div>
              <div className="flex h-10 min-w-0 items-center gap-2 rounded-full bg-[#0d0f12] px-3.5 text-[13px]">
                <NotebookPen size={13} className="shrink-0 text-ink-2" />
                <span className={`truncate ${note ? "display italic" : "text-ink-2"}`}>{note || "Add a note"}</span>
              </div>
            </div>

            <ul className="mt-1.5">
              {rows.map((row) => (
                <li key={row.id} className="fade-in flex h-[50px] items-center gap-3 border-b border-white/6 px-1.5 last:border-0">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `color-mix(in srgb, ${row.color} 20%, transparent)` }}
                  >
                    <span className="size-1.5 rounded-full" style={{ background: row.color }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{row.payee}</span>
                    <span className={`block truncate text-xs text-ink-2 ${row.note ? "display italic" : ""}`}>{row.note ?? row.detail}</span>
                  </span>
                  <span className={`tabular shrink-0 text-[13px] ${row.income ? "text-[#4ade9f]" : ""}`}>
                    {row.income ? "+" : "−"}
                    {inr(row.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export function HeroFacts() {
  return (
    <ul className="rise mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2" style={{ "--delay": "240ms" } as React.CSSProperties}>
      {["No bank login", "No card numbers", "Log anything in seconds"].map((fact) => (
        <li key={fact} className="flex items-center gap-1.5">
          <Check size={14} className="text-good" aria-hidden />
          {fact}
        </li>
      ))}
    </ul>
  );
}
