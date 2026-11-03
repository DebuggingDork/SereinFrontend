"use client";

import { Check, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { inSection, usePlanItems } from "@/components/health/plan-data";
import { AddItem, EditingContext, ItemActions, RuleList } from "@/components/health/plan-items";
import { MEAL_LABEL, MEAL_TYPES, mealForNow, useFoods, type Food, type MealType } from "@/components/health/shared";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { Card, Empty, ErrorNote, ListSkeleton, PageHeader, SegmentedControl } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useSave } from "@/lib/data";
import { number, today } from "@/lib/format";

type Category = Food["category"];
type DietFilter = "all" | "veg" | "nonveg";

const TABS: { value: Category; label: string }[] = [
  { value: "protein", label: "Protein" },
  { value: "carb", label: "Carbs" },
  { value: "combo", label: "Combos" },
  { value: "other", label: "My foods" },
];

export default function FoodsPage() {
  const { data: foods = [], isLoading, error } = useFoods();
  const { data: items = [] } = usePlanItems();
  const [picked, setPicked] = useState<Category | null>(null);
  const [diet, setDiet] = useState<DietFilter>("all");
  const [editing, setEditing] = useState<Partial<Food> | null>(null);
  const [editingList, setEditingNotes] = useState(false);
  const save = useSave("foods", { successMessage: "Saved" });
  const remove = useRemove("foods");
  const logMeal = useSave("meal_logs", { successMessage: "Added to today" });

  const firstFilled = TABS.find((tab) => foods.some((food) => food.category === tab.value))?.value ?? "other";
  const tab = picked ?? firstFilled;
  const inTab = foods.filter((food) => food.category === tab);
  const shown = tab === "protein" && diet !== "all" ? inTab.filter((food) => food.diet_type === diet) : inTab;
  const eatingRules = inSection(items, "eating_rule");
  const notes = inSection(items, "food_note").filter((item) => item.grp === tab);
  const ruleGroup = eatingRules[0]?.grp ?? "Eating rules";

  function add(food: Food) {
    logMeal.mutate({
      food_id: food.id,
      name: food.name,
      meal_type: food.meal_type ?? mealForNow(),
      quantity: 1,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      logged_on: today(),
      logged_time: new Date().toTimeString().slice(0, 5),
    });
  }

  function foodRow(food: Food) {
    return (
      <li key={food.id} className="flex items-center gap-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-balance">{food.name}</p>
          <p className="text-[13px] leading-snug text-ink-2">{food.serving}</p>
        </div>
        <span className="tabular shrink-0 text-right text-sm">
          {Number(food.protein) > 0 && <span className="block sm:inline">{number(food.protein)} g</span>}
          <span className="block text-[13px] text-ink-2 sm:ml-2 sm:inline">{number(food.calories)} kcal</span>
        </span>
        <Button variant="soft" size="sm" aria-label={`Add ${food.name} to today`} onClick={() => add(food)} disabled={logMeal.isPending}>
          <Plus size={13} aria-hidden /> Add
        </Button>
        {editingList && (
          <RowActions
            onEdit={() => setEditing(food)}
            onDelete={() => remove.mutate(food.id)}
            deleteTitle={`Delete ${food.name}?`}
            deleteBody="Meals you already logged keep their numbers."
          />
        )}
      </li>
    );
  }

  return (
    <EditingContext.Provider value={editingList}>
      <PageHeader
        title="Foods"
        subtitle="Pick what fits. Add it to today in one tap."
        action={
          <>
            <Button variant={editingList ? "primary" : "soft"} onClick={() => setEditingList((value) => !value)}>
              {editingList ? <Check size={15} aria-hidden /> : <Pencil size={14} aria-hidden />}
              {editingList ? "Done editing" : "Edit list"}
            </Button>
            {!editingList && (
              <Button onClick={() => setEditing({ category: tab })}>
                <Plus size={15} aria-hidden /> New food
              </Button>
            )}
          </>
        }
      />
      <ErrorNote error={error} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl label="Food list" options={TABS} value={tab} onChange={setPicked} />
        {tab === "protein" && (
          <SegmentedControl
            label="Diet"
            options={[
              { value: "all", label: "All" },
              { value: "veg", label: "Veg" },
              { value: "nonveg", label: "Non-veg" },
            ]}
            value={diet}
            onChange={setDiet}
          />
        )}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {isLoading ? (
            <ListSkeleton />
          ) : shown.length === 0 ? (
            <Card>
              <Empty
                title="Nothing here yet"
                hint={tab === "combo" ? "Save a full meal you eat often, with its calories and protein." : "Dal and rice, a whey shake, whatever you eat most."}
              />
            </Card>
          ) : tab === "combo" ? (
            MEAL_TYPES.map((type: MealType) => {
              const rows = shown.filter((food) => food.meal_type === type);
              return rows.length === 0 ? null : (
                <Card key={type} title={`${MEAL_LABEL[type]} options`}>
                  <ul className="divide-y divide-line">{rows.map(foodRow)}</ul>
                </Card>
              );
            })
          ) : (
            <Card>
              <ul className="divide-y divide-line">{shown.map(foodRow)}</ul>
            </Card>
          )}
          {notes.map((item) => (
            <p key={item.id} className="flex max-w-[70ch] items-start gap-2 px-1 text-sm leading-relaxed text-pretty text-ink-2">
              <span className="flex-1">{item.label}</span>
              <ItemActions item={item} />
            </p>
          ))}
        </div>

        {(eatingRules.length > 0 || editingList) && (
          <aside>
            <Card
              title={ruleGroup}
              action={
                <span className="flex items-center gap-1">
                  <AddItem section="eating_rule" items={eatingRules} grp={ruleGroup} />
                  <Button variant="ghost" size="sm" onClick={() => setEditingNotes((value) => !value)}>
                    {editingList ? "Done" : "Edit"}
                  </Button>
                </span>
              }
            >
              <RuleList items={eatingRules} />
            </Card>
          </aside>
        )}
      </div>

      {editing && (
        <Modal title={editing.id ? `Edit ${editing.name}` : "New food"} onClose={() => setEditing(null)}>
          <EntityForm
            initial={{ serving: "1 serving", category: "other", ...editing }}
            fields={[
              { name: "name", label: "Name", required: true, maxLength: 80 },
              { name: "serving", label: "Serving", required: true, maxLength: 80 },
              {
                name: "category",
                label: "List",
                type: "select",
                required: true,
                half: true,
                options: TABS.map((option) => ({ value: option.value, label: option.label })),
              },
              {
                name: "diet_type",
                label: "Diet",
                type: "select",
                half: true,
                options: [
                  { value: "veg", label: "Veg" },
                  { value: "nonveg", label: "Non-veg" },
                ],
                when: (values) => values.category === "protein",
              },
              {
                name: "meal_type",
                label: "Meal",
                type: "select",
                half: true,
                options: MEAL_TYPES.map((value) => ({ value, label: MEAL_LABEL[value] })),
                when: (values) => values.category === "combo",
              },
              { name: "calories", label: "Calories", type: "number", required: true, min: 0, half: true },
              { name: "protein", label: "Protein (g)", type: "number", required: true, min: 0, half: true },
              { name: "carbs", label: "Carbs (g)", type: "number", required: true, min: 0, half: true },
              { name: "fat", label: "Fat (g)", type: "number", required: true, min: 0, half: true },
            ]}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await save.mutateAsync(editing.id ? { ...values, id: editing.id } : values);
              setPicked(values.category as Category);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </EditingContext.Provider>
  );
}
