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
import { NEXT_WIDGET_SIZE, WIDGETS, widgetSpans, type HomeSummary, type WidgetSize } from "./widgets";

type LayoutItem = { id: string; size: WidgetSize };


function SortableWidget({
  item,
  span,
  summary,
  onResize,
  onRemove,
}: {
  item: LayoutItem;
  span: string;
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
      onPointerDown={listeners?.onPointerDown as React.PointerEventHandler<HTMLDivElement>}
      className={`relative col-span-1 cursor-grab rounded-3xl outline-2 outline-offset-2 outline-line-2 outline-dashed active:cursor-grabbing ${span} ${isDragging ? "z-10 opacity-80" : ""}`}
    >
      {/* While arranging, the card is something to move rather than something to use. */}
      <div className="pointer-events-none h-full select-none">{widget.render(summary)}</div>
      <div className="fade-in absolute -top-3 right-5 z-10 flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5 shadow-card">
        <button
          type="button"
          aria-label={`Move ${widget.label}`}
          className="cursor-grab touch-none rounded-full p-1.5 text-ink-2 hover:bg-surface-2 active:cursor-grabbing"
          {...attributes}
          onKeyDown={listeners?.onKeyDown as React.KeyboardEventHandler<HTMLButtonElement>}
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

  const spans = widgetSpans(layout);

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {layout.map((item, index) => (
            <SortableWidget
              key={item.id}
              item={item}
              span={spans[index]!}
              summary={summary}
              onResize={() =>
                onChange(layout.map((other) => (other.id === item.id ? { ...other, size: NEXT_WIDGET_SIZE[other.size] } : other)))
              }
              onRemove={() => onChange(layout.filter((other) => other.id !== item.id))}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
