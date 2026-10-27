"use client";

import { useState } from "react";
import { QuickTask, TaskForm, TaskRow, useTasks, useTaskTree, type Task } from "@/components/planner/tasks";
import { Card, Chip, Empty, ErrorNote, ListSkeleton, PageHeader, ProgressBar } from "@/components/ui/primitives";
import { useRpc } from "@/lib/data";
import { formatDayLong, today } from "@/lib/format";

export default function PlannerTodayPage() {
  const now = today();
  const { data: tasks = [], isLoading, error } = useTasks({
    filters: [
      ["status", "neq", "dropped"],
      ["due_on", "lte", now],
    ],
    order: [["due_on"], ["created_at"]],
  });
  const { data: streaks } = useRpc<{ current_streak: number; longest_streak: number }[]>("task_streaks");
  const [editing, setEditing] = useState<Partial<Task> | null>(null);

  const { roots, childrenOf } = useTaskTree(tasks);
  const startOfToday = new Date(`${now}T00:00:00`).getTime();
  const open = roots.filter((t) => t.status !== "done");
  const dueToday = open.filter((t) => t.due_on === now);
  const carried = open.filter((t) => t.due_on !== now);
  const done = roots.filter((t) => t.status === "done" && t.completed_at && Date.parse(t.completed_at) >= startOfToday);
  const total = dueToday.length + carried.length + done.length;
  const streak = streaks?.[0]?.current_streak ?? 0;

  const row = (task: Task) => <TaskRow key={task.id} task={task} subtasks={childrenOf(task.id)} onEdit={setEditing} />;

  return (
    <>
      <PageHeader
        title="Today"
        subtitle={formatDayLong(now)}
        action={streak > 0 ? <Chip tone="planner">{streak}-day streak</Chip> : undefined}
      />

      <Card className="mb-4">
        <QuickTask onMore={() => setEditing({})} />
        {total > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-[13px] text-ink-2">
              <span>
                {done.length} of {total} done
              </span>
              <span className="tabular">{Math.round((done.length / total) * 100)}%</span>
            </div>
            <ProgressBar value={done.length / total} color="var(--planner)" label="Done today" />
          </div>
        )}
      </Card>

      <ErrorNote error={error} />
      {isLoading ? (
        <ListSkeleton />
      ) : total === 0 ? (
        <Card>
          <Empty title="A clear day" hint="Add something above, or enjoy it." />
        </Card>
      ) : (
        <div className="space-y-4">
          {carried.length > 0 && (
            <Card title={<span className="flex items-center gap-2">Carried over <Chip tone="diet">{carried.length}</Chip></span>}>
              <ul className="divide-y divide-line">{carried.map(row)}</ul>
            </Card>
          )}
          {dueToday.length > 0 && (
            <Card title="Due today">
              <ul className="divide-y divide-line">{dueToday.map(row)}</ul>
            </Card>
          )}
          {done.length > 0 && (
            <Card title="Done">
              <ul className="divide-y divide-line">{done.map(row)}</ul>
            </Card>
          )}
        </div>
      )}

      {editing && <TaskForm task={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
