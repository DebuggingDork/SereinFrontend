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
import { GripVertical, Maximize2, Minimize2, X } from "lucide-react";
import { WIDGETS, type HomeSummary, type WidgetSize } from "./widgets";

type LayoutItem = { id: string; size: WidgetSize };

const SPAN: Record<WidgetSize, string> = {
  s: "md:col-span-2",
  m: "md:col-span-3",
  l: "md:col-span-6",
};
const NEXT_SIZE: Record<WidgetSize, WidgetSize> = { s: "m", m: "l", l: "s" };

function SortableWidget({
  item,
  summary,
  onResize,
  onRemove,
}: {
  item: LayoutItem;
  summary: HomeSummary;
  onResize: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const widget = WIDGETS.find((w) => w.id === item.id);
  if (!widget) return null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative col-span-1 ${SPAN[item.size]} ${isDragging ? "z-10 opacity-80" : ""}`}
    >
      {widget.render(summary)}
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
    </div>
  );
}

export function SortableGrid({
  layout,
  summary,
  onChange,
}: {
  layout: LayoutItem[];
  summary: HomeSummary;
  onChange: (next: LayoutItem[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = layout.findIndex((item) => item.id === active.id);
    const to = layout.findIndex((item) => item.id === over.id);
    onChange(arrayMove(layout, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={layout.map((item) => item.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {layout.map((item) => (
            <SortableWidget
              key={item.id}
              item={item}
              summary={summary}
              onResize={() =>
                onChange(layout.map((other) => (other.id === item.id ? { ...other, size: NEXT_SIZE[other.size] } : other)))
              }
              onRemove={() => onChange(layout.filter((other) => other.id !== item.id))}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
