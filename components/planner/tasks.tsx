"use client";

import { Check, ChevronDown, ChevronRight, Clock, Plus, Repeat } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EntityForm, type FieldDef } from "@/components/ui/entity-form";
import { Modal } from "@/components/ui/modal";
import { Chip } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useRows, useSave } from "@/lib/data";
import { formatTime, relativeDay, today } from "@/lib/format";

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  priority: "low" | "medium" | "high";
  status: "todo" | "doing" | "done" | "dropped";
  due_on: string | null;
  due_time: string | null;
  completed_at: string | null;
  category: string | null;
  recurrence: "none" | "daily" | "weekdays" | "weekly" | "monthly";
  parent_id: string | null;
  estimate_minutes: number | null;
  assigned: boolean;
  created_at: string;
}

export const TASK_FIELDS: FieldDef[] = [
  { name: "title", label: "Title", required: true, maxLength: 200, placeholder: "What needs doing?" },
  { name: "due_on", label: "Due date", type: "date", half: true },
  { name: "due_time", label: "Time", type: "time", half: true },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    required: true,
    half: true,
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
    ],
  },
  { name: "category", label: "Category", half: true, maxLength: 40, placeholder: "Work" },
  {
    name: "recurrence",
    label: "Repeats",
    type: "select",
    required: true,
    half: true,
    options: [
      { value: "none", label: "Does not repeat" },
      { value: "daily", label: "Every day" },
      { value: "weekdays", label: "Weekdays" },
      { value: "weekly", label: "Every week" },
      { value: "monthly", label: "Every month" },
    ],
  },
  { name: "estimate_minutes", label: "Estimate (minutes)", type: "number", min: 1, max: 1440, half: true },
  { name: "notes", label: "Notes", type: "textarea", maxLength: 2000 },
  { name: "assigned", label: "Given to me by someone else", type: "checkbox" },
];

export function useTasks(options: Parameters<typeof useRows<Task>>[1] = {}) {
  return useRows<Task>("tasks", options);
}

export function TaskForm({
  task,
  defaults,
  onClose,
}: {
  task?: Partial<Task> | null;
  defaults?: Partial<Task>;
  onClose: () => void;
}) {
  const save = useSave("tasks", { successMessage: "Saved" });
  return (
    <Modal title={task?.id ? "Edit task" : "New task"} onClose={onClose}>
      <EntityForm
        fields={TASK_FIELDS}
        initial={{ priority: "medium", recurrence: "none", due_on: today(), ...defaults, ...task }}
        onCancel={onClose}
        onSubmit={async (values) => {
          await save.mutateAsync(task?.id ? { ...values, id: task.id } : values);
          onClose();
        }}
      />
    </Modal>
  );
}

const PRIORITY_DOT: Record<Task["priority"], string> = {
  high: "bg-bad",
  medium: "bg-planner",
  low: "bg-line-2",
};

function Subtasks({ parent, subtasks }: { parent: Task; subtasks: Task[] }) {
  const [title, setTitle] = useState("");
  const save = useSave("tasks");
  const remove = useRemove("tasks");

  return (
    <div className="mt-2 ml-8 space-y-1">
      {subtasks.map((sub) => (
        <div key={sub.id} className="flex items-center gap-2 text-sm">
          <CheckButton
            done={sub.status === "done"}
            label={sub.title}
            size="sm"
            onToggle={() => save.mutate({ id: sub.id, status: sub.status === "done" ? "todo" : "done" })}
          />
          <span className={`min-w-0 flex-1 truncate ${sub.status === "done" ? "text-ink-3 line-through" : ""}`}>{sub.title}</span>
          <RowActions onDelete={() => remove.mutate(sub.id)} deleteTitle="Delete this subtask?" />
        </div>
      ))}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          save.mutate({ title: title.trim(), parent_id: parent.id, due_on: parent.due_on });
          setTitle("");
        }}
        className="flex items-center gap-2"
      >
        <Plus size={13} aria-hidden className="text-ink-3" />
        <input
          aria-label="Add a subtask"
          placeholder="Add a subtask"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-7 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3"
        />
      </form>
    </div>
  );
}

function CheckButton({
  done,
  label,
  onToggle,
  size = "md",
}: {
  done: boolean;
  label: string;
  onToggle: () => void;
  size?: "sm" | "md";
}) {
  const dimension = size === "sm" ? "size-4" : "size-5";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      className={`pressable flex shrink-0 cursor-pointer items-center justify-center rounded-full border ${dimension} ${
        done ? "border-planner bg-planner text-white" : "border-line-2 hover:border-planner"
      }`}
    >
      {done && <Check size={size === "sm" ? 10 : 12} aria-hidden />}
    </button>
  );
}

export function TaskRow({
  task,
  subtasks = [],
  onEdit,
  showDue = true,
}: {
  task: Task;
  subtasks?: Task[];
  onEdit: (task: Task) => void;
  showDue?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const save = useSave("tasks");
  const remove = useRemove("tasks");
  const done = task.status === "done";
  const overdue = !done && task.due_on !== null && task.due_on < today();
  const doneSubs = subtasks.filter((s) => s.status === "done").length;

  return (
    <li className="py-2.5">
      <div className="flex items-center gap-3">
        <CheckButton
          done={done}
          label={`Mark ${task.title} ${done ? "not done" : "done"}`}
          onToggle={() => save.mutate({ id: task.id, status: done ? "todo" : "done" })}
        />
        <span className={`size-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} title={`${task.priority} priority`} />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm ${done ? "text-ink-3 line-through" : ""}`}>{task.title}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
            {showDue && task.due_on && (
              <span className={overdue ? "text-bad" : ""}>
                {relativeDay(task.due_on)}
                {task.due_time && ` · ${formatTime(task.due_time)}`}
              </span>
            )}
            {task.category && <span>{task.category}</span>}
            {task.estimate_minutes && (
              <span className="flex items-center gap-0.5">
                <Clock size={10} aria-hidden /> {task.estimate_minutes}m
              </span>
            )}
            {task.recurrence !== "none" && (
              <span className="flex items-center gap-0.5">
                <Repeat size={10} aria-hidden /> {task.recurrence}
              </span>
            )}
            {subtasks.length > 0 && (
              <span>
                {doneSubs}/{subtasks.length} subtasks
              </span>
            )}
          </p>
        </div>
        {task.assigned && <Chip tone="planner">Assigned</Chip>}
        <button
          type="button"
          aria-label={open ? "Hide details" : "Show details"}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="pressable cursor-pointer rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
        >
          {open ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
        </button>
        <RowActions
          onEdit={() => onEdit(task)}
          onDelete={() => remove.mutate(task.id)}
          deleteTitle="Delete this task?"
          deleteBody="Its subtasks go with it."
        />
      </div>
      {open && (
        <div className="fade-in">
          {task.notes && <p className="mt-2 ml-8 text-[13px] leading-relaxed whitespace-pre-wrap text-ink-2">{task.notes}</p>}
          <Subtasks parent={task} subtasks={subtasks} />
        </div>
      )}
    </li>
  );
}

// Groups subtasks under their parents so any task list renders the same way.
export function useTaskTree(tasks: Task[]) {
  return useMemo(() => {
    const children = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.parent_id) continue;
      children.set(task.parent_id, [...(children.get(task.parent_id) ?? []), task]);
    }
    return { roots: tasks.filter((t) => !t.parent_id), childrenOf: (id: string) => children.get(id) ?? [] };
  }, [tasks]);
}

export function QuickTask({ onMore, dueOn = today() }: { onMore: () => void; dueOn?: string | null }) {
  const [title, setTitle] = useState("");
  const save = useSave("tasks");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) return;
        save.mutate({ title: title.trim(), due_on: dueOn });
        setTitle("");
      }}
      className="flex gap-2"
    >
      <input
        aria-label="Add a task"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a task for today"
        className="h-11 min-w-0 flex-1 rounded-full border border-line bg-field px-4 text-[15px] outline-none transition-colors placeholder:text-ink-3 focus:border-ink-3"
      />
      <Button type="submit" size="lg" className="!px-5" disabled={!title.trim()}>
        Add
      </Button>
      <Button variant="soft" size="lg" className="hidden !px-5 sm:inline-flex" onClick={onMore}>
        More options
      </Button>
    </form>
  );
}
