"use client";

import { useState } from "react";
import { MEAL_LABEL, MEAL_TYPES, type MealType } from "@/components/health/shared";
import { Card, PageHeader, Skeleton } from "@/components/ui/primitives";
import { useRemove, useRows, useSave } from "@/lib/data";

interface Plan {
  id: string;
  weekday: number;
  meal_type: MealType;
  items: string;
}

// Monday first, matching how most people plan a week. Stored as Date.getDay() values.
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAME = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function PlanCell({ weekday, type, plan }: { weekday: number; type: MealType; plan?: Plan }) {
  const [value, setValue] = useState(plan?.items ?? "");
  const [lastSaved, setLastSaved] = useState(plan?.items ?? "");
  const save = useSave("meal_plans");
  const remove = useRemove("meal_plans", { successMessage: "Cleared" });

  function commit() {
    const items = value.trim();
    if (items === lastSaved) return;
    setLastSaved(items);
    if (!items) {
      if (plan) remove.mutate(plan.id);
      return;
    }
    save.mutate(plan ? { id: plan.id, items } : { weekday, meal_type: type, items });
  }

  return (
    <input
      aria-label={`${DAY_NAME[weekday]} ${MEAL_LABEL[type]}`}
      value={value}
      maxLength={300}
      placeholder="–"
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className="h-10 w-full min-w-28 rounded-lg border border-transparent bg-transparent px-2 text-[13px] outline-none transition-colors placeholder:text-ink-3 hover:bg-surface-2 focus:border-line-2 focus:bg-field"
    />
  );
}

export default function MealPlansPage() {
  const { data: plans = [], isLoading } = useRows<Plan>("meal_plans");
  const todayIndex = new Date().getDay();

  return (
    <>
      <PageHeader title="Meal plans" subtitle="A loose week. Type in any cell; it saves when you leave it." />
      {isLoading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-1">
            <thead>
              <tr className="text-left text-[13px] text-ink-3">
                <th scope="col" className="pr-3 font-normal">
                  <span className="sr-only">Day</span>
                </th>
                {MEAL_TYPES.map((type) => (
                  <th key={type} scope="col" className="px-2 pb-1 font-normal">
                    {MEAL_LABEL[type]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEEK.map((weekday) => (
                <tr key={weekday}>
                  <th scope="row" className={`pr-3 text-left text-sm font-normal whitespace-nowrap ${weekday === todayIndex ? "text-ink" : "text-ink-2"}`}>
                    {DAY_NAME[weekday]}
                    {weekday === todayIndex && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-diet align-middle" title="Today" />}
                  </th>
                  {MEAL_TYPES.map((type) => {
                    const plan = plans.find((p) => p.weekday === weekday && p.meal_type === type);
                    return (
                      <td key={type}>
                        <PlanCell key={plan?.id ?? "empty"} weekday={weekday} type={type} plan={plan} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
