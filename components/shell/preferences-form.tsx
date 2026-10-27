"use client";

import { EntityForm, type FieldDef } from "@/components/ui/entity-form";
import { Skeleton } from "@/components/ui/primitives";
import { useProfile, useUpdateProfile } from "@/lib/profile";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const PREFERENCE_FIELDS: FieldDef[] = [
  { name: "display_name", label: "Your name", required: true, maxLength: 80 },
  {
    name: "currency",
    label: "Currency",
    type: "select",
    required: true,
    half: true,
    options: [{ value: "INR", label: "Indian rupee (₹)" }],
  },
  {
    name: "weekStart",
    label: "First day of the week",
    type: "select",
    required: true,
    half: true,
    options: WEEKDAYS.map((label, value) => ({ value: String(value), label })),
  },
  {
    name: "monthStart",
    label: "Your month starts on day",
    type: "number",
    required: true,
    min: 1,
    max: 28,
    half: true,
    hint: "Handy for salary-cycle budgets.",
  },
  { name: "salaryDay", label: "Salary arrives on day", type: "number", required: true, min: 1, max: 28, half: true },
];

export function preferencesPayload(values: Record<string, unknown>, timezone: string) {
  return {
    display_name: values.display_name as string,
    preferences: {
      currency: values.currency as string,
      weekStart: Number(values.weekStart),
      monthStart: Number(values.monthStart),
      salaryDay: Number(values.salaryDay),
      timezone,
    },
  };
}

export function PreferencesForm({
  fields = PREFERENCE_FIELDS,
  submitLabel = "Save preferences",
}: {
  fields?: FieldDef[];
  submitLabel?: string;
}) {
  const { data: profile } = useProfile();
  const update = useUpdateProfile("Preferences saved");
  if (!profile) return <Skeleton className="h-52" />;

  return (
    <EntityForm
      key={profile.id}
      submitLabel={submitLabel}
      fields={fields}
      initial={{ display_name: profile.display_name, ...profile.preferences }}
      onSubmit={async (values) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await update.mutateAsync(preferencesPayload({ ...profile.preferences, display_name: profile.display_name, ...values }, timezone));
      }}
    />
  );
}
