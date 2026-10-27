"use client";

import { useTargets } from "@/components/diet/shared";
import { EntityForm } from "@/components/ui/entity-form";
import { Card, PageHeader, Skeleton } from "@/components/ui/primitives";
import { useSave } from "@/lib/data";

export default function TargetsPage() {
  const { data } = useTargets();
  const save = useSave("diet_targets", { successMessage: "Targets saved" });
  const targets = data?.[0];

  return (
    <>
      <PageHeader title="Targets" subtitle="What a good day looks like, to you." />
      <Card className="max-w-lg">
        {!targets ? (
          <Skeleton className="h-64" />
        ) : (
          <EntityForm
            key={targets.id}
            submitLabel="Save targets"
            initial={{ ...targets }}
            fields={[
              { name: "calories", label: "Calories (kcal)", type: "number", required: true, min: 0, max: 10000 },
              { name: "protein", label: "Protein (g)", type: "number", required: true, min: 0, half: true },
              { name: "carbs", label: "Carbs (g)", type: "number", required: true, min: 0, half: true },
              { name: "fat", label: "Fat (g)", type: "number", required: true, min: 0, half: true },
              { name: "water_ml", label: "Water (ml)", type: "number", required: true, min: 0, max: 10000, half: true },
            ]}
            onSubmit={async (values) => {
              await save.mutateAsync({ ...values, id: targets.id });
            }}
          />
        )}
      </Card>
    </>
  );
}
