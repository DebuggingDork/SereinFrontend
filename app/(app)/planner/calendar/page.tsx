"use client";

import { useState } from "react";
import { TaskForm, TaskRow, useTasks, type Task } from "@/components/planner/tasks";
import { Button } from "@/components/ui/button";
import { MonthGrid, MonthNav, todayMonth } from "@/components/ui/calendar";
import { Card, PageHeader } from "@/components/ui/primitives";
import { addDays, formatDayLong, monthBounds, today } from "@/lib/format";

export default function PlannerCalendarPage() {
  const [month, setMonth] = useState(todayMonth);
  const [selected, setSelected] = useState(today());
  const [editing, setEditing] = useState<Partial<Task> | null>(null);
  const { from, to } = monthBounds(month);
  const { data: tasks = [] } = useTasks({
    filters: [
      ["due_on", "gte", addDays(from, -7)],
      ["due_on", "lte", addDays(to, 7)],
      ["parent_id", "is", null],
      ["status", "neq", "dropped"],
    ],
  });
  const dayTasks = tasks.filter((t) => t.due_on === selected);

  return (
    <>
      <PageHeader title="Calendar" action={<MonthNav month={month} onChange={setMonth} />} />
      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <Card>
          <MonthGrid
            month={month}
            selected={selected}
            onSelect={setSelected}
            renderDay={(day) => {
              const items = tasks.filter((t) => t.due_on === day);
              if (!items.length) return null;
              const done = items.filter((t) => t.status === "done").length;
              const overdue = day < today() && done < items.length;
              return (
                <span className={`tabular inline-block rounded-full px-1.5 ${overdue ? "bg-bad-soft text-bad" : "bg-planner-soft text-planner"}`}>
                  {done}/{items.length}
                </span>
              );
            }}
          />
        </Card>
        <Card
          title={formatDayLong(selected)}
          action={
            <Button size="sm" variant="soft" onClick={() => setEditing({ due_on: selected })}>
              Add
            </Button>
          }
        >
          {dayTasks.length === 0 ? (
            <p className="py-3 text-sm text-ink-3">Nothing due on this day.</p>
          ) : (
            <ul className="divide-y divide-line">
              {dayTasks.map((task) => (
                <TaskRow key={task.id} task={task} showDue={false} onEdit={setEditing} />
              ))}
            </ul>
          )}
        </Card>
      </div>
      {editing && <TaskForm task={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
