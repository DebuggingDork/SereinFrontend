"use client";

import { EntityForm, type FieldDef } from "@/components/ui/entity-form";
import { Skeleton } from "@/components/ui/primitives";
import { useProfile, useUpdateProfile, type Preferences } from "@/lib/profile";

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
  {
    name: "salaryRule",
    label: "Salary arrives",
    type: "select",
    required: true,
    half: true,
    options: [
      { value: "last_working_day", label: "Last working day of the month" },
      { value: "last_day", label: "Last day of the month" },
      { value: "first_working_day", label: "First working day of the month" },
      { value: "date", label: "On a fixed date" },
    ],
  },
  {
    name: "salaryDay",
    label: "Date",
    type: "number",
    required: true,
    min: 1,
    max: 31,
    half: true,
    hint: "A short month uses its last day.",
    when: (values) => values.salaryRule === "date",
  },
];

export function preferencesPayload(values: Record<string, unknown>, timezone: string) {
  return {
    display_name: values.display_name as string,
    preferences: {
      currency: values.currency as string,
      weekStart: Number(values.weekStart),
      monthStart: Number(values.monthStart),
      salaryDay: Number(values.salaryDay) || 1,
      salaryRule: (values.salaryRule as Preferences["salaryRule"]) ?? "date",
      salaryAccountId: (values.salaryAccountId as string) || null,
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
      initial={{ display_name: profile.display_name, salaryRule: "date", ...profile.preferences }}
      onSubmit={async (values) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await update.mutateAsync(preferencesPayload({ ...profile.preferences, display_name: profile.display_name, ...values }, timezone));
      }}
    />
  );
}
