"use client";

import { Archive, GitMerge, Plus } from "lucide-react";
import { useState } from "react";
import { categoryOptions, useCategories, type Category } from "@/components/finance/shared";
import { PREFERENCE_FIELDS, PreferencesForm } from "@/components/shell/preferences-form";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { Card, ListSkeleton, PageHeader } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useToast } from "@/components/ui/toast";
import { friendlyError, invalidateTable, useRemove, useSave } from "@/lib/data";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#06b6d4", "#6b7280"];
const FINANCE_PREFERENCES = PREFERENCE_FIELDS.filter((f) => ["currency", "monthStart", "salaryDay", "weekStart"].includes(f.name));

function MergeForm({ source, onClose }: { source: Category; onClose: () => void }) {
  const { data: categories = [] } = useCategories();
  const client = useQueryClient();
  const { toast } = useToast();
  const options = categoryOptions(categories.filter((c) => c.id !== source.id && c.kind === source.kind));

  async function merge(target: string) {
    const supabase = supabaseBrowser();
    const moved = await supabase.from("transactions").update({ category_id: target }).eq("category_id", source.id);
    if (moved.error) throw friendlyError(moved.error);
    const archived = await supabase.from("categories").update({ archived: true }).eq("id", source.id);
    if (archived.error) throw friendlyError(archived.error);
    invalidateTable(client, "categories");
    invalidateTable(client, "transactions");
    toast(`Merged ${source.name}`);
  }

  return (
    <Modal title={`Merge ${source.name}`} onClose={onClose}>
      <p className="mb-4 text-sm leading-relaxed text-ink-2">
        Every entry in {source.name} moves to the category you pick, and {source.name} is archived.
      </p>
      <EntityForm
        submitLabel="Merge"
        fields={[{ name: "target", label: "Merge into", type: "select", required: true, options }]}
        onCancel={onClose}
        onSubmit={async (values) => {
          await merge(String(values.target));
          onClose();
        }}
      />
    </Modal>
  );
}

export default function FinanceSettingsPage() {
  const { data: categories = [], isLoading } = useCategories();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [merging, setMerging] = useState<Category | null>(null);
  const save = useSave("categories", { successMessage: "Saved" });
  const remove = useRemove("categories");

  const parents = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  const categoryRow = (category: Category, nested = false) => (
    <li key={category.id} className={`flex items-center gap-3 py-2 text-sm ${nested ? "pl-6 text-ink-2" : ""}`}>
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: category.color }} />
      <span className="min-w-0 flex-1 truncate">{category.name}</span>
      {!nested && <span className="text-xs text-ink-3">{category.kind === "income" ? "Income" : "Expense"}</span>}
      <button
        type="button"
        aria-label={`Merge ${category.name}`}
        title="Merge into another category"
        onClick={() => setMerging(category)}
        className="pressable cursor-pointer rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
      >
        <GitMerge size={14} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={`Archive ${category.name}`}
        title="Archive"
        onClick={() => save.mutate({ id: category.id, archived: true })}
        className="pressable cursor-pointer rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
      >
        <Archive size={14} aria-hidden />
      </button>
      <RowActions
        onEdit={() => setEditing(category)}
        onDelete={() => remove.mutate(category.id)}
        deleteTitle={`Delete ${category.name}?`}
        deleteBody="Entries in it become uncategorised. Archive keeps them labelled."
      />
    </li>
  );

  return (
    <>
      <PageHeader title="Finance settings" />
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card
          title="Categories"
          action={
            <Button size="sm" onClick={() => setEditing({})}>
              <Plus size={14} aria-hidden /> Add
            </Button>
          }
        >
          {isLoading ? (
            <ListSkeleton />
          ) : (
            <ul className="divide-y divide-line">
              {parents.map((parent) => [categoryRow(parent), ...childrenOf(parent.id).map((child) => categoryRow(child, true))])}
            </ul>
          )}
        </Card>
        <Card title="Money preferences" className="self-start">
          <PreferencesForm fields={FINANCE_PREFERENCES} />
        </Card>
      </div>

      {editing && (
        <Modal title={editing.id ? `Edit ${editing.name}` : "New category"} onClose={() => setEditing(null)}>
          <EntityForm
            initial={{ kind: "expense", color: COLORS[0], ...editing }}
            fields={[
              { name: "name", label: "Name", required: true, maxLength: 40, half: true },
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
              {
                name: "parent_id",
                label: "Inside",
                type: "select",
                half: true,
                options: parents.filter((p) => p.id !== editing.id).map((p) => ({ value: p.id, label: p.name })),
              },
              {
                name: "color",
                label: "Colour",
                type: "select",
                required: true,
                half: true,
                options: COLORS.map((value, index) => ({
                  value,
                  label: ["Green", "Blue", "Amber", "Violet", "Red", "Pink", "Cyan", "Grey"][index]!,
                })),
              },
            ]}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await save.mutateAsync(editing.id ? { ...values, id: editing.id } : values);
              setEditing(null);
            }}
          />
        </Modal>
      )}
      {merging && <MergeForm source={merging} onClose={() => setMerging(null)} />}
    </>
  );
}
