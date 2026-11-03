"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { MEAL_LABEL, MEAL_TYPES, MealForm, mealTime, useFoods, useTargets, type MealLog } from "@/components/health/shared";
import { WaterButtons } from "@/components/health/water-buttons";
import { Button } from "@/components/ui/button";
import { Card, Empty, PageHeader, ProgressBar, Ring, Skeleton } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useRows, useSave } from "@/lib/data";
import { formatDayLong, number, today } from "@/lib/format";

function Macro({ label, value, target }: { label: string; value: number; target: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[13px]">
        <span className="text-ink-2">{label}</span>
        <span className="tabular">
          {number(value)} / {number(target)} g
        </span>
      </div>
      <ProgressBar value={target ? value / target : 0} color="var(--health)" label={label} />
    </div>
  );
}

export default function HealthTodayPage() {
  const now = today();
  const { data: meals = [], isLoading } = useRows<MealLog>("meal_logs", {
    filters: [["logged_on", "eq", now]],
    order: [["logged_time"]],
  });
  const { data: targetRows } = useTargets();
  const { data: water = [] } = useRows<{ amount_ml: number }>("water_logs", { filters: [["logged_on", "eq", now]] });
  const { data: foods = [] } = useFoods();
  const { data: plans = [] } = useRows<{ meal_type: string; items: string }>("meal_plans", {
    filters: [["weekday", "eq", new Date().getDay()]],
  });
  const [editing, setEditing] = useState<Partial<MealLog> | null>(null);
  const remove = useRemove("meal_logs");
  const save = useSave("meal_logs", { successMessage: "Logged" });

  const target = targetRows?.[0];
  const totals = meals.reduce(
    (sum, meal) => ({
      calories: sum.calories + Number(meal.calories),
      protein: sum.protein + Number(meal.protein),
      carbs: sum.carbs + Number(meal.carbs),
      fat: sum.fat + Number(meal.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const calorieTarget = Number(target?.calories ?? 2000);
  const waterTotal = water.reduce((sum, row) => sum + row.amount_ml, 0);
  const waterGoal = target?.water_ml ?? 2500;

  return (
    <>
      <PageHeader
        title="Today"
        subtitle={formatDayLong(now)}
        action={
          <Button onClick={() => setEditing({})}>
            <Plus size={15} aria-hidden /> Log a meal
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card title="Calories and macros">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Ring value={totals.calories / calorieTarget} color="var(--health)" size={112} thickness={10}>
              <span className="text-center leading-tight">
                <span className="figure block text-2xl">{number(totals.calories)}</span>
                <span className="text-[11px] text-ink-3">of {number(calorieTarget)}</span>
              </span>
            </Ring>
            <div className="min-w-0 flex-1 space-y-3">
              <Macro label="Protein" value={totals.protein} target={Number(target?.protein ?? 0)} />
              <Macro label="Carbs" value={totals.carbs} target={Number(target?.carbs ?? 0)} />
              <Macro label="Fat" value={totals.fat} target={Number(target?.fat ?? 0)} />
            </div>
          </div>
        </Card>
        <Card title="Water">
          <p className="figure text-[40px] leading-tight">
            {number(Math.max(waterTotal, 0))}
            <span className="ml-1 font-sans text-sm tracking-normal text-ink-3">/ {number(waterGoal)} ml</span>
          </p>
          <div className="mt-3 mb-4">
            <ProgressBar value={waterTotal / waterGoal} color="var(--health)" label="Water today" />
          </div>
          <WaterButtons current={waterTotal} />
        </Card>
      </div>

      {foods.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[13px] text-ink-3">One tap:</span>
          {foods.slice(0, 8).map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() =>
                save.mutate({
                  food_id: food.id,
                  name: food.name,
                  meal_type: MEAL_TYPES[new Date().getHours() < 11 ? 0 : new Date().getHours() < 16 ? 1 : new Date().getHours() < 19 ? 2 : 3],
                  quantity: 1,
                  calories: food.calories,
                  protein: food.protein,
                  carbs: food.carbs,
                  fat: food.fat,
                  logged_on: now,
                  logged_time: new Date().toTimeString().slice(0, 5),
                })
              }
              className="pressable cursor-pointer rounded-full border border-line px-3 py-1 text-[13px] hover:border-line-2"
            >
              {food.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-52 rounded-3xl" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {MEAL_TYPES.map((type) => {
            const items = meals.filter((meal) => meal.meal_type === type);
            const planned = plans.find((plan) => plan.meal_type === type);
            const calories = items.reduce((sum, meal) => sum + Number(meal.calories), 0);
            return (
              <Card
                key={type}
                title={MEAL_LABEL[type]}
                action={calories > 0 && <span className="tabular text-[13px] text-ink-2">{number(calories)} kcal</span>}
              >
                {items.length === 0 ? (
                  <Empty
                    compact
                    title={planned ? planned.items : "Nothing yet"}
                    hint={planned ? "Planned for today" : undefined}
                    action={
                      <Button size="sm" variant="soft" onClick={() => setEditing({ meal_type: type })}>
                        Log {MEAL_LABEL[type].toLowerCase()}
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {items.map((meal) => (
                      <li key={meal.id} className="flex items-center gap-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">
                            {meal.name}
                            {Number(meal.quantity) !== 1 && <span className="text-ink-3"> × {Number(meal.quantity)}</span>}
                          </p>
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
            );
          })}
        </div>
      )}

      {editing && <MealForm meal={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
