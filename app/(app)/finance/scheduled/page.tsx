"use client";

import { Plus } from "lucide-react";
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
import { inr, inrCompact, monthLabel, relativeDay, today } from "@/lib/format";

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

const MONTHLY_FACTOR: Record<ScheduledItem["frequency"], (item: ScheduledItem) => number> = {
  daily: () => 30.44,
  weekly: () => 4.348,
  monthly: () => 1,
  yearly: () => 1 / 12,
  custom: (item) => 30.44 / (item.interval_days || 30),
};

const monthlyCost = (item: ScheduledItem) => Number(item.amount) * MONTHLY_FACTOR[item.frequency](item);

function ItemRow({
  item,
  onEdit,
  onDelete,
  onPost,
  onSkip,
}: {
  item: ScheduledItem;
  onEdit: () => void;
  onDelete: () => void;
  onPost: () => void;
  onSkip: () => void;
}) {
  const due = item.next_run <= today();
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
      <div className="min-w-0 flex-1 basis-48">
        <p className="flex items-center gap-2 text-sm">
          {item.name}
          {!item.active && <Chip>Paused</Chip>}
          {item.is_subscription && <Chip tone="diary">Subscription</Chip>}
        </p>
        <p className="text-xs text-ink-3">
          {FREQUENCY_LABEL[item.frequency]}
          {item.frequency === "custom" && ` · every ${item.interval_days} days`} · Next {relativeDay(item.next_run)} ·{" "}
          {item.auto_post ? "Adds itself" : "Asks first"}
        </p>
      </div>
      {due && !item.auto_post && item.active && (
        <span className="flex gap-1.5">
          <Button size="sm" onClick={onPost}>
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={onSkip}>
            Skip
          </Button>
        </span>
      )}
      <span className={`tabular text-sm ${item.kind === "income" ? "text-good" : ""}`}>
        {item.kind === "income" ? "+" : "−"}
        {inr(item.amount)}
      </span>
      <RowActions
        onEdit={onEdit}
        onDelete={onDelete}
        deleteTitle={`Delete ${item.name}?`}
        deleteBody="Entries it already created stay in your transactions."
      />
    </li>
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
      { name: "is_subscription", label: "This is a subscription", type: "checkbox" },
      { name: "auto_post", label: "Add automatically (otherwise I confirm each one)", type: "checkbox" },
      { name: "active", label: "Active", type: "checkbox" },
    ],
    [accounts, categories],
  );

  const subscriptions = items.filter((item) => item.is_subscription && item.active && item.kind === "expense");
  const monthly = subscriptions.reduce((sum, item) => sum + monthlyCost(item), 0);
  const sortedByCost = [...subscriptions].sort((a, b) => monthlyCost(b) - monthlyCost(a));
  const others = items.filter((item) => !item.is_subscription);

  const renderRow = (item: ScheduledItem) => (
    <ItemRow
      key={item.id}
      item={item}
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
        subtitle="Predictable money should never surprise you."
        action={
          <Button onClick={() => setEditing({})} disabled={accounts.length === 0}>
            <Plus size={15} aria-hidden /> Add
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatTile label="Subscriptions, monthly" value={inr(monthly)} note={`${subscriptions.length} active`} />
        <StatTile label="Next 30 days" value={inr(monthly)} note="If nothing changes" />
        <StatTile label="Next 365 days" value={inr(monthly * 12)} note="Worth a second look" className="col-span-2 xl:col-span-1" />
      </div>

      <ErrorNote error={error} />
      {isLoading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <Card>
          <Empty title="Nothing scheduled" hint="Add rent, salary, EMIs and subscriptions. They feed safe-to-spend." />
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Subscriptions, costliest first">
            {sortedByCost.length ? (
              <ul className="divide-y divide-line">{sortedByCost.map(renderRow)}</ul>
            ) : (
              <p className="py-3 text-sm text-ink-3">Tick “This is a subscription” on an item to see it here.</p>
            )}
          </Card>
          <Card title="Everything else">
            {others.length ? (
              <ul className="divide-y divide-line">{others.map(renderRow)}</ul>
            ) : (
              <p className="py-3 text-sm text-ink-3">Salary, rent and EMIs go here.</p>
            )}
          </Card>
          <ChartCard
            title="Subscription cost by month"
            subtitle="Projected from what is active today"
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
