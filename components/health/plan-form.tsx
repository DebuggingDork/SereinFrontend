"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EntityForm, type FieldDef } from "@/components/ui/entity-form";
import { ConfirmModal, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { friendlyError, invalidateTable, useSave } from "@/lib/data";
import { addDays, today } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { HealthPlan } from "./plan-data";

const FIELDS: FieldDef[] = [
  { name: "title", label: "Name", required: true, maxLength: 80, placeholder: "12-week cut" },
  { name: "goal", label: "Goal", type: "textarea", maxLength: 300, placeholder: "What you want to be true by the end" },
  { name: "starts_on", label: "Starts", type: "date", required: true, half: true },
  { name: "ends_on", label: "Ends", type: "date", required: true, half: true },
  { name: "start_weight_kg", label: "Weight at the start (kg)", type: "number", min: 20, max: 400, half: true },
  { name: "target_weight_kg", label: "Target weight (kg)", type: "number", min: 20, max: 400, half: true },
  { name: "ease_in_weeks", label: "Easy first weeks", type: "number", min: 0, max: 12, half: true, hint: "Fewer sets while you learn the moves" },
  { name: "ease_in_sets", label: "Sets in those weeks", type: "number", min: 1, max: 10, half: true },
];

// Every plan starts with a checklist that ticks itself from what gets logged.
const STARTER_CHECKLIST = [
  { label: "Weighed in this morning", value: "weigh" },
  { label: "Hit my protein target", value: "protein" },
  { label: "Stayed near my calories", value: "calories" },
  { label: "8,000+ steps", value: null },
  { label: "Did today's session", value: "session" },
  { label: "Hit my water goal", value: "water" },
  { label: "In bed on time", value: null },
];

export function PlanForm({ plan, onClose }: { plan?: HealthPlan | null; onClose: () => void }) {
  const client = useQueryClient();
  const { toast } = useToast();
  const save = useSave("health_plans", { successMessage: plan ? "Plan saved" : undefined });
  const [confirming, setConfirming] = useState(false);

  async function submit(values: Record<string, unknown>) {
    const row: Record<string, unknown> = { ...values, ease_in_weeks: values.ease_in_weeks ?? 0, ease_in_sets: values.ease_in_sets ?? 2 };
    if (String(row.ends_on) <= String(row.starts_on)) {
      toast("The end date has to come after the start.", { tone: "error" });
      return;
    }
    if (plan) {
      await save.mutateAsync({ ...row, id: plan.id });
    } else {
      await save.mutateAsync(row);
      const { error } = await supabaseBrowser()
        .from("health_plan_items")
        .insert(STARTER_CHECKLIST.map((item, position) => ({ ...item, position, section: "checklist" })));
      if (error) throw friendlyError(error);
      invalidateTable(client, "health_plan_items");
      toast("Plan created");
    }
    onClose();
  }

  // Logged weights, meals and sessions stay. Only the plan and its notes go.
  async function removePlan() {
    const supabase = supabaseBrowser();
    const results = await Promise.all(
      ["health_plan_items", "health_checkpoints", "health_plans"].map((table) => supabase.from(table).delete().not("id", "is", null)),
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      toast(friendlyError(failed.error).message, { tone: "error" });
      return;
    }
    ["health_plan_items", "health_checkpoints", "health_plans"].forEach((table) => invalidateTable(client, table));
    toast("Plan deleted");
    onClose();
  }

  return (
    <Modal title={plan ? "Edit plan" : "Set up your plan"} onClose={onClose}>
      <EntityForm
        fields={FIELDS}
        initial={plan ? { ...plan } : { starts_on: today(), ends_on: addDays(today(), 83), ease_in_weeks: 2, ease_in_sets: 2 }}
        submitLabel={plan ? "Save plan" : "Create plan"}
        onCancel={onClose}
        onSubmit={submit}
      />
      {plan && (
        <div className="mt-5 border-t border-line pt-4">
          <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
            Delete this plan
          </Button>
          {confirming && (
            <ConfirmModal
              title="Delete this plan?"
              body="Its notes and checkpoints go. Your logged weights, meals and sessions stay."
              onConfirm={() => void removePlan()}
              onClose={() => setConfirming(false)}
            />
          )}
        </div>
      )}
    </Modal>
  );
}
