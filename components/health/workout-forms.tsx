"use client";

import { EntityForm } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { useSave } from "@/lib/data";
import { kcalFromRange, WEEKDAY_LONG, type Exercise, type PlanItem, type WorkoutDay } from "./plan-data";

export function DayForm({ weekday, day, onClose }: { weekday: number; day?: WorkoutDay; onClose: () => void }) {
  const save = useSave("workout_days", { successMessage: "Saved" });
  return (
    <Modal title={`${WEEKDAY_LONG[weekday]} session`} onClose={onClose}>
      <EntityForm
        fields={[
          { name: "title", label: "Name", required: true, maxLength: 80, placeholder: "Upper A" },
          { name: "summary", label: "Focus", type: "textarea", maxLength: 300, placeholder: "Chest, back, shoulders" },
          {
            name: "kind",
            label: "Type",
            type: "select",
            required: true,
            options: [
              { value: "lift", label: "Lifting" },
              { value: "cardio", label: "Cardio" },
              { value: "rest", label: "Rest" },
            ],
          },
        ]}
        initial={day ? { ...day } : { kind: "lift" }}
        onCancel={onClose}
        onSubmit={async (values) => {
          await save.mutateAsync(day ? { ...values, id: day.id } : { ...values, weekday });
          onClose();
        }}
      />
    </Modal>
  );
}

export function ExerciseForm({
  dayId,
  exercise,
  nextPosition,
  onClose,
}: {
  dayId: string;
  exercise?: Exercise;
  nextPosition: number;
  onClose: () => void;
}) {
  const save = useSave("workout_exercises", { successMessage: "Saved" });
  return (
    <Modal title={exercise ? "Edit exercise" : "New exercise"} onClose={onClose}>
      <EntityForm
        fields={[
          { name: "name", label: "Exercise", required: true, maxLength: 80, placeholder: "Lat pulldown" },
          { name: "target", label: "Target", required: true, maxLength: 40, placeholder: "3 × 8–12", half: true },
          { name: "sets", label: "Sets to log", type: "number", required: true, min: 1, max: 20, half: true },
          {
            name: "measure",
            label: "Log it as",
            type: "select",
            required: true,
            options: [
              { value: "reps", label: "Weight and reps" },
              { value: "time", label: "Done or not, for timed work" },
            ],
          },
        ]}
        initial={exercise ? { ...exercise } : { sets: 3, measure: "reps" }}
        onCancel={onClose}
        onSubmit={async (values) => {
          await save.mutateAsync(exercise ? { ...values, id: exercise.id } : { ...values, day_id: dayId, position: nextPosition });
          onClose();
        }}
      />
    </Modal>
  );
}

const OTHER = "__other";

export function GameForm({
  activities,
  note,
  onSubmit,
  onClose,
}: {
  activities: PlanItem[];
  note?: string | null;
  onSubmit: (input: { title: string; minutes: number; kcal: number | null }) => Promise<unknown>;
  onClose: () => void;
}) {
  return (
    <Modal title="Log a game instead" onClose={onClose}>
      {note && <p className="mb-4 text-sm leading-relaxed text-ink-2">{note}</p>}
      <EntityForm
        fields={[
          {
            name: "activity",
            label: "What you played",
            type: "select",
            required: true,
            options: [...activities.map((item) => ({ value: item.id, label: item.label })), { value: OTHER, label: "Something else" }],
          },
          { name: "other", label: "Name", required: true, maxLength: 80, when: (values) => values.activity === OTHER },
          { name: "minutes", label: "Minutes", type: "number", required: true, min: 1, max: 600, half: true },
          { name: "kcal", label: "Calories, if you know", type: "number", min: 0, max: 10000, half: true, hint: "Empty uses the estimate" },
        ]}
        initial={{ activity: activities[0]?.id ?? OTHER, minutes: 60 }}
        submitLabel="Log game"
        onCancel={onClose}
        onSubmit={async (values) => {
          const activity = activities.find((item) => item.id === values.activity);
          const minutes = Number(values.minutes);
          await onSubmit({
            title: activity?.label ?? String(values.other),
            minutes,
            kcal: values.kcal === null || values.kcal === undefined ? kcalFromRange(activity?.value, minutes) : Number(values.kcal),
          });
          onClose();
        }}
      />
    </Modal>
  );
}
