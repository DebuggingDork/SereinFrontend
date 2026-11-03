"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Card, Chip } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { friendlyError, invalidateTable, useRows } from "@/lib/data";
import { today } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";
import { inSection, usePlanItems, type WorkoutSession } from "./plan-data";
import { useTargets, type MealLog } from "./shared";

interface Checkin {
  id: string;
  logged_on: string;
  done: string[];
}

// What can be read from the day's logs instead of being ticked by hand.
function useAutoChecks(now: string) {
  const { data: targetRows, isSuccess: targetsReady } = useTargets();
  const { data: meals = [], isSuccess: mealsReady } = useRows<MealLog>("meal_logs", { filters: [["logged_on", "eq", now]], order: [["logged_time"]] });
  const { data: water = [], isSuccess: waterReady } = useRows<{ amount_ml: number }>("water_logs", { filters: [["logged_on", "eq", now]] });
  const { data: weight = [], isSuccess: weightReady } = useRows<{ id: string }>("weight_logs", { filters: [["logged_on", "eq", now]] });
  const { data: sessions = [], isSuccess: sessionsReady } = useRows<WorkoutSession>("workout_sessions", { filters: [["logged_on", "eq", now]] });

  const target = targetRows?.[0];
  const calories = meals.reduce((sum, meal) => sum + Number(meal.calories), 0);
  const protein = meals.reduce((sum, meal) => sum + Number(meal.protein), 0);
  const waterTotal = water.reduce((sum, row) => sum + row.amount_ml, 0);

  return {
    ready: targetsReady && mealsReady && waterReady && weightReady && sessionsReady,
    met: {
      weigh: weight.length > 0,
      protein: Boolean(target) && protein >= Number(target?.protein),
      calories: Boolean(target) && calories >= Number(target?.calories) * 0.9 && calories <= Number(target?.calories) * 1.05,
      water: Boolean(target) && waterTotal >= Number(target?.water_ml),
      session: sessions.some((session) => session.completed_at),
    } as Record<string, boolean>,
  };
}

export function DailyChecklist() {
  const now = today();
  const { data: items = [] } = usePlanItems();
  const checklist = inSection(items, "checklist");
  const { data: checkins, isSuccess: checkinReady } = useRows<Checkin>("health_checkins", { filters: [["logged_on", "eq", now]] });
  const { ready, met } = useAutoChecks(now);
  const client = useQueryClient();
  const { toast } = useToast();

  const stored = useMemo(() => checkins?.[0]?.done ?? [], [checkins]);
  const autoMet = useMemo(() => checklist.filter((item) => item.value && met[item.value]).map((item) => item.id), [checklist, met]);
  const done = useMemo(() => new Set([...stored, ...autoMet]), [stored, autoMet]);
  const count = checklist.filter((item) => done.has(item.id)).length;

  const save = useMutation({
    mutationFn: async (next: string[]) => {
      const { error } = await supabaseBrowser()
        .from("health_checkins")
        .upsert({ logged_on: now, done: next, total: checklist.length }, { onConflict: "user_id,logged_on" });
      if (error) throw friendlyError(error);
    },
    onSuccess: () => invalidateTable(client, "health_checkins"),
    onError: (error) => toast(error.message, { tone: "error" }),
  });

  // Ticks earned from the logs are stored too, so past days keep their score on the charts.
  const synced = useRef("");
  useEffect(() => {
    if (!ready || !checkinReady || checklist.length === 0) return;
    const missing = autoMet.filter((id) => !stored.includes(id));
    const key = [...stored, ...missing].sort().join();
    if (missing.length === 0 || synced.current === key) return;
    synced.current = key;
    save.mutate([...stored, ...missing]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `save` changes every render.
  }, [ready, checkinReady, autoMet, stored, checklist.length]);

  if (checklist.length === 0) return null;

  function toggle(id: string) {
    save.mutate(done.has(id) ? stored.filter((other) => other !== id) : [...stored, id]);
  }

  return (
    <Card
      title="Daily checklist"
      action={
        count === checklist.length ? (
          <Chip tone="good">Clean day</Chip>
        ) : (
          <span className="figure text-xl leading-none">
            {count}
            <span className="text-ink-3"> / {checklist.length}</span>
          </span>
        )
      }
    >
      <ul className="space-y-1.5">
        {checklist.map((item) => {
          const checked = done.has(item.id);
          const earned = autoMet.includes(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                disabled={earned}
                onClick={() => toggle(item.id)}
                className={`pressable flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm disabled:cursor-default ${
                  checked ? "border-transparent bg-good-soft" : "border-line hover:border-line-2"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                    checked ? "border-transparent bg-good text-surface" : "border-line-2"
                  }`}
                >
                  {checked && <Check size={13} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">{item.label}</span>
                {earned && <span className="shrink-0 text-xs text-good">From your log</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
