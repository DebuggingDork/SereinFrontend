"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Maximize2, Minimize2, Settings2, X } from "lucide-react";
import { useState } from "react";
import { DEFAULT_LAYOUT, WIDGETS, type HomeSummary, type WidgetSize } from "@/components/home/widgets";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ErrorNote, PageHeader, Skeleton } from "@/components/ui/primitives";
import { useRpc } from "@/lib/data";
import { formatDayLong, today } from "@/lib/format";
import { useProfile, useUpdateProfile } from "@/lib/profile";

type LayoutItem = { id: string; size: WidgetSize };

const SPAN: Record<WidgetSize, string> = {
  s: "md:col-span-2",
  m: "md:col-span-3",
  l: "md:col-span-6",
};
const NEXT_SIZE: Record<WidgetSize, WidgetSize> = { s: "m", m: "l", l: "s" };

function SortableWidget({
  item,
  editing,
  summary,
  onResize,
  onRemove,
}: {
  item: LayoutItem;
  editing: boolean;
  summary: HomeSummary;
  onResize: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !editing,
  });
  const widget = WIDGETS.find((w) => w.id === item.id);
  if (!widget) return null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative col-span-1 ${SPAN[item.size]} ${isDragging ? "z-10 opacity-80" : ""}`}
    >
      {widget.render(summary)}
      {editing && (
        <div className="fade-in absolute top-3 right-3 flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5 shadow-card">
          <button
            type="button"
            aria-label={`Move ${widget.label}`}
            className="cursor-grab rounded-full p-1.5 text-ink-2 hover:bg-surface-2 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={13} aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`Resize ${widget.label}`}
            onClick={onResize}
            className="pressable cursor-pointer rounded-full p-1.5 text-ink-2 hover:bg-surface-2"
          >
            {item.size === "l" ? <Minimize2 size={13} aria-hidden /> : <Maximize2 size={13} aria-hidden />}
          </button>
          <button
            type="button"
            aria-label={`Remove ${widget.label}`}
            onClick={onRemove}
            className="pressable cursor-pointer rounded-full p-1.5 text-ink-2 hover:bg-surface-2"
          >
            <X size={13} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

function greeting(name: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name.split(" ")[0]}` : part;
}

export default function HomePage() {
  const { data: profile } = useProfile();
  const { data: summary, isLoading, error } = useRpc<HomeSummary>("home_summary");
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);

  // Local edits apply instantly; the saved layout takes over once they are stored.
  const [draft, setDraft] = useState<LayoutItem[] | null>(null);
  const layout: LayoutItem[] = draft ?? profile?.home_layout ?? DEFAULT_LAYOUT;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function change(next: LayoutItem[]) {
    setDraft(next);
    update.mutate({ home_layout: next });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = layout.findIndex((item) => item.id === active.id);
    const to = layout.findIndex((item) => item.id === over.id);
    change(arrayMove(layout, from, to));
  }

  function toggleWidget(id: string) {
    change(layout.some((item) => item.id === id) ? layout.filter((item) => item.id !== id) : [...layout, { id, size: "m" }]);
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6 pb-28 md:px-6 lg:py-8 lg:pb-12">
      <PageHeader
        title={greeting(profile?.display_name ?? "")}
        subtitle={formatDayLong(today())}
        action={
          editing ? (
            <>
              <Button variant="soft" onClick={() => setPicking(true)}>
                Add or remove
              </Button>
              <Button onClick={() => setEditing(false)}>
                <Check size={14} aria-hidden /> Done
              </Button>
            </>
          ) : (
            <Button variant="soft" onClick={() => setEditing(true)}>
              <Settings2 size={14} aria-hidden /> Customize
            </Button>
          )
        }
      />

      <ErrorNote error={error} />

      {isLoading || !summary ? (
        <div className="grid gap-4 md:grid-cols-2">
          {DEFAULT_LAYOUT.map((item) => (
            <Skeleton key={item.id} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : layout.length === 0 ? (
        <div className="py-20 text-center">
          <p className="display text-2xl">An empty room.</p>
          <Button className="mt-4" onClick={() => setPicking(true)}>
            Add widgets
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={layout.map((item) => item.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
              {layout.map((item) => (
                <SortableWidget
                  key={item.id}
                  item={item}
                  editing={editing}
                  summary={summary}
                  onResize={() =>
                    change(layout.map((other) => (other.id === item.id ? { ...other, size: NEXT_SIZE[other.size] } : other)))
                  }
                  onRemove={() => change(layout.filter((other) => other.id !== item.id))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {picking && (
        <Modal title="Your widgets" onClose={() => setPicking(false)}>
          <ul className="space-y-1.5">
            {WIDGETS.map((widget) => {
              const on = layout.some((item) => item.id === widget.id);
              return (
                <li key={widget.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleWidget(widget.id)}
                    className={`pressable flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left ${
                      on ? "border-ink" : "border-line hover:border-line-2"
                    }`}
                  >
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                        on ? "border-ink bg-inverse text-on-inverse" : "border-line-2"
                      }`}
                    >
                      {on && <Check size={10} aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{widget.label}</span>
                      <span className="block text-xs text-ink-3">{widget.description}</span>
                    </span>
                    <span className="text-xs text-ink-3">{widget.module}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Modal>
      )}
    </main>
  );
}
