"use client";

import { Landmark, Plus, ReceiptText, Repeat } from "lucide-react";
import { useMemo, useState } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { BarsChart } from "@/components/charts/marks";
import { accountOptions, categoryOptions, useAccounts, useCategories } from "@/components/finance/shared";
import { Button } from "@/components/ui/button";
import { EntityForm, type FieldDef } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { Card, Chip, Empty, ErrorNote, ListSkeleton, PageHeader, StatTile } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useRows, useRpc, useRpcAction, useSave } from "@/lib/data";
import { addDays, daysBetween, formatDay, inr, inrCompact, monthLabel, relativeDay, shiftMonth, today } from "@/lib/format";

interface ScheduledItem {
  id: string;
  name: string;
  kind: "income" | "expense";
  amount: number;
  category_id: string | null;
  account_id: string;
  payment_app: string | null;
  payee: string | null;
  frequency: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  interval_days: number | null;
  next_run: string;
  auto_post: boolean;
  is_subscription: boolean;
  active: boolean;
}

const FREQUENCY_LABEL: Record<ScheduledItem["frequency"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  custom: "Custom",
};

const PER: Record<ScheduledItem["frequency"], string> = {
  daily: "/day",
  weekly: "/wk",
  monthly: "/mo",
  yearly: "/yr",
  custom: "",
};

const REPEATS: Record<ScheduledItem["frequency"], string> = {
  daily: "Every day",
  weekly: "Every week",
  monthly: "Every month",
  yearly: "Every year",
  custom: "",
};

const MONTHLY_FACTOR: Record<ScheduledItem["frequency"], (item: ScheduledItem) => number> = {
  daily: () => 30.44,
  weekly: () => 4.348,
  monthly: () => 1,
  yearly: () => 1 / 12,
  custom: (item) => 30.44 / (item.interval_days || 30),
};

const monthlyCost = (item: ScheduledItem) => Number(item.amount) * MONTHLY_FACTOR[item.frequency](item);

function nextOccurrence(item: ScheduledItem, day: string) {
  if (item.frequency === "daily") return addDays(day, 1);
  if (item.frequency === "weekly") return addDays(day, 7);
  if (item.frequency === "monthly") return shiftMonth(day, 1);
  if (item.frequency === "yearly") return shiftMonth(day, 12);
  return addDays(day, item.interval_days || 30);
}

// What really lands in the next N days: an overdue item once, then each repeat in the window.
function dueWithin(item: ScheduledItem, days: number) {
  const end = addDays(today(), days - 1);
  let total = 0;
  for (let day = item.next_run; day <= end; day = nextOccurrence(item, day)) total += Number(item.amount);
  return total;
}

const MONOGRAM_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444"];

function monogramColor(name: string) {
  let total = 0;
  for (const letter of name) total = (total * 31 + letter.charCodeAt(0)) % 9973;
  return MONOGRAM_COLORS[total % MONOGRAM_COLORS.length]!;
}

// Subscriptions read best by name, and bills by the date they land.
function RowLead({ item, lead }: { item: ScheduledItem; lead: "name" | "date" }) {
  if (lead === "date") {
    const late = item.next_run < today();
    return (
      <span
        aria-hidden
        className={`flex size-11 shrink-0 flex-col items-center justify-center rounded-xl leading-none ${
          late ? "bg-bad-soft text-bad" : "bg-surface-2"
        }`}
      >
        <span className="tabular text-[15px]">{formatDay(item.next_run, { day: "numeric" })}</span>
        <span className="mt-0.5 text-[10px]">{formatDay(item.next_run, { month: "short" })}</span>
      </span>
    );
  }
  const color = item.kind === "income" ? "#10b981" : monogramColor(item.name);
  return (
    <span
      aria-hidden
      className="display flex size-11 shrink-0 items-center justify-center rounded-xl text-[19px]"
      style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color: `color-mix(in srgb, ${color} 75%, var(--ink))` }}
    >
      {item.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

function DueLabel({ item }: { item: ScheduledItem }) {
  const late = item.next_run < today() ? daysBetween(item.next_run, today()) : 0;
  if (late > 0) {
    return <span className="rounded-full bg-bad-soft px-2 py-0.5 text-xs text-bad">{late} day{late === 1 ? "" : "s"} late</span>;
  }
  if (item.next_run === today()) return <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs text-warn">Due today</span>;
  return <span className="text-xs text-ink-2">{relativeDay(item.next_run)}</span>;
}

function ItemRow({
  item,
  lead,
  onEdit,
  onDelete,
  onPost,
  onSkip,
}: {
  item: ScheduledItem;
  lead: "name" | "date";
  onEdit: () => void;
  onDelete: () => void;
  onPost: () => void;
  onSkip: () => void;
}) {
  const due = item.next_run <= today();
  return (
    <li className={`group -mx-2 rounded-2xl p-2 transition-colors hover:bg-surface-2/60 ${item.active ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-3">
        <RowLead item={item} lead={lead} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[15px]">
            <span className="truncate">{item.name}</span>
            {!item.active && <Chip>Paused</Chip>}
          </p>
          <p
            className="mt-0.5 truncate text-xs text-ink-2"
            title={
              item.auto_post
                ? "Serein adds this to your transactions by itself on the day."
                : "Serein asks you to confirm or skip this on the day."
            }
          >
            {item.frequency === "custom" ? `Every ${item.interval_days} days` : REPEATS[item.frequency]} ·{" "}
            {item.auto_post ? "Adds itself" : "You confirm it"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`tabular text-[15px] ${item.kind === "income" ? "text-good" : ""}`}>
            {item.kind === "income" ? "+" : ""}
            {inr(item.amount)}
            <span className="text-xs text-ink-2">{PER[item.frequency]}</span>
          </p>
          <div className="mt-1">
            <DueLabel item={item} />
          </div>
        </div>
        <span className="opacity-100 transition-opacity focus-within:opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
          <RowActions
            onEdit={onEdit}
            onDelete={onDelete}
            deleteTitle={`Delete ${item.name}?`}
            deleteBody="Entries it already created stay in your transactions."
          />
        </span>
      </div>
      {due && !item.auto_post && item.active && (
        <div className="mt-2 flex justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={onSkip}>
            Skip this one
          </Button>
          <Button size="sm" onClick={onPost}>
            Confirm {inr(item.amount)}
          </Button>
        </div>
      )}
    </li>
  );
}

function Section({
  icon: Icon,
  title,
  explains,
  total,
  addLabel,
  onAdd,
  empty,
  rows,
  className = "",
}: {
  icon: typeof Plus;
  title: string;
  explains: string;
  total: number;
  addLabel: string;
  onAdd: () => void;
  empty: string;
  rows: React.ReactNode[];
  className?: string;
}) {
  return (
    <section className={`flex flex-col rounded-3xl border border-line bg-surface p-5 sm:p-6 ${className}`}>
      <header className="flex items-start gap-3">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-2">
          <Icon size={18} strokeWidth={1.7} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="display text-[22px] leading-tight">{title}</h2>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{explains}</p>
        </div>
        <button
          type="button"
          aria-label={addLabel}
          title={addLabel}
          onClick={onAdd}
          className="pressable flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line text-ink-2 hover:border-line-2 hover:text-ink"
        >
          <Plus size={15} aria-hidden />
        </button>
      </header>

      {rows.length ? (
        <>
          <ul className="mt-4 flex-1 space-y-1">{rows}</ul>
          <p className="tabular mt-4 flex items-baseline justify-between border-t border-line pt-3 text-[13px] text-ink-2">
            About a month
            <span className="figure text-lg text-ink">{inr(total)}</span>
          </p>
        </>
      ) : (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-2 px-4 py-7 text-center">
          <p className="max-w-xs text-sm leading-relaxed text-ink-2">{empty}</p>
          <Button size="sm" variant="soft" onClick={onAdd}>
            <Plus size={13} aria-hidden /> {addLabel}
          </Button>
        </div>
      )}
    </section>
  );
}

export default function ScheduledPage() {
  const { data: items = [], isLoading, error } = useRows<ScheduledItem>("scheduled_items", { order: [["next_run"]] });
  const { data: projection = [], isLoading: loadingProjection, error: projectionError } = useRpc<
    { month: string; total: number }[]
  >("subscription_cost_by_month", { p_months: 12 });
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const [editing, setEditing] = useState<Partial<ScheduledItem> | null>(null);
  const save = useSave("scheduled_items", { successMessage: "Saved" });
  const remove = useRemove("scheduled_items");
  const post = useRpcAction<{ p_id: string }>("post_scheduled_item", {
    invalidate: ["scheduled_items", "transactions", "accounts"],
    successMessage: "Added to transactions",
  });
  const skip = useRpcAction<{ p_id: string }>("skip_scheduled_item", {
    invalidate: ["scheduled_items"],
    successMessage: "Skipped this one",
  });

  const fields: FieldDef[] = useMemo(
    () => [
      { name: "name", label: "Name", required: true, maxLength: 60, placeholder: "Netflix" },
      {
        name: "kind",
        label: "Type",
        type: "select",
        required: true,
        half: true,
        options: [
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" },
        ],
      },
      { name: "amount", label: "Amount", type: "number", required: true, min: 0.01, half: true },
      { name: "account_id", label: "Account", type: "select", required: true, half: true, options: accountOptions(accounts) },
      { name: "category_id", label: "Category", type: "select", half: true, options: categoryOptions(categories) },
      {
        name: "frequency",
        label: "Repeats",
        type: "select",
        required: true,
        half: true,
        options: Object.entries(FREQUENCY_LABEL).map(([value, label]) => ({ value, label })),
      },
      {
        name: "interval_days",
        label: "Every how many days",
        type: "number",
        min: 1,
        max: 3660,
        required: true,
        half: true,
        when: (values) => values.frequency === "custom",
      },
      { name: "next_run", label: "Next date", type: "date", required: true, half: true },
      { name: "is_subscription", label: "This is a subscription, like Netflix or Spotify", type: "checkbox" },
      { name: "auto_post", label: "Add automatically (otherwise I confirm each one)", type: "checkbox" },
      { name: "active", label: "Active", type: "checkbox" },
    ],
    [accounts, categories],
  );

  const running = items.filter((item) => item.active);
  const subscriptions = running.filter((item) => item.is_subscription && item.kind === "expense");
  const monthly = subscriptions.reduce((sum, item) => sum + monthlyCost(item), 0);
  const goingOut = running.filter((item) => item.kind === "expense").reduce((sum, item) => sum + dueWithin(item, 30), 0);
  const comingIn = running.filter((item) => item.kind === "income").reduce((sum, item) => sum + dueWithin(item, 30), 0);

  // Paused items stay listed, so they can be switched back on. They just don't count above.
  const subscriptionRows = items
    .filter((item) => item.is_subscription && item.kind === "expense")
    .sort((a, b) => monthlyCost(b) - monthlyCost(a));
  const billRows = items.filter((item) => !item.is_subscription && item.kind === "expense");
  const incomeRows = items.filter((item) => item.kind === "income");

  const renderRow = (lead: "name" | "date") => (item: ScheduledItem) => (
    <ItemRow
      key={item.id}
      item={item}
      lead={lead}
      onEdit={() => setEditing(item)}
      onDelete={() => remove.mutate(item.id)}
      onPost={() => post.mutate({ p_id: item.id })}
      onSkip={() => skip.mutate({ p_id: item.id })}
    />
  );

  return (
    <>
      <PageHeader
        title="Scheduled and subscriptions"
        subtitle="Money that moves on a schedule. Add it once, and it's counted before Serein tells you what's safe to spend."
        action={
          <Button onClick={() => setEditing({})} disabled={accounts.length === 0}>
            <Plus size={15} aria-hidden /> Add
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatTile label="Going out, next 30 days" value={inr(goingOut)} note="Bills, EMIs and subscriptions" />
        <StatTile label="Coming in, next 30 days" value={inr(comingIn)} note="Salary and other regular income" />
        <StatTile
          label="Subscriptions cost you"
          value={`${inr(monthly)} a month`}
          note={`${inr(monthly * 12)} a year, across ${subscriptions.length} active`}
          className="col-span-2 xl:col-span-1"
        />
      </div>

      <ErrorNote error={error} />
      {isLoading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <Card>
          <Empty title="Nothing scheduled" hint="Add your rent, EMIs, salary and subscriptions, and they're counted in what's safe to spend." />
        </Card>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
          <Section
            icon={Repeat}
            title="Subscriptions"
            explains="Services you keep paying for and could cancel, like Netflix or Spotify. Costliest first."
            total={monthly}
            addLabel="Add a subscription"
            onAdd={() => setEditing({ is_subscription: true })}
            empty="Add what you pay for every month, and see what it really costs you."
            rows={subscriptionRows.map(renderRow("name"))}
          />
          <Section
            icon={ReceiptText}
            title="Bills and EMIs"
            explains="Regular payments you have to make, like rent, EMIs, insurance and electricity."
            total={running.filter((item) => !item.is_subscription && item.kind === "expense").reduce((sum, item) => sum + monthlyCost(item), 0)}
            addLabel="Add a bill"
            onAdd={() => setEditing({})}
            empty="Add your rent or an EMI, and it's set aside before Serein tells you what's safe to spend."
            rows={billRows.map(renderRow("date"))}
          />
          <Section
            icon={Landmark}
            title="Regular income"
            explains="Money that arrives on a schedule, like your salary or rent you collect."
            total={running.filter((item) => item.kind === "income").reduce((sum, item) => sum + monthlyCost(item), 0)}
            addLabel="Add your salary"
            onAdd={() => setEditing({ kind: "income" })}
            empty="Add your salary, and it lands in your account by itself on the day."
            rows={incomeRows.map(renderRow("name"))}
            className="xl:col-span-2"
          />
          <ChartCard
            title="Subscription cost by month"
            subtitle="What your active subscriptions will cost each month. Yearly ones show up as a spike in the month they renew."
            className="xl:col-span-2"
            loading={loadingProjection}
            error={projectionError}
            empty={projection.every((row) => Number(row.total) === 0)}
            emptyHint="Mark an item as a subscription to project its cost."
            table={{
              columns: ["Month", "Cost"],
              rows: projection.map((row) => [monthLabel(row.month), inr(row.total)]),
            }}
          >
            <BarsChart
              data={projection.map((row) => ({ ...row, total: Number(row.total) }))}
              x="month"
              xFormat={monthLabel}
              series={[{ key: "total", label: "Cost", color: "var(--finance)" }]}
              format={inr}
              axisFormat={inrCompact}
            />
          </ChartCard>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? `Edit ${editing.name}` : "New scheduled item"} onClose={() => setEditing(null)}>
          <EntityForm
            fields={fields}
            initial={{
              kind: "expense",
              frequency: "monthly",
              next_run: today(),
              auto_post: true,
              active: true,
              ...editing,
            }}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await save.mutateAsync(editing.id ? { ...values, id: editing.id } : values);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
