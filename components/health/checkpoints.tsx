"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { Chip } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useSave } from "@/lib/data";
import { addDays, formatDay, number, today } from "@/lib/format";
import { useCheckpoints, useWeights, type Checkpoint, type WeightLog } from "./plan-data";
import { useEditing } from "./plan-items";

// A checkpoint is judged on the weigh-in closest to its date, within the week before it.
function readingFor(point: Checkpoint, weights: WeightLog[]) {
  const from = addDays(point.due_on, -7);
  return weights.filter((log) => log.logged_on >= from && log.logged_on <= point.due_on).at(-1);
}

function CheckpointForm({ point, onClose }: { point?: Partial<Checkpoint> | null; onClose: () => void }) {
  const save = useSave("health_checkpoints", { successMessage: "Saved" });
  return (
    <Modal title={point?.id ? "Edit checkpoint" : "New checkpoint"} onClose={onClose}>
      <EntityForm
        fields={[
          { name: "label", label: "Label", required: true, maxLength: 120, placeholder: "Week 4" },
          { name: "due_on", label: "Date", type: "date", required: true, half: true },
          { name: "weight_kg", label: "Target weight (kg)", type: "number", min: 20, max: 400, half: true, hint: "Leave empty for a reminder" },
          { name: "note", label: "Note", maxLength: 200 },
        ]}
        initial={point ?? { due_on: today() }}
        onCancel={onClose}
        onSubmit={async (values) => {
          await save.mutateAsync(point?.id ? { ...values, id: point.id } : values);
          onClose();
        }}
      />
    </Modal>
  );
}

export function CheckpointList() {
  const { data: points = [] } = useCheckpoints();
  const { data: weights = [] } = useWeights();
  const editing = useEditing();
  const remove = useRemove("health_checkpoints");
  const [open, setOpen] = useState<Partial<Checkpoint> | null>(null);
  const now = today();
  const targets = points.filter((point) => point.weight_kg !== null);
  const reminders = points.filter((point) => point.weight_kg === null && point.due_on >= now);

  return (
    <>
      {targets.length > 0 && (
        <div className="grid divide-y divide-line rounded-3xl border border-line bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {targets.map((point) => {
            const reading = readingFor(point, weights);
            const past = point.due_on < now;
            const hit = reading && Number(reading.weight_kg) <= Number(point.weight_kg);
            return (
              <div key={point.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] text-ink-2">
                    {point.label} · {formatDay(point.due_on)}
                  </p>
                  {editing && <RowActions onEdit={() => setOpen(point)} onDelete={() => remove.mutate(point.id)} deleteTitle="Delete this checkpoint?" />}
                </div>
                <p className="figure mt-1 text-[32px] leading-tight">
                  {number(point.weight_kg, 1)}
                  <span className="ml-1 font-sans text-sm tracking-normal text-ink-3">kg</span>
                </p>
                {point.note && <p className="text-[13px] text-ink-2">{point.note}</p>}
                {reading ? (
                  <Chip tone={hit ? "good" : past ? "warn" : "neutral"} className="mt-2 tabular">
                    {number(reading.weight_kg, 1)} kg logged
                  </Chip>
                ) : (
                  past && (
                    <Chip tone="warn" className="mt-2">
                      No weigh-in that week
                    </Chip>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
      {reminders.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-ink-2">
          {reminders.map((point) => (
            <li key={point.id} className="flex items-center gap-2">
              <span className="tabular shrink-0 text-ink">{formatDay(point.due_on)}</span>
              <span className="min-w-0 flex-1">{point.label}</span>
              {editing && <RowActions onEdit={() => setOpen(point)} onDelete={() => remove.mutate(point.id)} deleteTitle="Delete this reminder?" />}
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <div className="mt-3">
          <Button variant="soft" size="sm" onClick={() => setOpen({})}>
            <Plus size={13} aria-hidden /> Add checkpoint
          </Button>
        </div>
      )}
      {open && <CheckpointForm point={open} onClose={() => setOpen(null)} />}
    </>
  );
}
