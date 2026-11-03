"use client";

import { useRows } from "@/lib/data";
import { daysBetween, parseDay, today, toDay } from "@/lib/format";

export interface HealthPlan {
  id: string;
  title: string;
  goal: string | null;
  starts_on: string;
  ends_on: string;
  start_weight_kg: number | null;
  target_weight_kg: number | null;
  ease_in_weeks: number;
  ease_in_sets: number;
  active_routine: string | null;
}

export type ItemSection =
  | "stat"
  | "callout"
  | "routine"
  | "meal"
  | "lift_rule"
  | "eating_rule"
  | "food_note"
  | "supplement"
  | "supplement_note"
  | "activity"
  | "checklist"
  | "review";

export interface PlanItem {
  id: string;
  section: ItemSection;
  grp: string | null;
  position: number;
  label: string;
  detail: string | null;
  value: string | null;
}

export interface Checkpoint {
  id: string;
  due_on: string;
  label: string;
  weight_kg: number | null;
  note: string | null;
}

export type DayKind = "lift" | "cardio" | "rest";

export interface WorkoutDay {
  id: string;
  weekday: number;
  title: string;
  summary: string | null;
  kind: DayKind;
}

export interface Exercise {
  id: string;
  day_id: string;
  position: number;
  name: string;
  target: string;
  sets: number;
  measure: "reps" | "time";
}

export interface WorkoutSession {
  id: string;
  logged_on: string;
  day_id: string | null;
  title: string;
  kind: DayKind | "game";
  minutes: number | null;
  kcal: number | null;
  completed_at: string | null;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string | null;
  exercise_name: string;
  set_no: number;
  weight_kg: number | null;
  reps: number | null;
}

export interface WeightLog {
  id: string;
  logged_on: string;
  weight_kg: number;
}

export interface Measurement {
  id: string;
  logged_on: string;
  waist_cm: number | null;
  body_fat_pct: number | null;
  muscle_kg: number | null;
  trunk_fat_kg: number | null;
  waist_hip_ratio: number | null;
  note: string | null;
}

export function usePlan() {
  const query = useRows<HealthPlan>("health_plans", { limit: 1 });
  return { ...query, plan: query.data?.[0] ?? null };
}

export const usePlanItems = () =>
  useRows<PlanItem>("health_plan_items", { order: [["section"], ["position"]] });

export const useCheckpoints = () => useRows<Checkpoint>("health_checkpoints", { order: [["due_on"]] });

export const useWorkoutDays = () => useRows<WorkoutDay>("workout_days", { order: [["weekday"]] });

export const useExercises = () => useRows<Exercise>("workout_exercises", { order: [["position"]] });

export const useWeights = () => useRows<WeightLog>("weight_logs", { order: [["logged_on"]], limit: 730 });

export const inSection = (items: PlanItem[], section: ItemSection) => items.filter((item) => item.section === section);

export function planProgress(plan: HealthPlan, day: string = today()) {
  const total = daysBetween(plan.starts_on, plan.ends_on) + 1;
  const dayNumber = daysBetween(plan.starts_on, day) + 1;
  const started = dayNumber >= 1;
  const finished = dayNumber > total;
  const week = started ? Math.ceil(Math.min(dayNumber, total) / 7) : 0;
  return { total, dayNumber, started, finished, week, weeks: Math.ceil(total / 7) };
}

export function planTag(plan: HealthPlan, day: string = today()) {
  const { total, dayNumber, started, finished, week } = planProgress(plan, day);
  if (!started) return `Starts ${parseDay(plan.starts_on).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`;
  if (finished) return "Plan complete";
  return `Day ${dayNumber} of ${total} · Week ${week}`;
}

// During the first weeks of a plan, lifting days ask for fewer sets while the movements are learned.
export function easingIn(plan: HealthPlan | null, day: string = today()) {
  if (!plan || plan.ease_in_weeks < 1) return false;
  const { started, week } = planProgress(plan, day);
  return started && week <= plan.ease_in_weeks;
}

export const setsFor = (exercise: Pick<Exercise, "sets">, eased: boolean, sets: number) =>
  eased ? Math.min(exercise.sets, sets) : exercise.sets;

// Monday first, as the gym week reads.
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const weekdayOf = (day: string) => parseDay(day).getDay();

export function mondayOf(day: string) {
  const date = parseDay(day);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toDay(date);
}

// The date of a weekday in the same Monday-to-Sunday week as the given day.
export function dateInWeek(day: string, weekday: number) {
  const date = parseDay(mondayOf(day));
  date.setDate(date.getDate() + (weekday + 6) % 7);
  return toDay(date);
}

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

export interface WeekAverage {
  monday: string;
  average: number;
  count: number;
}

export function weeklyAverages(logs: Pick<WeightLog, "logged_on" | "weight_kg">[]): WeekAverage[] {
  const weeks = new Map<string, number[]>();
  for (const log of logs) {
    const monday = mondayOf(log.logged_on);
    weeks.set(monday, [...(weeks.get(monday) ?? []), Number(log.weight_kg)]);
  }
  return [...weeks.entries()]
    .map(([monday, values]) => ({ monday, average: average(values), count: values.length }))
    .sort((a, b) => a.monday.localeCompare(b.monday));
}

export type Verdict = { tone: "good" | "warn"; text: string };

// The Monday review: last full week's average against the week before.
export function mondayVerdict(weeks: WeekAverage[], day: string = today()): { drop: number; verdict: Verdict; last: WeekAverage; previous: WeekAverage } | null {
  const complete = weeks.filter((week) => week.monday < mondayOf(day));
  const last = complete.at(-1);
  const previous = complete.at(-2);
  if (!last || !previous) return null;
  const drop = previous.average - last.average;
  const earlier = complete.at(-3);
  const stalledTwice = drop < 0.4 && Boolean(earlier && earlier.average - previous.average < 0.4);
  if (drop >= 0.4 && drop <= 0.8) return { drop, last, previous, verdict: { tone: "good", text: "On pace. Keep going." } };
  if (drop > 1) return { drop, last, previous, verdict: { tone: "warn", text: "Dropping fast. If your lifts are falling, eat 150 kcal more." } };
  if (drop > 0.8) return { drop, last, previous, verdict: { tone: "good", text: "A little ahead of pace. Keep going." } };
  if (stalledTwice) return { drop, last, previous, verdict: { tone: "warn", text: "Under pace two weeks running. Cut 150 kcal or add 2,000 steps." } };
  return { drop, last, previous, verdict: { tone: "warn", text: "Under pace this week. Hold the plan and check again next Monday." } };
}

// Ranges such as "300–350" become their midpoint, scaled to the minutes played.
export function kcalFromRange(range: string | null | undefined, minutes: number) {
  const numbers = (range ?? "").match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length === 0) return null;
  return Math.round((average(numbers) * minutes) / 60);
}
