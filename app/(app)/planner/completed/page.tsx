"use client";

import { Undo2 } from "lucide-react";
import { useTasks } from "@/components/planner/tasks";
import { Card, Chip, Empty, ErrorNote, ListSkeleton, PageHeader } from "@/components/ui/primitives";
import { useSave } from "@/lib/data";
import { formatDateTime, toDay } from "@/lib/format";

export default function CompletedPage() {
  const { data: tasks = [], isLoading, error } = useTasks({
    filters: [
      ["status", "eq", "done"],
      ["parent_id", "is", null],
    ],
    order: [["completed_at", { ascending: false }]],
    limit: 200,
  });
  const save = useSave("tasks", { successMessage: "Back on the list" });

  return (
    <>
      <PageHeader title="Completed" subtitle="Your history, most recent first." />
      <ErrorNote error={error} />
      {isLoading ? (
        <ListSkeleton />
      ) : tasks.length === 0 ? (
        <Card>
          <Empty title="Nothing finished yet" hint="Tick a task off and it lands here with a timestamp." />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {tasks.map((task) => {
              const late = task.due_on && task.completed_at && toDay(new Date(task.completed_at)) > task.due_on;
              return (
                <li key={task.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{task.title}</p>
                    <p className="text-xs text-ink-3">
                      {task.completed_at && formatDateTime(task.completed_at)}
                      {task.category && ` · ${task.category}`}
                    </p>
                  </div>
                  {task.due_on && <Chip tone={late ? "warn" : "good"}>{late ? "Late" : "On time"}</Chip>}
                  <button
                    type="button"
                    aria-label={`Reopen ${task.title}`}
                    title="Reopen"
                    onClick={() => save.mutate({ id: task.id, status: "todo" })}
                    className="pressable cursor-pointer rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
                  >
                    <Undo2 size={14} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
