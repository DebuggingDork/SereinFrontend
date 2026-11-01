"use client";

import { useState } from "react";
import { inr } from "@/lib/format";
import { Donut, HeatStrip, MoodLine, WeekBars } from "./charts";

function PillarCard({
  name,
  color,
  className = "",
  children,
}: {
  name: string;
  color: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`rounded-3xl border border-line bg-surface p-7 ${className}`}>
      <h3 className="display flex items-center gap-2.5 text-[28px] leading-[1.2]">
        <span className="size-2.5 rounded-full" style={{ background: color }} />
        {name}
      </h3>
      <div className="mt-[21px]">{children}</div>
    </article>
  );
}

function Ledger({ label, paid, total, tone }: { label: string; paid: number; total: number; tone: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm leading-5">
        <span>{label}</span>
        <span className="tabular">
          {inr(paid)} / {inr(total)}
        </span>
      </div>
      <div className="mt-[5px] h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full" style={{ width: `${(paid / total) * 100}%`, background: tone }} />
      </div>
    </div>
  );
}

function FinancePillar() {
  return (
    <PillarCard name="Finance" color="var(--finance)" className="md:col-span-12">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
        <Donut
          size={120}
          thickness={22}
          segments={[
            { value: 37, color: "#10b981" },
            { value: 25, color: "#3b82f6" },
            { value: 18, color: "#f59e0b" },
            { value: 20, color: "#8b5cf6" },
          ]}
        >
          <span className="tabular text-[13px]">₹38,200</span>
        </Donut>
        <div className="flex-1">
          <p className="mb-[5px] text-sm leading-5 text-ink-2">Budgets</p>
          <Ledger label="Food" paid={6200} total={9000} tone="#10b981" />
          <div className="h-[10px]" />
          <Ledger label="Transport" paid={1400} total={3500} tone="#059669" />
        </div>
        <div className="flex-1">
          <p className="mb-[5px] text-sm leading-5 text-ink-2">Debts and credits</p>
          <Ledger label="Ravi owes you" paid={3000} total={5000} tone="#10b981" />
          <div className="h-[10px]" />
          <Ledger label="You owe Asha" paid={800} total={2000} tone="#059669" />
        </div>
      </div>
    </PillarCard>
  );
}

const FOODS = ["Poha", "Curd bowl", "Dal + rice", "Whey shake"];

function DietPillar() {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (food: string) =>
    setPicked((current) => (current.includes(food) ? current.filter((f) => f !== food) : [...current, food]));

  return (
    <PillarCard name="Diet" color="var(--diet)" className="md:col-span-4">
      <p className="-mt-0.5 mb-1 text-[13px] text-ink-2">Meal timing</p>
      <HeatStrip />
      <div className="mt-5 flex items-center gap-4">
        <Donut
          size={64}
          thickness={32}
          segments={[
            { value: 30, color: "#d97706" },
            { value: 35, color: "#f59e0b" },
            { value: 35, color: "#fcd34d" },
          ]}
        />
        <p className="text-[13px]">Protein 30% · Carbs 35% · Fat 35%</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {FOODS.map((food) => (
          <button
            key={food}
            type="button"
            aria-pressed={picked.includes(food)}
            onClick={() => toggle(food)}
            className={`pressable h-[29px] cursor-pointer rounded-full border px-[13px] text-[13px] ${
              picked.includes(food) ? "border-transparent bg-diet-soft text-warn" : "border-line hover:border-line-2"
            }`}
          >
            {food}
          </button>
        ))}
      </div>
    </PillarCard>
  );
}

function PlannerPillar() {
  return (
    <PillarCard name="Planner" color="var(--planner)" className="md:col-span-4">
      <p className="-mt-px mb-[5px] text-[13px] text-ink-2">On time vs late, by week</p>
      <WeekBars />
      <div className="mt-5 flex flex-wrap gap-2 text-[13px]">
        <span className="rounded-full bg-bad-soft px-3 py-1 text-bad">Tax docs · overdue 1d</span>
        <span className="rounded-full bg-planner-soft px-3 py-1 text-planner">Rent · 2d</span>
        <span className="rounded-full bg-planner-soft px-3 py-1 text-planner">Resume · 5d</span>
      </div>
    </PillarCard>
  );
}

const MOODS = {
  Settled: "M2 32 C 8 26, 14 25, 20 25 S 34 30, 44 29 S 66 10, 85 10 S 120 38, 146 38 S 186 6, 212 6 S 252 36, 281 36 S 322 5, 340 5 S 352 12, 358 19",
  Restless: "M2 20 C 18 2, 30 38, 52 16 S 84 38, 110 12 S 146 40, 170 14 S 212 38, 240 12 S 284 38, 310 14 S 348 30, 358 10",
  Bright: "M2 32 C 40 28, 60 20, 96 18 S 150 10, 190 10 S 250 12, 290 6 S 340 8, 358 2",
  Tired: "M2 8 C 40 10, 70 14, 110 20 S 170 22, 210 28 S 270 26, 300 32 S 340 34, 358 34",
} as const;
type Mood = keyof typeof MOODS;

function DiaryPillar() {
  const [mood, setMood] = useState<Mood>("Settled");

  return (
    <PillarCard name="Diary" color="var(--diary)" className="md:col-span-4">
      <p className="display -mt-0.5 text-xl italic">Prompt of the day</p>
      <p className="display mt-0.5 max-w-md text-2xl leading-[31px]">What did you notice today that you almost missed?</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {(Object.keys(MOODS) as Mood[]).map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={mood === name}
            onClick={() => setMood(name)}
            className={`pressable h-11 cursor-pointer rounded-full border px-5 text-sm ${
              mood === name ? "border-transparent bg-inverse text-on-inverse" : "border-line hover:border-line-2"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      <p className="mt-5 text-[13px] text-ink-2">Mood, last 30 days</p>
      <MoodLine key={mood} path={MOODS[mood]} className="mx-auto h-10 w-full max-w-[360px]" animate />
    </PillarCard>
  );
}

export function Pillars() {
  return (
    <section id="modules" className="mx-auto max-w-[1440px] px-6 pb-24 md:px-16 lg:pb-[143px]">
      <h2 className="display text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.0625]">
        All your money, <em>in one place.</em>
      </h2>
      <p className="display mt-[14px] text-base text-ink-2 italic">
        Spending, budgets, debts, goals and net worth. Planner, diet and diary are there when you want them.
      </p>
      <div className="mt-[39px] grid gap-4 md:grid-cols-12">
        <FinancePillar />
        <PlannerPillar />
        <DietPillar />
        <DiaryPillar />
      </div>
    </section>
  );
}
