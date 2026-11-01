"use client";

import { Check, RotateCcw, Search, Settings2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { DEFAULT_LAYOUT, WIDGETS, widgetSpans, type HomeSummary, type WidgetDef, type WidgetSize } from "@/components/home/widgets";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ErrorNote, PageHeader, Skeleton } from "@/components/ui/primitives";
import { useRpc } from "@/lib/data";
import { formatDayLong, inr, number, today } from "@/lib/format";
import { useProfile, useUpdateProfile } from "@/lib/profile";

type LayoutItem = { id: string; size: WidgetSize };

// Dragging is only possible while customizing, so its library loads when that starts.
const SortableGrid = dynamic(() => import("@/components/home/sortable-grid").then((m) => m.SortableGrid), {
  ssr: false,
  loading: () => <Skeleton className="h-64 rounded-3xl" />,
});

const MODULES: WidgetDef["module"][] = ["Finance", "Planner", "Diet", "Diary"];

function greeting(name: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name.split(" ")[0]}` : part;
}

function brief(summary: HomeSummary) {
  const parts: string[] = [];
  const safe = Number(summary.safe_to_spend?.per_day ?? 0);
  if (safe > 0) parts.push(`${inr(safe)} safe to spend`);
  const due = Number(summary.tasks.due);
  if (due > 0) parts.push(`${due} task${due === 1 ? "" : "s"} due`);
  const calories = Number(summary.nutrition.calories);
  if (calories > 0) parts.push(`${number(calories)} kcal logged`);
  const last = parts.pop();
  if (!last) return "Let's get your money set up.";
  return parts.length ? `${parts.join(", ")} and ${last}.` : `${last}.`;
}

function WidgetPicker({
  layout,
  onToggle,
  onClose,
}: {
  layout: LayoutItem[];
  onToggle: (widget: WidgetDef) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches = WIDGETS.filter((widget) => `${widget.label} ${widget.description} ${widget.module}`.toLowerCase().includes(needle));

  return (
    <Modal title="Choose what's on your home" onClose={onClose}>
      <label className="mb-4 flex h-11 items-center gap-2.5 rounded-xl border border-line bg-field px-3 focus-within:border-ink-3">
        <Search size={15} className="shrink-0 text-ink-2" aria-hidden />
        <span className="sr-only">Search sections and charts</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search, like water or budget"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-2"
        />
      </label>
      {matches.length === 0 && <p className="py-6 text-center text-sm text-ink-2">Nothing matches that.</p>}
      {MODULES.map((module) => {
        const widgets = matches.filter((widget) => widget.module === module);
        if (widgets.length === 0) return null;
        return (
          <section key={module} className="mb-5 last:mb-0">
            <h3 className="mb-2 text-sm font-medium">{module}</h3>
            <ul className="space-y-1.5">
              {widgets.map((widget) => {
                const on = layout.some((item) => item.id === widget.id);
                return (
                  <li key={widget.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => onToggle(widget)}
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
                        <span className="block text-xs text-ink-2">{widget.description}</span>
                      </span>
                      {widget.chart && <span className="text-xs text-ink-2">Chart</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </Modal>
  );
}

export default function HomePage() {
  const { data: profile } = useProfile();
  const { data: summary, isLoading, error } = useRpc<HomeSummary>("home_summary");
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);

  // Local edits apply instantly; the saved layout takes over once they are stored.
  const [draft, setDraft] = useState<LayoutItem[] | null>(null);
  const layout: LayoutItem[] = (draft ?? profile?.home_layout ?? DEFAULT_LAYOUT).filter((item) =>
    WIDGETS.some((widget) => widget.id === item.id),
  );
  const spans = widgetSpans(layout);

  function change(next: LayoutItem[]) {
    setDraft(next);
    update.mutate({ home_layout: next });
  }

  function toggleWidget(widget: WidgetDef) {
    change(
      layout.some((item) => item.id === widget.id)
        ? layout.filter((item) => item.id !== widget.id)
        : [...layout, { id: widget.id, size: widget.size }],
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6 pb-28 md:px-6 lg:py-8 lg:pb-12">
      <PageHeader
        title={greeting(profile?.display_name ?? "")}
        subtitle={`${formatDayLong(today())}.${summary ? ` ${brief(summary)}` : ""}`}
        action={
          editing ? (
            <>
              <Button variant="ghost" onClick={() => change(DEFAULT_LAYOUT)}>
                <RotateCcw size={14} aria-hidden /> Reset
              </Button>
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

      {editing && (
        <p className="fade-in mb-4 text-sm text-ink-2">
          Drag any card to move it. Use the buttons on a card to resize or remove it, or add any chart from Add or remove.
        </p>
      )}

      {isLoading || !summary ? (
        <div className="grid gap-4 md:grid-cols-2">
          {DEFAULT_LAYOUT.slice(0, 4).map((item) => (
            <Skeleton key={item.id} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : layout.length === 0 ? (
        <div className="py-20 text-center">
          <p className="display text-2xl">Your home is empty.</p>
          <Button className="mt-4" onClick={() => setPicking(true)}>
            Add sections and charts
          </Button>
        </div>
      ) : editing ? (
        <SortableGrid layout={layout} summary={summary} onChange={change} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {layout.map((item, index) => (
            <div key={item.id} className={`col-span-1 min-w-0 ${spans[index]}`}>
              {WIDGETS.find((widget) => widget.id === item.id)?.render(summary)}
            </div>
          ))}
        </div>
      )}

      {picking && <WidgetPicker layout={layout} onToggle={toggleWidget} onClose={() => setPicking(false)} />}
    </main>
  );
}
