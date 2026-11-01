"use client";

import Link from "next/link";
import { useAccounts } from "@/components/finance/shared";
import { LinkButton } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/primitives";
import { useRpc } from "@/lib/data";
import { addDays, formatDay, inr, monthBounds, relativeDay, today } from "@/lib/format";
import { useProfile } from "@/lib/profile";

interface SafeToSpend {
  available: number;
  committed: number;
  set_aside: number;
  remaining: number;
  days_left: number;
  per_day: number;
  daily_average: number;
  status: "comfortable" | "tight" | "over";
}

interface Alert {
  kind: string;
  title: string;
  due_on: string | null;
  amount: number | null;
  severity: "high" | "normal";
  href: string;
}

export function PanelTitle({ children }: { children: React.ReactNode }) {
  return <span className="display text-[22px] leading-tight text-ink">{children}</span>;
}

export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[13px] text-ink-2 underline underline-offset-2 hover:text-ink">
      {children}
    </Link>
  );
}

const STATUS = {
  comfortable: { label: "Comfortable", lead: "You are on track." },
  tight: { label: "Tight", lead: "Go a little easy for now." },
  over: { label: "Over", lead: "Bills and goals are ahead of your balance." },
} as const;

const RUNWAY_LIMIT = 31;

// Always dark green, in either theme: this is the one number the page exists to show.
export function SafeToSpendPanel() {
  const { data, isLoading } = useRpc<SafeToSpend[]>("safe_to_spend");
  const { data: profile } = useProfile();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const safe = data?.[0];

  if (isLoading || accountsLoading || !safe) return <Skeleton className="h-full min-h-80 rounded-3xl" />;

  const shell = "fade-in flex h-full flex-col rounded-3xl p-6 text-ink sm:p-8";
  const panelStyle = { background: "var(--money-deep)" };

  if (accounts?.length === 0) {
    return (
      <section data-theme="dark" className={shell} style={panelStyle}>
        <h2 className="display text-[32px] leading-tight">Tell Serein what you have.</h2>
        <p className="mt-3 max-w-md leading-relaxed text-[#c5dcd2]">
          Add one account with the balance from your bank app, and this becomes what you can safely spend each day.
        </p>
        <div className="mt-6">
          <LinkButton href="/finance/accounts?new=1" size="lg">
            Add an account
          </LinkButton>
        </div>
      </section>
    );
  }

  const status = STATUS[safe.status];
  const salaryDate = formatDay(addDays(today(), safe.days_left), { weekday: "short", day: "numeric", month: "short" });
  const salaryAccount = accounts?.find((a) => a.id === profile?.preferences.salaryAccountId);
  const days = Math.min(safe.days_left, RUNWAY_LIMIT);

  return (
    <section data-theme="dark" className={shell} style={panelStyle}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] text-[#c5dcd2]">Safe to spend today</h2>
        <span className="rounded-full bg-white/12 px-3 py-1 text-[13px]">{status.label}</span>
      </div>

      <p className="figure mt-3 text-[clamp(3.25rem,7vw,4.75rem)] leading-none">{inr(Math.max(0, Number(safe.per_day)))}</p>
      <p className="mt-3 max-w-md leading-relaxed text-[#c5dcd2]">
        {status.lead} Salary lands {salaryDate}
        {salaryAccount ? ` in ${salaryAccount.name}` : ""}.
      </p>

      <div className="mt-auto pt-7">
        <div className="mb-2 flex justify-between text-[13px] text-[#c5dcd2]">
          <span>Today</span>
          <span className="tabular">
            {safe.days_left} day{safe.days_left === 1 ? "" : "s"} to salary
          </span>
        </div>
        <div aria-hidden className="flex gap-[3px]">
          {Array.from({ length: days }, (_, index) => (
            <span key={index} className={`h-2 flex-1 rounded-full ${index === 0 ? "bg-[#4ade9f]" : "bg-white/15"}`} />
          ))}
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3 text-[13px]">
          <div>
            <dt className="text-[#c5dcd2]">In your accounts</dt>
            <dd className="tabular mt-0.5 text-[15px]">{inr(safe.available)}</dd>
          </div>
          <div>
            <dt className="text-[#c5dcd2]">Bills and dues</dt>
            <dd className="tabular mt-0.5 text-[15px]">{inr(safe.committed)}</dd>
          </div>
          <div>
            <dt className="text-[#c5dcd2]">For goals</dt>
            <dd className="tabular mt-0.5 text-[15px]">{inr(safe.set_aside)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

const SPENDING_ROWS = 6;

export function WhereItWent({ className = "" }: { className?: string }) {
  const { from, to } = monthBounds();
  const { data = [], isLoading } = useRpc<{ category: string; color: string; total: number }[]>("spending_by_category", {
    p_from: from,
    p_to: to,
  });
  const rows = data.map((row) => ({ ...row, total: Number(row.total) })).sort((a, b) => b.total - a.total);
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const largest = rows[0]?.total ?? 1;

  return (
    <Card
      className={className}
      title={<PanelTitle>Where it went</PanelTitle>}
      action={<PanelLink href="/finance/charts">All charts</PanelLink>}
    >
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : rows.length === 0 ? (
        <p className="py-6 text-sm leading-relaxed text-ink-2">Log your first expense and this month&apos;s picture starts here.</p>
      ) : (
        <ul className="space-y-3.5">
          {rows.slice(0, SPENDING_ROWS).map((row) => (
            <li key={row.category}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{row.category}</span>
                <span className="tabular shrink-0">
                  {inr(row.total)} <span className="ml-1 text-xs text-ink-2">{Math.round((row.total / total) * 100)}%</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${(row.total / largest) * 100}%`, background: row.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ComingUp({ moneyOnly, className = "" }: { moneyOnly?: boolean; className?: string }) {
  const { data = [], isLoading } = useRpc<Alert[]>("upcoming_alerts");
  const alerts = moneyOnly ? data.filter((alert) => alert.kind !== "task") : data;

  return (
    <Card
      className={className}
      title={<PanelTitle>Coming up</PanelTitle>}
      action={<PanelLink href="/finance/scheduled">Scheduled</PanelLink>}
    >
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : alerts.length === 0 ? (
        <p className="py-6 text-sm leading-relaxed text-ink-2">Nothing due in the next seven days.</p>
      ) : (
        <ul className="space-y-1">
          {alerts.slice(0, 5).map((alert, index) => {
            const urgent = alert.severity === "high";
            return (
              <li key={index}>
                <Link href={alert.href} className="pressable -mx-2 flex items-center gap-3 rounded-2xl p-2 hover:bg-surface-2">
                  <span
                    className={`flex size-11 shrink-0 flex-col items-center justify-center rounded-xl leading-none ${
                      urgent ? "bg-bad-soft text-bad" : "bg-surface-2 text-ink"
                    }`}
                  >
                    {alert.due_on ? (
                      <>
                        <span className="tabular text-[15px]">{formatDay(alert.due_on, { day: "numeric" })}</span>
                        <span className="mt-0.5 text-[10px]">{formatDay(alert.due_on, { month: "short" })}</span>
                      </>
                    ) : (
                      <span className="text-[15px]">!</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{alert.title}</span>
                    {alert.due_on && (
                      <span className={`block text-xs ${urgent ? "text-bad" : "text-ink-2"}`}>{relativeDay(alert.due_on)}</span>
                    )}
                  </span>
                  {alert.amount !== null && <span className="tabular text-sm">{inr(alert.amount)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
