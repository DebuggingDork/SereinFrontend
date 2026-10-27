"use client";

import { Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { TaskForm, TaskRow, useTasks, useTaskTree, type Task } from "@/components/planner/tasks";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Card, Empty, ErrorNote, ListSkeleton, PageHeader } from "@/components/ui/primitives";

function AllTasksContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: tasks = [], isLoading, error } = useTasks({
    filters: [["status", "in", "(todo,doing)"]],
    order: [["due_on", { nullsFirst: false }], ["created_at"]],
  });
  const [editing, setEditing] = useState<Partial<Task> | null>(params.get("new") ? {} : null);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");

  const { roots, childrenOf } = useTaskTree(tasks);
  const categories = useMemo(() => [...new Set(roots.map((t) => t.category).filter(Boolean))] as string[], [roots]);

  const filtered = roots.filter((task) => {
    if (priority && task.priority !== priority) return false;
    if (category && task.category !== category) return false;
    if (source === "assigned" && !task.assigned) return false;
    if (source === "own" && task.assigned) return false;
    const q = search.trim().toLowerCase();
    return !q || `${task.title} ${task.notes ?? ""}`.toLowerCase().includes(q);
  });

  function close() {
    setEditing(null);
    if (params.get("new")) router.replace("/planner/tasks");
  }

  return (
    <>
      <PageHeader
        title="All tasks"
        subtitle={`${roots.length} open`}
        action={
          <Button onClick={() => setEditing({})}>
            <Plus size={15} aria-hidden /> Add
          </Button>
        }
      />
      <Card>
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="relative">
            <Search size={14} aria-hidden className="absolute top-3.5 left-3 text-ink-3" />
            <Input aria-label="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="!h-10 pl-8 text-sm" />
          </div>
          <Select aria-label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="!h-10 text-sm">
            <option value="">Any priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="!h-10 text-sm">
            <option value="">Any category</option>
            {categories.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </Select>
          <Select aria-label="Source" value={source} onChange={(e) => setSource(e.target.value)} className="!h-10 text-sm">
            <option value="">Mine and assigned</option>
            <option value="own">Only mine</option>
            <option value="assigned">Only assigned</option>
          </Select>
        </div>
        <div className="mt-3">
          <ErrorNote error={error} />
          {isLoading ? (
            <ListSkeleton />
          ) : filtered.length === 0 ? (
            <Empty title={roots.length ? "Nothing matches" : "Nothing open"} hint={roots.length ? "Try clearing a filter." : "Add a task to get going."} />
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((task) => (
                <TaskRow key={task.id} task={task} subtasks={childrenOf(task.id)} onEdit={setEditing} />
              ))}
            </ul>
          )}
        </div>
      </Card>
      {editing && <TaskForm task={editing} defaults={{ due_on: null }} onClose={close} />}
    </>
  );
}

export default function AllTasksPage() {
  return (
    <Suspense>
      <AllTasksContent />
    </Suspense>
  );
}
