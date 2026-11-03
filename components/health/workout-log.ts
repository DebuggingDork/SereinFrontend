"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import { friendlyError, invalidateTable, useRows } from "@/lib/data";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { WorkoutDay, WorkoutSession, WorkoutSet } from "./plan-data";

export type HistorySet = WorkoutSet & { workout_sessions: { logged_on: string } | null };

export const useSessions = (limit = 400) =>
  useRows<WorkoutSession>("workout_sessions", { order: [["logged_on", { ascending: false }]], limit });

export const useSetHistory = (limit = 1000) =>
  useRows<HistorySet>("workout_sets", {
    select: "*, workout_sessions(logged_on)",
    order: [["created_at", { ascending: false }]],
    limit,
  });

// What was lifted the last time before a given day, by exercise and set number.
export function lastTimeBefore(history: HistorySet[], exerciseName: string, day: string) {
  const earlier = history.filter(
    (set) => set.exercise_name === exerciseName && set.workout_sessions && set.workout_sessions.logged_on < day,
  );
  const latest = earlier.reduce((max, set) => (set.workout_sessions!.logged_on > max ? set.workout_sessions!.logged_on : max), "");
  return earlier.filter((set) => set.workout_sessions!.logged_on === latest).sort((a, b) => a.set_no - b.set_no);
}

export function useWorkoutActions(day: string, template: WorkoutDay | undefined, session: WorkoutSession | undefined) {
  const client = useQueryClient();
  const { toast } = useToast();
  const refresh = () => {
    invalidateTable(client, "workout_sessions");
    invalidateTable(client, "workout_sets");
  };
  const onError = (error: Error) => toast(error.message, { tone: "error" });

  async function ensureSession() {
    if (session) return session.id;
    const { data, error } = await supabaseBrowser()
      .from("workout_sessions")
      .upsert(
        { logged_on: day, day_id: template?.id ?? null, title: template?.title ?? "Workout", kind: template?.kind ?? "lift" },
        { onConflict: "user_id,logged_on" },
      )
      .select()
      .single();
    if (error) throw friendlyError(error);
    return (data as WorkoutSession).id;
  }

  const logSet = useMutation({
    mutationFn: async (input: { exercise_id: string; exercise_name: string; set_no: number; weight_kg: number | null; reps: number | null }) => {
      const session_id = await ensureSession();
      const { error } = await supabaseBrowser()
        .from("workout_sets")
        .upsert({ ...input, session_id }, { onConflict: "session_id,exercise_name,set_no" });
      if (error) throw friendlyError(error);
    },
    onSuccess: refresh,
    onError,
  });

  const unlogSet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseBrowser().from("workout_sets").delete().eq("id", id);
      if (error) throw friendlyError(error);
    },
    onSuccess: refresh,
    onError,
  });

  const finish = useMutation({
    mutationFn: async () => {
      const id = await ensureSession();
      const { error } = await supabaseBrowser().from("workout_sessions").update({ completed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw friendlyError(error);
    },
    onSuccess: () => {
      refresh();
      toast("Session done");
    },
    onError,
  });

  const reopen = useMutation({
    mutationFn: async () => {
      if (!session) return;
      const { error } = await supabaseBrowser().from("workout_sessions").update({ completed_at: null }).eq("id", session.id);
      if (error) throw friendlyError(error);
    },
    onSuccess: refresh,
    onError,
  });

  // A game takes the place of the day's session, so it replaces what is logged for that date.
  const logGame = useMutation({
    mutationFn: async (input: { title: string; minutes: number; kcal: number | null }) => {
      const { error } = await supabaseBrowser()
        .from("workout_sessions")
        .upsert(
          { logged_on: day, day_id: template?.id ?? null, kind: "game", completed_at: new Date().toISOString(), ...input },
          { onConflict: "user_id,logged_on" },
        );
      if (error) throw friendlyError(error);
    },
    onSuccess: () => {
      refresh();
      toast("Game logged");
    },
    onError,
  });

  const clearSession = useMutation({
    mutationFn: async () => {
      if (!session) return;
      const { error } = await supabaseBrowser().from("workout_sessions").delete().eq("id", session.id);
      if (error) throw friendlyError(error);
    },
    onSuccess: refresh,
    onError,
  });

  return { logSet, unlogSet, finish, reopen, logGame, clearSession };
}
