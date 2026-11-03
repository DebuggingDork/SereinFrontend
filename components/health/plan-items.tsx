"use client";

import { ChevronDown, Plus } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { EntityForm, type FieldDef } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useSave } from "@/lib/data";
import type { ItemSection, PlanItem } from "./plan-data";

export const EditingContext = createContext(false);
export const useEditing = () => useContext(EditingContext);

interface FieldLabels {
  title: string;
  label: string;
  detail?: string;
  value?: string;
  grp?: string;
  grpOptions?: { value: string; label: string }[];
}

const LABELS: Record<ItemSection, FieldLabels> = {
  stat: { title: "number", label: "What it means", value: "Number" },
  callout: { title: "note", label: "Heading", detail: "Text", grp: "Tone", grpOptions: [{ value: "good", label: "Good news" }, { value: "warn", label: "Heads up" }] },
  routine: { title: "step", label: "What happens", value: "Time", grp: "Routine" },
  meal: { title: "meal", label: "Meal and time", detail: "What to eat", value: "Calories and protein" },
  lift_rule: { title: "rule", label: "Heading", detail: "Text" },
  eating_rule: { title: "rule", label: "Heading", detail: "Text", grp: "Group" },
  food_note: { title: "note", label: "Text", grp: "Where it shows" },
  supplement: { title: "supplement", label: "Name", detail: "Why and when", value: "Dose" },
  supplement_note: { title: "note", label: "Text" },
  activity: { title: "activity", label: "Activity", value: "Calories an hour" },
  checklist: { title: "item", label: "Item" },
  review: { title: "note", label: "Text", detail: "More detail" },
};

export function ItemForm({
  section,
  item,
  grp,
  nextPosition,
  onClose,
}: {
  section: ItemSection;
  item?: PlanItem | null;
  grp?: string | null;
  nextPosition: number;
  onClose: () => void;
}) {
  const save = useSave("health_plan_items", { successMessage: "Saved" });
  const labels = LABELS[section];
  const fields: FieldDef[] = [
    { name: "label", label: labels.label, required: true, maxLength: 120 },
    ...(labels.detail ? [{ name: "detail", label: labels.detail, type: "textarea" as const, maxLength: 600 }] : []),
    ...(labels.value ? [{ name: "value", label: labels.value, maxLength: 40, half: true }] : []),
    ...(labels.grp
      ? [
          {
            name: "grp",
            label: labels.grp,
            maxLength: 60,
            half: true,
            ...(labels.grpOptions ? { type: "select" as const, options: labels.grpOptions, required: true } : {}),
          },
        ]
      : []),
  ];

  return (
    <Modal title={item ? `Edit ${labels.title}` : `New ${labels.title}`} onClose={onClose}>
      <EntityForm
        fields={fields}
        initial={item ? { ...item } : { grp: grp ?? labels.grpOptions?.[0]?.value ?? null }}
        onCancel={onClose}
        onSubmit={async (values) => {
          await save.mutateAsync(item ? { ...values, id: item.id } : { ...values, section, position: nextPosition });
          onClose();
        }}
      />
    </Modal>
  );
}

export function ItemActions({ item }: { item: PlanItem }) {
  const editing = useEditing();
  const remove = useRemove("health_plan_items");
  const [open, setOpen] = useState(false);
  if (!editing) return null;
  return (
    <>
      <RowActions onEdit={() => setOpen(true)} onDelete={() => remove.mutate(item.id)} deleteTitle="Delete this?" />
      {open && <ItemForm section={item.section} item={item} nextPosition={item.position} onClose={() => setOpen(false)} />}
    </>
  );
}

export function AddItem({
  section,
  items,
  grp,
  label = "Add",
}: {
  section: ItemSection;
  items: PlanItem[];
  grp?: string | null;
  label?: string;
}) {
  const editing = useEditing();
  const [open, setOpen] = useState(false);
  if (!editing) return null;
  const nextPosition = items.reduce((max, item) => Math.max(max, item.position), -1) + 1;
  return (
    <>
      <Button variant="soft" size="sm" onClick={() => setOpen(true)}>
        <Plus size={13} aria-hidden /> {label}
      </Button>
      {open && <ItemForm section={section} grp={grp} nextPosition={nextPosition} onClose={() => setOpen(false)} />}
    </>
  );
}

// A section heading sits outside the cards, so the page reads as one document.
export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mt-10 mb-4 flex flex-wrap items-end justify-between gap-3 first:mt-0">
      <h2 className="display text-[26px] leading-tight">{children}</h2>
      {action}
    </div>
  );
}

export function RuleList({ items }: { items: PlanItem[] }) {
  return (
    <div className="divide-y divide-line">
      {items.map((item) => (
        <details key={item.id} className="group py-0.5">
          <summary className="pressable flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-2.5 text-sm [&::-webkit-details-marker]:hidden">
            {item.label}
            <span className="flex items-center gap-1">
              <ItemActions item={item} />
              <ChevronDown size={15} aria-hidden className="text-ink-3 transition-transform duration-200 group-open:rotate-180" />
            </span>
          </summary>
          {item.detail && <p className="max-w-[65ch] pb-3 text-sm leading-relaxed text-pretty text-ink-2">{item.detail}</p>}
        </details>
      ))}
    </div>
  );
}

export function Callout({ tone, title, children }: { tone: "good" | "warn"; title?: string | null; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl px-4 py-3.5 text-sm leading-relaxed text-pretty sm:px-5 ${tone === "good" ? "bg-good-soft" : "bg-warn-soft"}`}>
      {title && <p className={`mb-0.5 font-medium ${tone === "good" ? "text-good" : "text-warn"}`}>{title}</p>}
      {children}
    </div>
  );
}
