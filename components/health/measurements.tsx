"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { Card, Empty } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useRows, useSave } from "@/lib/data";
import { formatDay, number, today } from "@/lib/format";
import type { Measurement } from "./plan-data";

const FIELDS = [
  { key: "waist_cm", unit: "cm", label: "Waist", digits: 1 },
  { key: "body_fat_pct", unit: "%", label: "Body fat", digits: 1 },
  { key: "muscle_kg", unit: "kg", label: "Muscle", digits: 1 },
  { key: "trunk_fat_kg", unit: "kg", label: "Trunk fat", digits: 1 },
  { key: "waist_hip_ratio", unit: "", label: "Waist-hip", digits: 2 },
] as const;

export function Measurements() {
  const { data: rows = [] } = useRows<Measurement>("body_measurements", { order: [["logged_on", { ascending: false }]], limit: 60 });
  const save = useSave("body_measurements", { successMessage: "Saved" });
  const remove = useRemove("body_measurements");
  const [editing, setEditing] = useState<Partial<Measurement> | null>(null);

  return (
    <Card
      title="Waist and body scans"
      action={
        <Button variant="soft" size="sm" onClick={() => setEditing({ logged_on: today() })}>
          <Plus size={13} aria-hidden /> Add
        </Button>
      }
    >
      {rows.length === 0 ? (
        <Empty compact title="Nothing measured yet" hint="Measure your waist at the navel each Monday. Add body scan numbers when you have them." />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="tabular text-[13px] text-ink-2">
                  {formatDay(row.logged_on, { day: "numeric", month: "short", year: "numeric" })}
                  {row.note ? ` · ${row.note}` : ""}
                </p>
                <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {FIELDS.filter((field) => row[field.key] !== null).map((field) => (
                    <div key={field.key} className="flex items-baseline gap-1.5">
                      <dt className="text-xs text-ink-2">{field.label}</dt>
                      <dd className="tabular text-sm">
                        {number(row[field.key], field.digits)}
                        {field.unit && ` ${field.unit}`}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} deleteTitle="Delete this measurement?" />
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <Modal title={editing.id ? "Edit measurement" : "New measurement"} onClose={() => setEditing(null)}>
          <EntityForm
            initial={editing}
            fields={[
              { name: "logged_on", label: "Date", type: "date", required: true },
              { name: "waist_cm", label: "Waist at the navel (cm)", type: "number", min: 20, max: 300, half: true },
              { name: "body_fat_pct", label: "Body fat (%)", type: "number", min: 1, max: 80, half: true },
              { name: "muscle_kg", label: "Muscle (kg)", type: "number", min: 1, max: 200, half: true },
              { name: "trunk_fat_kg", label: "Trunk fat (kg)", type: "number", min: 0, max: 200, half: true },
              { name: "waist_hip_ratio", label: "Waist-hip ratio", type: "number", min: 0.3, max: 2, half: true },
              { name: "note", label: "Note", maxLength: 200, placeholder: "Body scan at the gym" },
            ]}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await save.mutateAsync(editing.id ? { ...values, id: editing.id } : values);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </Card>
  );
}
