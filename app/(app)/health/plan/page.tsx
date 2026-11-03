"use client";

import { Check, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { CheckpointList } from "@/components/health/checkpoints";
import { PlanForm } from "@/components/health/plan-form";
import { PlanHero } from "@/components/health/plan-hero";
import { inSection, usePlan, usePlanItems, type PlanItem } from "@/components/health/plan-data";
import { AddItem, Callout, EditingContext, ItemActions, SectionTitle } from "@/components/health/plan-items";
import { useTargets } from "@/components/health/shared";
import { Button } from "@/components/ui/button";
import { Card, Empty, ErrorNote, PageHeader, SegmentedControl, Skeleton } from "@/components/ui/primitives";
import { useSave } from "@/lib/data";
import { number } from "@/lib/format";

function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9 || 1;
  const parts = [
    { label: "protein", grams: protein, share: (protein * 4) / total, background: "#92400e", color: "#fff" },
    { label: "carbs", grams: carbs, share: (carbs * 4) / total, background: "#f59e0b", color: "#1c1303" },
    { label: "fat", grams: fat, share: (fat * 9) / total, background: "#fcd34d", color: "#1c1303" },
  ];
  return (
    <div
      role="img"
      aria-label={`${number(protein)} g protein, ${number(carbs)} g carbs, ${number(fat)} g fat`}
      className="tabular flex h-9 gap-0.5 overflow-hidden rounded-xl text-[12px] font-medium"
    >
      {parts.map((part) => (
        <div
          key={part.label}
          className="flex min-w-0 items-center justify-center overflow-hidden px-1 whitespace-nowrap"
          style={{ flexGrow: part.share, flexBasis: 0, background: part.background, color: part.color }}
        >
          {number(part.grams)} g <span className="ml-1 hidden sm:inline">{part.label}</span>
        </div>
      ))}
    </div>
  );
}

function Workday({ items, active, planId }: { items: PlanItem[]; active: string | null; planId: string }) {
  const save = useSave("health_plans");
  const routines = useMemo(() => [...new Set(items.map((item) => item.grp ?? "Routine"))], [items]);
  const [picked, setPicked] = useState<string | null>(null);
  const current = picked ?? (active && routines.includes(active) ? active : routines[0]);
  const rows = items.filter((item) => (item.grp ?? "Routine") === current);
  const intro = rows.filter((item) => !item.value && item.position === Math.min(...rows.map((row) => row.position)));
  const notes = rows.filter((item) => !item.value && !intro.includes(item));
  const steps = rows.filter((item) => item.value);

  function choose(value: string) {
    setPicked(value);
    save.mutate({ id: planId, active_routine: value });
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {routines.length > 1 && <SegmentedControl label="Your routine" options={routines.map((value) => ({ value, label: value }))} value={current ?? ""} onChange={choose} />}
        <AddItem section="routine" items={items} grp={current} label="Add step" />
      </div>
      <Card>
        {intro.map((item) => (
          <p key={item.id} className="mb-4 flex max-w-[65ch] items-start gap-2 text-sm leading-relaxed text-pretty text-ink-2">
            <span className="flex-1">{item.label}</span>
            <ItemActions item={item} />
          </p>
        ))}
        <ol className="divide-y divide-line">
          {steps.map((item) => (
            <li key={item.id} className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-baseline gap-3 py-2.5">
              <span className="figure text-[17px]">{item.value}</span>
              <span className="text-sm leading-relaxed text-pretty">{item.label}</span>
              <ItemActions item={item} />
            </li>
          ))}
        </ol>
        {notes.map((item) => (
          <div key={item.id} className="mt-4">
            <Callout tone="warn">
              <span className="flex items-start gap-2">
                <span className="flex-1">{item.label}</span>
                <ItemActions item={item} />
              </span>
            </Callout>
          </div>
        ))}
      </Card>
    </>
  );
}

export default function PlanPage() {
  const { plan, isLoading, error } = usePlan();
  const { data: items = [] } = usePlanItems();
  const { data: targetRows } = useTargets();
  const target = targetRows?.[0];
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const stats = inSection(items, "stat");
  const callouts = inSection(items, "callout");
  const routine = inSection(items, "routine");
  const meals = inSection(items, "meal");
  const supplements = inSection(items, "supplement");
  const supplementNotes = inSection(items, "supplement_note");
  const targetNotes = inSection(items, "food_note").filter((item) => item.grp === "targets");

  if (isLoading) return <Skeleton className="h-96 rounded-3xl" />;

  if (!plan) {
    return (
      <>
        <PageHeader title="Plan" />
        <ErrorNote error={error} />
        <Card>
          <Empty
            title="No plan yet"
            hint="Write down your goal, dates and target weight. Your workouts, meals and daily checklist then line up behind it."
            action={<Button onClick={() => setFormOpen(true)}>Set up your plan</Button>}
          />
        </Card>
        {formOpen && <PlanForm onClose={() => setFormOpen(false)} />}
      </>
    );
  }

  return (
    <EditingContext.Provider value={editing}>
      <PageHeader
        title="Plan"
        action={
          <>
            {editing && (
              <Button variant="soft" onClick={() => setFormOpen(true)}>
                Plan details
              </Button>
            )}
            <Button variant={editing ? "primary" : "soft"} onClick={() => setEditing((value) => !value)}>
              {editing ? <Check size={15} aria-hidden /> : <Pencil size={14} aria-hidden />}
              {editing ? "Done editing" : "Edit plan"}
            </Button>
          </>
        }
      />
      <ErrorNote error={error} />

      <PlanHero plan={plan} />

      {(stats.length > 0 || editing) && (
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.id} className="bg-surface p-5">
              <div className="flex items-start justify-between gap-1">
                <p className="figure text-[30px] leading-tight">{item.value}</p>
                <ItemActions item={item} />
              </div>
              <p className="mt-1 text-[13px] leading-snug text-ink-2">{item.label}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3">
        <AddItem section="stat" items={stats} label="Add number" />
      </div>

      {(callouts.length > 0 || editing) && (
        <div className="mt-1 grid gap-3 md:grid-cols-2">
          {callouts.map((item) => (
            <Callout key={item.id} tone={item.grp === "warn" ? "warn" : "good"} title={item.label}>
              <span className="flex items-start gap-2">
                <span className="flex-1">{item.detail}</span>
                <ItemActions item={item} />
              </span>
            </Callout>
          ))}
        </div>
      )}
      <div className="mt-3">
        <AddItem section="callout" items={callouts} label="Add note" />
      </div>

      {(routine.length > 0 || editing) && (
        <>
          <SectionTitle>Your workday</SectionTitle>
          <Workday items={routine} active={plan.active_routine} planId={plan.id} />
        </>
      )}

      {(meals.length > 0 || editing) && (
        <>
          <SectionTitle action={<AddItem section="meal" items={meals} label="Add meal" />}>
            {target ? `${number(target.calories)} kcal a day` : "Daily meals"}
          </SectionTitle>
          <Card>
            {target && <MacroBar protein={Number(target.protein)} carbs={Number(target.carbs)} fat={Number(target.fat)} />}
            {targetNotes.map((item) => (
              <p key={item.id} className="mt-3 flex max-w-[70ch] items-start gap-2 text-sm leading-relaxed text-pretty text-ink-2">
                <span className="flex-1">{item.label}</span>
                <ItemActions item={item} />
              </p>
            ))}
            <div className="mt-4 mb-1 flex justify-between text-[13px] text-ink-2">
              <span>Meal</span>
              <span>kcal · protein</span>
            </div>
            <ul className="divide-y divide-line">
              {meals.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.detail && <p className="mt-0.5 text-[13px] leading-relaxed text-pretty text-ink-2">{item.detail}</p>}
                  </div>
                  <span className="tabular shrink-0 text-sm whitespace-nowrap">{item.value}</span>
                  <ItemActions item={item} />
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {(supplements.length > 0 || editing) && (
        <>
          <SectionTitle action={<AddItem section="supplement" items={supplements} label="Add supplement" />}>Supplements</SectionTitle>
          <Card>
            <ul className="divide-y divide-line">
              {supplements.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.detail && <p className="mt-0.5 text-[13px] leading-relaxed text-pretty text-ink-2">{item.detail}</p>}
                  </div>
                  <span className="tabular shrink-0 text-sm whitespace-nowrap">{item.value}</span>
                  <ItemActions item={item} />
                </li>
              ))}
            </ul>
            {supplementNotes.map((item) => (
              <div key={item.id} className="mt-4">
                <Callout tone="warn">
                  <span className="flex items-start gap-2">
                    <span className="flex-1">{item.label}</span>
                    <ItemActions item={item} />
                  </span>
                </Callout>
              </div>
            ))}
          </Card>
        </>
      )}

      <SectionTitle>Checkpoints</SectionTitle>
      <CheckpointList />

      {formOpen && <PlanForm plan={plan} onClose={() => setFormOpen(false)} />}
    </EditingContext.Provider>
  );
}
