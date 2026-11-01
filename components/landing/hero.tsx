"use client";

import { useState } from "react";
import { LinkButton } from "@/components/ui/button";
import { Donut, MoodLine } from "./charts";

const TABS = ["Finance", "Home", "Planner", "Diet", "Diary"] as const;
type Tab = (typeof TABS)[number];

export const MOOD_WEEK = "M1 24 C 6 18, 10 14, 16 14 S 30 20, 38 20 S 60 2, 77 2 S 98 24, 114 24 S 136 11, 147 9";

function Tile({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface p-4 ${className}`}>{children}</div>;
}

function NetWorthTile() {
  return (
    <Tile>
      <p className="text-xs text-ink-2">Net worth</p>
      <p className="figure mt-1 text-[30px] leading-tight">₹4,86,320</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="flex h-[22px] items-center rounded-full bg-finance-soft px-2 font-mono text-[11px] text-good">Axis •••• 4092</span>
        <span className="flex h-[22px] items-center rounded-full bg-finance-soft px-2 font-mono text-[11px] text-good">GPay</span>
      </div>
      <p className="mt-2.5 text-[11px] text-ink-2">Manual-first · No CVVs or bank logins</p>
    </Tile>
  );
}

function TodayTile() {
  return (
    <Tile>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-2">Today</span>
        <span className="text-[#60a5fa]">14-day streak</span>
      </div>
      <ul className="mt-1.5 space-y-[3px] text-[13px]">
        <li>Ship gate screen</li>
        <li>Review budget</li>
        <li className="text-ink-2">Call landlord</li>
      </ul>
      <span className="mt-2.5 inline-block rounded-full bg-diet-soft px-2.5 py-0.5 text-[11px] text-warn">
        Carried over from yesterday
      </span>
    </Tile>
  );
}

function NutritionTile() {
  return (
    <Tile>
      <div className="flex items-center gap-3">
        <Donut
          size={52}
          thickness={9}
          segments={[
            { value: 30, color: "#f59e0b" },
            { value: 35, color: "#fcd34d" },
            { value: 35, color: "#b45309" },
          ]}
        />
        <div className="leading-tight">
          <p className="text-[13px]">
            <span className="font-semibold">1,420</span> / 2,000 kcal
          </p>
          <p className="text-[11px] text-ink-2">P 30 · C 35 · F 35</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line-2">
        <div className="h-full w-[71%] rounded-full bg-diet" />
      </div>
      <p className="mt-3 inline-block rounded-lg bg-diet-soft px-3 py-3.5 text-xs leading-4 text-warn">+250ml · 750ml today</p>
    </Tile>
  );
}

function MoodTile() {
  return (
    <Tile>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-2">Mood, 7 days</span>
        <span className="flex items-center gap-1.5 text-ink-2">
          <span className="size-1.5 rounded-full bg-[#a78bfa]" />
          Saved
        </span>
      </div>
      <MoodLine path={MOOD_WEEK} width={148} height={26} color="#a78bfa" className="mx-auto mt-2 h-7 w-[134px]" />
      <p className="display mt-[19px] text-sm italic leading-snug">
        “Walked home slowly. The rain made the street quiet…”
      </p>
    </Tile>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0">
      <span className="text-ink-2">{label}</span>
      <span className={`tabular ${tone ?? ""}`}>{value}</span>
    </div>
  );
}

function FinancePreview() {
  return (
    <>
      <NetWorthTile />
      <Tile>
        <p className="text-[13px] text-ink-2">Safe to spend today</p>
        <p className="figure mt-1 text-[32px] leading-tight">₹1,240</p>
        <p className="mt-1 text-xs text-ink-2">Comfortable · 11 days to salary</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line-2">
          <div className="h-full w-[62%] rounded-full bg-finance" />
        </div>
      </Tile>
      <Tile className="sm:col-span-2">
        <Row label="Rapido · HDFC" value="−₹200" />
        <Row label="Groceries · Paytm" value="−₹450" />
        <Row label="Salary · HDFC" value="+₹82,000" tone="text-good" />
      </Tile>
    </>
  );
}

function PlannerPreview() {
  return (
    <>
      <TodayTile />
      <Tile>
        <p className="text-[13px] text-ink-2">Done this week</p>
        <p className="figure mt-1 text-[32px] leading-tight">86%</p>
        <p className="mt-1 text-xs text-ink-2">24 of 28 finished, 21 on time</p>
      </Tile>
      <Tile className="sm:col-span-2">
        <Row label="Tax docs" value="1d overdue" tone="text-bad" />
        <Row label="Rent" value="in 2d" />
        <Row label="Resume" value="in 5d" />
      </Tile>
    </>
  );
}

function DietPreview() {
  return (
    <>
      <NutritionTile />
      <Tile>
        <p className="text-[13px] text-ink-2">Water</p>
        <p className="figure mt-1 text-[32px] leading-tight">750 ml</p>
        <p className="mt-1 text-xs text-ink-2">of 2,500 ml goal</p>
      </Tile>
      <Tile className="sm:col-span-2">
        <Row label="Breakfast · Poha" value="320 kcal" />
        <Row label="Lunch · Dal + rice" value="610 kcal" />
        <Row label="Snack · Whey shake" value="150 kcal" />
      </Tile>
    </>
  );
}

function DiaryPreview() {
  return (
    <>
      <MoodTile />
      <Tile>
        <p className="text-[13px] text-ink-2">Writing streak</p>
        <p className="figure mt-1 text-[32px] leading-tight">9 days</p>
        <p className="mt-1 text-xs text-ink-2">Longest so far: 23</p>
      </Tile>
      <Tile className="sm:col-span-2">
        <p className="display text-base italic">Prompt of the day</p>
        <p className="display mt-1 text-lg leading-snug">What did you notice today that you almost missed?</p>
      </Tile>
    </>
  );
}

function CombinedPreview() {
  return (
    <>
      <NetWorthTile />
      <TodayTile />
      <NutritionTile />
      <MoodTile />
    </>
  );
}

const PREVIEWS: Record<Tab, () => React.ReactElement> = {
  Finance: FinancePreview,
  Home: CombinedPreview,
  Planner: PlannerPreview,
  Diet: DietPreview,
  Diary: DiaryPreview,
};

function ProductPreview() {
  const [tab, setTab] = useState<Tab>("Finance");
  const Preview = PREVIEWS[tab];

  return (
    // Always dark, whichever theme the page is in: the panel is a window into the app.
    <div
      data-theme="dark"
      className="rise rounded-[28px] border border-line bg-[#0d0f12] p-4 text-ink"
      style={{ "--delay": "160ms" } as React.CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <div role="tablist" aria-label="Preview a module" className="no-scrollbar flex gap-1 overflow-x-auto">
          {TABS.map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={`pressable h-11 cursor-pointer rounded-xl px-2.5 text-xs whitespace-nowrap ${
                tab === name ? "bg-[#272b33] text-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div key={tab} className="fade-in mt-3 grid gap-3 sm:grid-cols-2">
        <Preview />
      </div>
    </div>
  );
}

export function Hero() {
  const { freeze } = useFreeze();

  return (
    <section className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] items-center gap-12 px-6 pt-8 pb-20 md:px-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] xl:grid-cols-[minmax(0,1fr)_776px] lg:gap-16 lg:pt-12 lg:pb-36">
      <div>
        <p className="eyebrow rise">Serein · Personal life ledger</p>
        <h1
          className="display rise mt-6 max-w-[31rem] text-[clamp(2.75rem,5vw,4.5rem)] leading-[1.02]"
          style={{ "--delay": "60ms" } as React.CSSProperties}
        >
          Your money, body, time, and mind—<em>behind frosted glass.</em>
        </h1>
        <p
          className="rise mt-[29px] max-w-[30rem] text-lg leading-[29px] text-ink-2"
          style={{ "--delay": "120ms" } as React.CSSProperties}
        >
          Four deeply focused modules and one customizable home. No bank-sync middlemen, no bloated AI noise, and a
          rotating security gate that roasts trespassers.
        </p>
        <div
          className="rise mt-[34px] flex flex-wrap gap-3"
          style={{ "--delay": "180ms" } as React.CSSProperties}
        >
          <LinkButton href="/login" size="lg" className="!px-7">
            Enter the Gate
          </LinkButton>
          <Button variant="outline" size="lg" onClick={freeze}>
            Trigger Freeze Demo (Press F)
          </Button>
        </div>
        <p
          className="display rise mt-8 max-w-[24rem] text-base leading-5 text-ink-2 italic"
          style={{ "--delay": "240ms" } as React.CSSProperties}
        >
          — Typed balances never break. Bank syncs do, quietly, on the day you need them.
        </p>
      </div>

      <ProductPreview />
    </section>
  );
}
