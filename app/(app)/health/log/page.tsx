"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MEAL_LABEL, MealForm, mealTime, type MealLog } from "@/components/diet/shared";
import { Button } from "@/components/ui/button";
import { Card, Chip, Empty, ErrorNote, ListSkeleton, PageHeader } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useRows } from "@/lib/data";
import { addDays, formatDayLong, number, today } from "@/lib/format";

function MealLogContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [day, setDay] = useState(today());
  const [editing, setEditing] = useState<Partial<MealLog> | null>(params.get("new") ? {} : null);
  const { data: meals = [], isLoading, error } = useRows<MealLog>("meal_logs", {
    filters: [["logged_on", "eq", day]],
    order: [["logged_time"]],
  });
  const remove = useRemove("meal_logs");
  const calories = meals.reduce((sum, meal) => sum + Number(meal.calories), 0);

  function close() {
    setEditing(null);
    if (params.get("new")) router.replace("/diet/log");
  }

  return (
    <>
      <PageHeader
        title="Meal log"
        action={
          <Button onClick={() => setEditing({ logged_on: day })}>
            <Plus size={15} aria-hidden /> Log a meal
          </Button>
        }
      />
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Previous day" onClick={() => setDay(addDays(day, -1))} className="pressable cursor-pointer rounded-full p-2 hover:bg-surface-2">
              <ChevronLeft size={16} aria-hidden />
            </button>
            <span className="display text-xl">{formatDayLong(day)}</span>
            <button
              type="button"
              aria-label="Next day"
              disabled={day >= today()}
              onClick={() => setDay(addDays(day, 1))}
              className="pressable cursor-pointer rounded-full p-2 hover:bg-surface-2 disabled:opacity-30"
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
          <span className="tabular text-sm text-ink-2">{number(calories)} kcal</span>
        </div>
        <ErrorNote error={error} />
        {isLoading ? (
          <ListSkeleton />
        ) : meals.length === 0 ? (
          <Empty title="Nothing logged" hint="This day is a blank plate." />
        ) : (
          <ul className="divide-y divide-line">
            {meals.map((meal) => (
              <li key={meal.id} className="flex items-center gap-3 py-2.5">
                <Chip tone="diet">{MEAL_LABEL[meal.meal_type]}</Chip>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{meal.name}</p>
                  <p className="tabular text-xs text-ink-3">
                    {mealTime(meal)} · P {number(meal.protein)} · C {number(meal.carbs)} · F {number(meal.fat)}
                  </p>
                </div>
                <span className="tabular text-sm">{number(meal.calories)}</span>
                <RowActions onEdit={() => setEditing(meal)} onDelete={() => remove.mutate(meal.id)} deleteTitle={`Delete ${meal.name}?`} />
              </li>
            ))}
          </ul>
        )}
      </Card>
      {editing && <MealForm meal={editing} onClose={close} />}
    </>
  );
}

export default function MealLogPage() {
  return (
    <Suspense>
      <MealLogContent />
    </Suspense>
  );
}
