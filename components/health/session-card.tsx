"use client";

import { Check, Moon } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Card, Chip, Empty, Skeleton } from "@/components/ui/primitives";
import { number, today } from "@/lib/format";
import { easingIn, setsFor, useExercises, usePlan, useWorkoutDays, weekdayOf } from "./plan-data";
import { useSessions, useSetHistory } from "./workout-log";

// Today's session on the Health front page, with how much of it is done.
export function SessionCard() {
  const now = today();
  const { plan } = usePlan();
  const { data: days, isLoading } = useWorkoutDays();
  const { data: exercises = [] } = useExercises();
  const { data: sessions = [] } = useSessions(7);
  const { data: history = [] } = useSetHistory(200);

  if (isLoading) return <Skeleton className="h-72 rounded-3xl" />;

  const day = days?.find((row) => row.weekday === weekdayOf(now));
  const session = sessions.find((row) => row.logged_on === now);

  if (!day) {
    return (
      <Card title="Today's session">
        <Empty
          compact
          title="Nothing planned today"
          hint={days?.length ? undefined : "Set up your week to see each day's session here."}
          action={
            <LinkButton href="/health/workouts" variant="soft" size="sm">
              Open workouts
            </LinkButton>
          }
        />
      </Card>
    );
  }

  const list = exercises.filter((exercise) => exercise.day_id === day.id);
  const eased = day.kind === "lift" && easingIn(plan, now);
  const easedSets = plan?.ease_in_sets ?? 2;
  const logged = session ? history.filter((set) => set.session_id === session.id) : [];
  const done = Boolean(session?.completed_at);

  return (
    <Card
      title="Today's session"
      action={done ? <Chip tone="good">{session?.kind === "game" ? "Played" : "Done"}</Chip> : eased ? <Chip tone="health">{easedSets} sets each</Chip> : undefined}
    >
      <h3 className="display text-[28px] leading-tight text-balance">{session?.kind === "game" ? session.title : day.title}</h3>
      {session?.kind === "game" ? (
        <p className="tabular mt-1 text-sm text-ink-2">
          {session.minutes} min{session.kcal ? ` · about ${number(session.kcal)} kcal` : ""}
        </p>
      ) : (
        day.summary && <p className="mt-1 max-w-[55ch] text-sm leading-relaxed text-pretty text-ink-2">{day.summary}</p>
      )}

      {session?.kind !== "game" && list.length > 0 && (
        <ul className="mt-4 divide-y divide-line">
          {list.map((exercise) => {
            const target = setsFor(exercise, eased, easedSets);
            const count = logged.filter((set) => set.exercise_name === exercise.name).length;
            const complete = count >= target;
            return (
              <li key={exercise.id} className="flex items-center gap-3 py-2 text-sm">
                <span
                  aria-hidden
                  className={`flex size-4 shrink-0 items-center justify-center rounded-full ${complete ? "bg-good text-surface" : "border border-line-2"}`}
                >
                  {complete && <Check size={10} strokeWidth={3.5} />}
                </span>
                <span className="min-w-0 flex-1">{exercise.name}</span>
                <span className="tabular shrink-0 text-[13px] text-ink-2">{exercise.target}</span>
              </li>
            );
          })}
        </ul>
      )}

      {day.kind === "rest" && list.length === 0 && (
        <p className="mt-3 flex items-center gap-2 text-sm text-ink-2">
          <Moon size={14} aria-hidden /> Rest today.
        </p>
      )}

      <div className="mt-5">
        <LinkButton href="/health/workouts" variant={done ? "soft" : "primary"}>
          {done ? "See the session" : logged.length > 0 ? "Continue session" : day.kind === "rest" ? "Open today" : "Start session"}
        </LinkButton>
      </div>
    </Card>
  );
}
