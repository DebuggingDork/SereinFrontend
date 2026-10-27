"use client";

import { PREFERENCE_FIELDS, PreferencesForm } from "@/components/shell/preferences-form";
import { Card, PageHeader } from "@/components/ui/primitives";

export default function PlannerSettingsPage() {
  return (
    <>
      <PageHeader title="Planner settings" subtitle="Weeks and streaks follow your first day of the week." />
      <Card className="max-w-lg">
        <PreferencesForm fields={PREFERENCE_FIELDS.filter((f) => f.name === "weekStart")} />
      </Card>
    </>
  );
}
