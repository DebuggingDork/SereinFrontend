"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { number } from "@/lib/format";
import type { Exercise, WorkoutSet } from "./plan-data";
import type { HistorySet } from "./workout-log";

const numberInput =
  "tabular h-11 w-full min-w-0 rounded-xl border border-line bg-field px-2 text-center text-[15px] outline-none transition-colors placeholder:text-ink-3 focus:border-ink-3 disabled:opacity-60";

interface LogInput {
  exercise_id: string;
  exercise_name: string;
  set_no: number;
  weight_kg: number | null;
  reps: number | null;
}

function TickButton({ checked, disabled, label, onClick }: { checked: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`pressable flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "border-transparent bg-good text-surface" : "border-line text-ink-3 hover:border-line-2"
      }`}
    >
      <Check size={17} strokeWidth={2.5} aria-hidden />
    </button>
  );
}

function RepsRow({
  exercise,
  setNo,
  logged,
  previous,
  readOnly,
  onLog,
  onUnlog,
}: {
  exercise: Exercise;
  setNo: number;
  logged?: WorkoutSet;
  previous?: HistorySet;
  readOnly: boolean;
  onLog: (input: LogInput) => void;
  onUnlog: (id: string) => void;
}) {
  const [weight, setWeight] = useState(logged?.weight_kg?.toString() ?? "");
  const [reps, setReps] = useState(logged?.reps?.toString() ?? "");
  const name = `${exercise.name} set ${setNo}`;

  const parsedWeight = weight === "" ? (previous?.weight_kg ?? null) : Number(weight);
  const parsedReps = reps === "" ? (previous?.reps ?? null) : Number(reps);
  const invalid =
    (parsedWeight !== null && !(parsedWeight >= 0 && parsedWeight <= 1000)) ||
    (parsedReps !== null && !(Number.isInteger(Number(parsedReps)) && parsedReps >= 0 && parsedReps <= 500));

  // A tick with empty boxes repeats last time's numbers, which is most sets on most days.
  function submit() {
    if (logged) {
      onUnlog(logged.id);
      return;
    }
    if (invalid) return;
    onLog({ exercise_id: exercise.id, exercise_name: exercise.name, set_no: setNo, weight_kg: parsedWeight, reps: parsedReps });
    if (weight === "" && parsedWeight !== null) setWeight(String(parsedWeight));
    if (reps === "" && parsedReps !== null) setReps(String(parsedReps));
  }

  return (
    <li className="grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-2">
      <span className="tabular text-center text-sm text-ink-3">{setNo}</span>
      <input
        aria-label={`${name} weight in kilograms`}
        inputMode="decimal"
        className={numberInput}
        placeholder={previous?.weight_kg != null ? number(previous.weight_kg, 2) : "kg"}
        value={weight}
        disabled={readOnly || Boolean(logged)}
        onChange={(event) => setWeight(event.target.value)}
      />
      <input
        aria-label={`${name} reps`}
        inputMode="numeric"
        className={numberInput}
        placeholder={previous?.reps != null ? String(previous.reps) : "reps"}
        value={reps}
        disabled={readOnly || Boolean(logged)}
        onChange={(event) => setReps(event.target.value)}
      />
      <TickButton checked={Boolean(logged)} disabled={readOnly || invalid} label={`${name} done`} onClick={submit} />
    </li>
  );
}

export function ExerciseLogger({
  exercise,
  sets,
  logged,
  history,
  readOnly,
  actions,
  onLog,
  onUnlog,
}: {
  exercise: Exercise;
  sets: number;
  logged: WorkoutSet[];
  history: HistorySet[];
  readOnly: boolean;
  actions?: React.ReactNode;
  onLog: (input: LogInput) => void;
  onUnlog: (id: string) => void;
}) {
  const best = history[0];
  const doneCount = logged.length;
  const rows = Array.from({ length: sets }, (_, index) => index + 1);

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-balance">{exercise.name}</p>
          <p className="tabular text-[13px] text-ink-2">
            {exercise.target}
            {best && exercise.measure === "reps" && (best.weight_kg != null || best.reps != null) && (
              <span className="text-ink-3">
                {" · "}Last {best.weight_kg != null ? `${number(best.weight_kg, 2)} kg` : "bodyweight"}
                {best.reps != null ? ` × ${best.reps}` : ""}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!readOnly && doneCount > 0 && (
            <span className={`tabular text-[13px] ${doneCount >= sets ? "text-good" : "text-ink-3"}`}>
              {doneCount}/{sets}
            </span>
          )}
          {actions}
        </div>
      </div>

      {!readOnly && exercise.measure === "reps" && (
        <>
          <div aria-hidden className="mt-3 mb-1 grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-2 text-center text-xs text-ink-3">
            <span>Set</span>
            <span>kg</span>
            <span>Reps</span>
            <span />
          </div>
          <ul className="space-y-1.5">
            {rows.map((setNo) => {
              const set = logged.find((row) => row.set_no === setNo);
              return (
                <RepsRow
                  // Remounts when the logged row changes, so the boxes show what was saved.
                  key={`${setNo}-${set?.id ?? "new"}`}
                  exercise={exercise}
                  setNo={setNo}
                  logged={set}
                  previous={history.find((row) => row.set_no === setNo) ?? best}
                  readOnly={readOnly}
                  onLog={onLog}
                  onUnlog={onUnlog}
                />
              );
            })}
          </ul>
        </>
      )}

      {!readOnly && exercise.measure === "time" && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {rows.map((setNo) => {
            const set = logged.find((row) => row.set_no === setNo);
            return (
              <li key={setNo}>
                <TickButton
                  checked={Boolean(set)}
                  label={sets > 1 ? `${exercise.name} round ${setNo} done` : `${exercise.name} done`}
                  onClick={() =>
                    set
                      ? onUnlog(set.id)
                      : onLog({ exercise_id: exercise.id, exercise_name: exercise.name, set_no: setNo, weight_kg: null, reps: null })
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
