"use client";

import { useMemo } from "react";
import { EntityForm, type FieldDef } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { useRows, useSave } from "@/lib/data";
import { formatTime, today } from "@/lib/format";

export const MEAL_TYPES = ["breakfast", "lunch", "snack", "dinner"] as const;
export type MealType = (typeof MEAL_TYPES)[number];
export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
  dinner: "Dinner",
};

export interface Food {
  id: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: "protein" | "carb" | "combo" | "other";
  diet_type: "veg" | "nonveg" | null;
  meal_type: MealType | null;
  position: number;
}

export interface MealLog {
  id: string;
  logged_on: string;
  logged_time: string;
  meal_type: MealType;
  food_id: string | null;
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietTargets {
  id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water_ml: number;
}

export const useFoods = () => useRows<Food>("foods", { order: [["position"], ["name"]] });
export const useTargets = () => useRows<DietTargets>("diet_targets", { limit: 1 });

// Suggests the meal from the clock, so logging lunch at lunchtime takes one less tap.
export function mealForNow(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 19) return "snack";
  return "dinner";
}

const nowTime = () => new Date().toTimeString().slice(0, 5);

export function MealForm({
  meal,
  onClose,
}: {
  meal?: Partial<MealLog> | null;
  onClose: () => void;
}) {
  const { data: foods = [] } = useFoods();
  const save = useSave("meal_logs", { successMessage: "Logged" });

  const fields = useMemo<FieldDef[]>(
    () => [
      {
        name: "food_id",
        label: "From my foods",
        type: "select",
        options: foods.map((food) => ({ value: food.id, label: `${food.name} (${food.serving})` })),
        hint: "Pick a saved food, or leave this and type below.",
      },
      {
        name: "name",
        label: "Or a custom name",
        maxLength: 80,
        when: (values) => !values.food_id,
        required: true,
      },
      {
        name: "meal_type",
        label: "Meal",
        type: "select",
        required: true,
        half: true,
        options: MEAL_TYPES.map((value) => ({ value, label: MEAL_LABEL[value] })),
      },
      { name: "quantity", label: "Servings", type: "number", required: true, min: 0.1, half: true },
      { name: "logged_on", label: "Date", type: "date", required: true, half: true },
      { name: "logged_time", label: "Time", type: "time", required: true, half: true },
      { name: "calories", label: "Calories", type: "number", min: 0, half: true, when: (values) => !values.food_id },
      { name: "protein", label: "Protein (g)", type: "number", min: 0, half: true, when: (values) => !values.food_id },
      { name: "carbs", label: "Carbs (g)", type: "number", min: 0, half: true, when: (values) => !values.food_id },
      { name: "fat", label: "Fat (g)", type: "number", min: 0, half: true, when: (values) => !values.food_id },
    ],
    [foods],
  );

  async function submit(values: Record<string, unknown>) {
    const quantity = Number(values.quantity);
    const food = foods.find((f) => f.id === values.food_id);
    const macros = food
      ? {
          name: food.name,
          calories: Number(food.calories) * quantity,
          protein: Number(food.protein) * quantity,
          carbs: Number(food.carbs) * quantity,
          fat: Number(food.fat) * quantity,
        }
      : {
          name: values.name,
          calories: Number(values.calories ?? 0),
          protein: Number(values.protein ?? 0),
          carbs: Number(values.carbs ?? 0),
          fat: Number(values.fat ?? 0),
        };

    await save.mutateAsync({
      ...(meal?.id ? { id: meal.id } : {}),
      food_id: values.food_id ?? null,
      meal_type: values.meal_type,
      quantity,
      logged_on: values.logged_on,
      logged_time: values.logged_time,
      ...macros,
    });
    onClose();
  }

  return (
    <Modal title={meal?.id ? "Edit meal" : "Log a meal"} onClose={onClose}>
      <EntityForm
        fields={fields}
        initial={{
          meal_type: mealForNow(),
          quantity: 1,
          logged_on: today(),
          logged_time: nowTime(),
          ...meal,
        }}
        onCancel={onClose}
        onSubmit={submit}
      />
    </Modal>
  );
}

export function mealTime(meal: MealLog) {
  return formatTime(meal.logged_time);
}
