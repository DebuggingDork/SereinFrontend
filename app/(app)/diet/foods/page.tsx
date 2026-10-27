"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useFoods, type Food } from "@/components/diet/shared";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { Card, Empty, ErrorNote, ListSkeleton, PageHeader } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useSave } from "@/lib/data";
import { number } from "@/lib/format";

export default function FoodsPage() {
  const { data: foods = [], isLoading, error } = useFoods();
  const [editing, setEditing] = useState<Partial<Food> | null>(null);
  const save = useSave("foods", { successMessage: "Saved" });
  const remove = useRemove("foods");

  return (
    <>
      <PageHeader
        title="Foods"
        subtitle="Save your usual foods once, and reuse them with one tap."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus size={15} aria-hidden /> Add
          </Button>
        }
      />
      <ErrorNote error={error} />
      {isLoading ? (
        <ListSkeleton />
      ) : foods.length === 0 ? (
        <Card>
          <Empty title="No foods yet" hint="Poha, dal and rice, a whey shake. Whatever you eat most." />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {foods.map((food) => (
              <li key={food.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{food.name}</p>
                  <p className="tabular text-xs text-ink-3">
                    {food.serving} · P {number(food.protein)} · C {number(food.carbs)} · F {number(food.fat)}
                  </p>
                </div>
                <span className="tabular text-sm">{number(food.calories)} kcal</span>
                <RowActions
                  onEdit={() => setEditing(food)}
                  onDelete={() => remove.mutate(food.id)}
                  deleteTitle={`Delete ${food.name}?`}
                  deleteBody="Meals you already logged keep their numbers."
                />
              </li>
            ))}
          </ul>
        </Card>
      )}
      {editing && (
        <Modal title={editing.id ? `Edit ${editing.name}` : "New food"} onClose={() => setEditing(null)}>
          <EntityForm
            initial={{ serving: "1 serving", ...editing }}
            fields={[
              { name: "name", label: "Name", required: true, maxLength: 80, half: true },
              { name: "serving", label: "Serving", required: true, maxLength: 40, half: true },
              { name: "calories", label: "Calories", type: "number", required: true, min: 0, half: true },
              { name: "protein", label: "Protein (g)", type: "number", required: true, min: 0, half: true },
              { name: "carbs", label: "Carbs (g)", type: "number", required: true, min: 0, half: true },
              { name: "fat", label: "Fat (g)", type: "number", required: true, min: 0, half: true },
            ]}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await save.mutateAsync(editing.id ? { ...values, id: editing.id } : values);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
