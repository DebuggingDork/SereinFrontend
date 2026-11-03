"use client";

import { Check, Pencil, Plus, Trophy } from "lucide-react";
import { useState } from "react";
import { ExerciseLogger } from "@/components/health/exercise-logger";
import {
  dateInWeek,
  easingIn,
  inSection,
  planTag,
  setsFor,
  usePlan,
  usePlanItems,
  useExercises,
  useWorkoutDays,
  WEEK_ORDER,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  weekdayOf,
  type DayKind,
  type Exercise,
} from "@/components/health/plan-data";
import { AddItem, EditingContext, ItemActions, RuleList, SectionTitle } from "@/components/health/plan-items";
import { DayForm, ExerciseForm, GameForm } from "@/components/health/workout-forms";
import { lastTimeBefore, useSessions, useSetHistory, useWorkoutActions } from "@/components/health/workout-log";
import { Button } from "@/components/ui/button";
import { Card, Chip, Empty, ErrorNote, PageHeader, Skeleton } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove } from "@/lib/data";
import { formatDay, formatDayLong, number, today } from "@/lib/format";

const KIND_DOT: Record<DayKind, string> = {
  lift: "bg-health",
  cardio: "bg-planner",
  rest: "bg-line-2",
};
const KIND_LABEL: Record<DayKind, string> = { lift: "Lifting", cardio: "Cardio", rest: "Rest" };

export default function WorkoutsPage() {
  const now = today();
  const { plan } = usePlan();
  const { data: days = [], isLoading, error } = useWorkoutDays();
  const { data: exercises = [] } = useExercises();
  const { data: items = [] } = usePlanItems();
  const { data: sessions = [] } = useSessions();
  const { data: history = [] } = useSetHistory();
  const [weekday, setWeekday] = useState(() => weekdayOf(now));
  const [editing, setEditing] = useState(false);
  const [dayForm, setDayForm] = useState(false);
  const [exerciseForm, setExerciseForm] = useState<{ exercise?: Exercise } | null>(null);
  const [gameForm, setGameForm] = useState(false);
  const removeDay = useRemove("workout_days", { alsoInvalidate: ["workout_exercises"] });
  const removeExercise = useRemove("workout_exercises");

  const date = dateInWeek(now, weekday);
  const template = days.find((day) => day.weekday === weekday);
  const session = sessions.find((row) => row.logged_on === date);
  const dayExercises = exercises.filter((exercise) => exercise.day_id === template?.id);
  const actions = useWorkoutActions(date, template, session);
  const loggedSets = session ? history.filter((set) => set.session_id === session.id) : [];
  const future = date > now;
  const done = Boolean(session?.completed_at);
  const eased = template?.kind === "lift" && easingIn(plan, date);
  const easedSets = plan?.ease_in_sets ?? 2;
  const activities = inSection(items, "activity");
  const liftRules = inSection(items, "lift_rule");
  const activityNotes = activities.filter((item) => item.grp === "note");
  const games = activities.filter((item) => item.grp !== "note");
  const compare = games.filter((item) => item.grp === "compare");
  const playable = games.filter((item) => item.grp !== "compare");
  const recent = sessions.filter((row) => row.completed_at).slice(0, 8);

  const planned = dayExercises.reduce((sum, exercise) => sum + setsFor(exercise, Boolean(eased), easedSets), 0);
  const logged = dayExercises.reduce((sum, exercise) => sum + loggedSets.filter((set) => set.exercise_id === exercise.id).length, 0);

  return (
    <EditingContext.Provider value={editing}>
      <PageHeader
        title="Workouts"
        subtitle={plan ? planTag(plan) : "Your week, and what you lifted."}
        action={
          <Button variant={editing ? "primary" : "soft"} onClick={() => setEditing((value) => !value)}>
            {editing ? <Check size={15} aria-hidden /> : <Pencil size={14} aria-hidden />}
            {editing ? "Done editing" : "Edit week"}
          </Button>
        }
      />
      <ErrorNote error={error} />

      <div role="tablist" aria-label="Day of the week" className="mb-4 grid grid-cols-7 gap-1 sm:gap-1.5">
        {WEEK_ORDER.map((value) => {
          const day = days.find((row) => row.weekday === value);
          const selected = value === weekday;
          const dayDate = dateInWeek(now, value);
          const completed = sessions.some((row) => row.logged_on === dayDate && row.completed_at);
          const isToday = dayDate === now;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={`${WEEKDAY_LONG[value]}${day ? `, ${day.title}` : ""}${completed ? ", done" : ""}`}
              onClick={() => setWeekday(value)}
              className={`pressable flex h-[60px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border text-[13px] ${
                selected
                  ? "border-transparent bg-inverse text-on-inverse"
                  : `bg-surface hover:border-line-2 ${isToday ? "border-ink-3" : "border-line"}`
              }`}
            >
              {WEEKDAY_SHORT[value]}
              {completed ? (
                <Check size={12} strokeWidth={3} aria-hidden className={selected ? "" : "text-good"} />
              ) : (
                <span aria-hidden className={`size-1.5 rounded-full ${day ? KIND_DOT[day.kind] : "bg-transparent"}`} />
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            {!template ? (
              <Empty
                title={`Nothing on ${WEEKDAY_LONG[weekday]}`}
                hint="Set up this day to log it here."
                action={
                  <Button variant="soft" size="sm" onClick={() => setDayForm(true)}>
                    <Plus size={13} aria-hidden /> Set up {WEEKDAY_LONG[weekday]}
                  </Button>
                }
              />
            ) : (
              <>
                <header className="mb-1 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                  <div className="min-w-0">
                    <p className="text-[13px] text-ink-2">
                      {date === now ? "Today" : formatDayLong(date)} · {KIND_LABEL[template.kind]}
                    </p>
                    <h2 className="display mt-0.5 text-[30px] leading-tight text-balance">{template.title}</h2>
                  </div>
                  {editing ? (
                    <RowActions
                      onEdit={() => setDayForm(true)}
                      onDelete={() => removeDay.mutate(template.id)}
                      deleteTitle={`Delete ${template.title}?`}
                      deleteBody="Its exercises go too. Sets you already logged stay in your history."
                    />
                  ) : (
                    done && <Chip tone="good">{session?.kind === "game" ? "Played" : "Done"}</Chip>
                  )}
                </header>
                {template.summary && <p className="max-w-[60ch] text-sm leading-relaxed text-pretty text-ink-2">{template.summary}</p>}
                {eased && !done && (
                  <div className="mt-3">
                    <Chip tone="health">Ease in: {easedSets} sets each</Chip>
                  </div>
                )}

                {session?.kind === "game" ? (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-2 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Trophy size={18} aria-hidden className="shrink-0 text-warn" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{session.title}</p>
                        <p className="tabular text-[13px] text-ink-2">
                          {session.minutes} min{session.kcal ? ` · about ${number(session.kcal)} kcal` : ""}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => actions.clearSession.mutate()}>
                      Undo
                    </Button>
                  </div>
                ) : (
                  <ul className="mt-5 divide-y divide-line">
                    {dayExercises.map((exercise) => (
                      <ExerciseLogger
                        key={exercise.id}
                        exercise={exercise}
                        sets={setsFor(exercise, Boolean(eased), easedSets)}
                        logged={loggedSets.filter((set) => set.exercise_name === exercise.name)}
                        history={lastTimeBefore(history, exercise.name, date)}
                        readOnly={future || editing || done}
                        actions={
                          editing ? (
                            <RowActions
                              onEdit={() => setExerciseForm({ exercise })}
                              onDelete={() => removeExercise.mutate(exercise.id)}
                              deleteTitle={`Remove ${exercise.name}?`}
                              deleteBody="Sets you already logged stay in your history."
                            />
                          ) : undefined
                        }
                        onLog={(input) => actions.logSet.mutate(input)}
                        onUnlog={(id) => actions.unlogSet.mutate(id)}
                      />
                    ))}
                  </ul>
                )}

                {editing && (
                  <div className="mt-4">
                    <Button variant="soft" size="sm" onClick={() => setExerciseForm({})}>
                      <Plus size={13} aria-hidden /> Add exercise
                    </Button>
                  </div>
                )}

                {!editing && session?.kind !== "game" && (
                  <footer className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    {future ? (
                      <p className="text-sm text-ink-2">Coming up on {formatDay(date, { weekday: "long" })}.</p>
                    ) : done ? (
                      <Button variant="ghost" onClick={() => actions.reopen.mutate()}>
                        Reopen session
                      </Button>
                    ) : (
                      <>
                        <Button onClick={() => actions.finish.mutate()} disabled={actions.finish.isPending}>
                          <Check size={15} aria-hidden /> Finish session
                        </Button>
                        {planned > 0 && (
                          <span className="tabular text-[13px] text-ink-2">
                            {logged} of {planned} ticked
                          </span>
                        )}
                        {template.kind !== "lift" && playable.length > 0 && (
                          <Button variant="soft" className="sm:ml-auto" onClick={() => setGameForm(true)}>
                            <Trophy size={14} aria-hidden /> Played a game instead
                          </Button>
                        )}
                      </>
                    )}
                  </footer>
                )}
              </>
            )}
          </section>

          <aside className="space-y-4">
            {(liftRules.length > 0 || editing) && (
              <Card title="How to lift" action={<AddItem section="lift_rule" items={liftRules} />}>
                <RuleList items={liftRules} />
              </Card>
            )}
            {recent.length > 0 && (
              <Card title="Recent sessions">
                <ul className="divide-y divide-line">
                  {recent.map((row) => {
                    const count = history.filter((set) => set.session_id === row.id).length;
                    return (
                      <li key={row.id} className="flex items-center gap-3 py-2 text-sm">
                        <span className="tabular w-14 shrink-0 text-ink-2">{formatDay(row.logged_on)}</span>
                        <span className="min-w-0 flex-1 truncate">{row.title}</span>
                        <span className="tabular shrink-0 text-[13px] text-ink-3">
                          {row.kind === "game" ? `${row.minutes} min` : count > 0 ? `${count} sets` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </aside>
        </div>
      )}

      {(activities.length > 0 || editing) && (
        <>
          <SectionTitle action={<AddItem section="activity" items={activities} label="Add activity" />}>Games and sports</SectionTitle>
          <Card>
            <div className="mb-2 flex justify-between text-[13px] text-ink-2">
              <span>Activity, 1 hour</span>
              <span>kcal</span>
            </div>
            <ul className="divide-y divide-line">
              {[...playable, ...compare].map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className={`min-w-0 flex-1 ${item.grp === "compare" ? "text-ink-2" : ""}`}>{item.label}</span>
                  <span className="tabular shrink-0">{item.value}</span>
                  <ItemActions item={item} />
                </li>
              ))}
            </ul>
            {activityNotes.map((item) => (
              <p key={item.id} className="mt-3 flex max-w-[70ch] items-start gap-2 text-sm leading-relaxed text-pretty text-ink-2">
                <span className="flex-1">{item.label}</span>
                <ItemActions item={item} />
              </p>
            ))}
          </Card>
        </>
      )}

      {dayForm && <DayForm weekday={weekday} day={template} onClose={() => setDayForm(false)} />}
      {exerciseForm && template && (
        <ExerciseForm
          dayId={template.id}
          exercise={exerciseForm.exercise}
          nextPosition={dayExercises.reduce((max, exercise) => Math.max(max, exercise.position), -1) + 1}
          onClose={() => setExerciseForm(null)}
        />
      )}
      {gameForm && (
        <GameForm
          activities={playable}
          note={activityNotes.at(-1)?.label}
          onSubmit={(input) => actions.logGame.mutateAsync(input)}
          onClose={() => setGameForm(false)}
        />
      )}
    </EditingContext.Provider>
  );
}
