"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "./theme";
import { useFreeze } from "./freeze";

interface Command {
  label: string;
  hint?: string;
  run: () => void;
}

const APP_ROUTES: [string, string, string][] = [
  ["Home", "/home", ""],
  ["Finance overview", "/finance", "Finance"],
  ["Add a transaction", "/finance/transactions?new=1", "Finance"],
  ["Transactions", "/finance/transactions", "Finance"],
  ["Accounts and cards", "/finance/accounts", "Finance"],
  ["Budgets", "/finance/budgets", "Finance"],
  ["Scheduled and subscriptions", "/finance/scheduled", "Finance"],
  ["Debts and credits", "/finance/debts", "Finance"],
  ["Goals", "/finance/goals", "Finance"],
  ["Net worth", "/finance/net-worth", "Finance"],
  ["Finance calendar", "/finance/calendar", "Finance"],
  ["Finance charts", "/finance/charts", "Finance"],
  ["Planner today", "/planner", "Planner"],
  ["Add a task", "/planner/tasks?new=1", "Planner"],
  ["All tasks", "/planner/tasks", "Planner"],
  ["Deadlines", "/planner/deadlines", "Planner"],
  ["Planner calendar", "/planner/calendar", "Planner"],
  ["Completed tasks", "/planner/completed", "Planner"],
  ["Planner charts", "/planner/charts", "Planner"],
  ["Diet today", "/diet", "Diet"],
  ["Log a meal", "/diet/log?new=1", "Diet"],
  ["Meal log", "/diet/log", "Diet"],
  ["Meal plans", "/diet/plans", "Diet"],
  ["Targets", "/diet/targets", "Diet"],
  ["Water", "/diet/water", "Diet"],
  ["Weight", "/diet/weight", "Diet"],
  ["Foods", "/diet/foods", "Diet"],
  ["Diet charts", "/diet/charts", "Diet"],
  ["Write in the diary", "/diary", "Diary"],
  ["Diary entries", "/diary/entries", "Diary"],
  ["Diary calendar", "/diary/calendar", "Diary"],
  ["Moods", "/diary/moods", "Diary"],
  ["Search the diary", "/diary/search", "Diary"],
  ["Profile and security", "/profile", "Account"],
];

const LANDING_ROUTES: [string, string][] = [
  ["Modules", "/#modules"],
  ["The gate", "/#gate"],
  ["Colophon", "/#colophon"],
  ["Sign in", "/login"],
  ["Create an account", "/signup"],
];

const APP_PREFIXES = ["/home", "/finance", "/planner", "/diet", "/diary", "/profile", "/admin"];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toggle, theme } = useTheme();
  const { freeze } = useFreeze();

  const inApp = APP_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("serein:search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("serein:search", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => input.current?.focus());
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => router.push(href);
    const routes: Command[] = inApp
      ? APP_ROUTES.map(([label, href, hint]) => ({ label, hint, run: go(href) }))
      : LANDING_ROUTES.map(([label, href]) => ({ label, run: go(href) }));
    return [
      ...routes,
      { label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode", hint: "Theme", run: toggle },
      { label: "Freeze the screen", hint: "Privacy", run: freeze },
    ];
  }, [inApp, router, toggle, theme, freeze]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.slice(0, 8);
    return commands.filter((c) => `${c.label} ${c.hint ?? ""}`.toLowerCase().includes(q)).slice(0, 8);
  }, [commands, query]);

  if (!open) return null;

  function runCommand(command: Command | undefined) {
    if (!command) return;
    setOpen(false);
    command.run();
  }

  return (
    <div className="fade-in fixed inset-0 z-[95] bg-black/30 px-4 pt-[14vh]" onMouseDown={() => setOpen(false)}>
      <div
        role="dialog"
        aria-label="Search"
        onMouseDown={(event) => event.stopPropagation()}
        className="pop-in mx-auto max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={16} className="text-ink-3" aria-hidden />
          <input
            ref={input}
            value={query}
            placeholder="Search pages and actions"
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (event.key === "Enter") {
                runCommand(results[active]);
              }
            }}
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-ink-3"
          />
          <span className="kbd">Esc</span>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-3">Nothing matches that.</li>}
          {results.map((command, index) => (
            <li key={command.label}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => runCommand(command)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                  index === active ? "bg-surface-2" : ""
                }`}
              >
                {command.label}
                {command.hint && <span className="text-xs text-ink-3">{command.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
