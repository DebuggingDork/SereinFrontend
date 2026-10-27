"use client";

import { useState } from "react";
import { TaskForm, TaskRow, useTasks, type Task } from "@/components/planner/tasks";
import { Card, Empty, ErrorNote, ListSkeleton, PageHeader } from "@/components/ui/primitives";
import { addDays, today } from "@/lib/format";

export default function DeadlinesPage() {
  const now = today();
  const { data: tasks = [], isLoading, error } = useTasks({
    filters: [
      ["status", "in", "(todo,doing)"],
      ["due_on", "not.is", null],
      ["parent_id", "is", null],
    ],
    order: [["due_on"], ["due_time", { nullsFirst: false }]],
  });
  const [editing, setEditing] = useState<Task | null>(null);

  const weekEnd = addDays(now, 7);
  const groups: [string, Task[], string][] = [
    ["Overdue", tasks.filter((t) => t.due_on! < now), "text-bad"],
    ["Next 7 days", tasks.filter((t) => t.due_on! >= now && t.due_on! <= weekEnd), ""],
    ["Later", tasks.filter((t) => t.due_on! > weekEnd), ""],
  ];

  return (
    <>
      <PageHeader title="Deadlines" subtitle="Nearest first." />
      <ErrorNote error={error} />
      {isLoading ? (
        <ListSkeleton />
      ) : tasks.length === 0 ? (
        <Card>
          <Empty title="No deadlines" hint="Give a task a due date and it lines up here." />
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map(
            ([label, items, tone]) =>
              items.length > 0 && (
                <Card key={label} title={<span className={tone}>{label}</span>}>
                  <ul className="divide-y divide-line">
                    {items.map((task) => (
                      <TaskRow key={task.id} task={task} onEdit={setEditing} />
                    ))}
                  </ul>
                </Card>
              ),
          )}
        </div>
      )}
      {editing && <TaskForm task={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
