"use client";

import { Check, Settings2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { DEFAULT_LAYOUT, WIDGETS, type HomeSummary, type WidgetSize } from "@/components/home/widgets";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Card, ErrorNote, PageHeader, Skeleton } from "@/components/ui/primitives";
import { ComingUp, PanelTitle, SafeToSpendPanel, WhereItWent } from "@/components/finance/panels";
import { QuickAdd } from "@/components/finance/quick-add";
import { useRpc } from "@/lib/data";
import { formatDayLong, inr, number, today } from "@/lib/format";
import { useProfile, useUpdateProfile } from "@/lib/profile";

type LayoutItem = { id: string; size: WidgetSize };

const SPAN: Record<WidgetSize, string> = {
  s: "md:col-span-2",
  m: "md:col-span-3",
  l: "md:col-span-6",
};

// Dragging is only possible while customizing, so its library loads when that starts.
const SortableGrid = dynamic(() => import("@/components/home/sortable-grid").then((m) => m.SortableGrid), {
  ssr: false,
  loading: () => <Skeleton className="h-64 rounded-3xl" />,
});

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

export default function HomePage() {
  const { data: profile } = useProfile();
  const { data: summary, isLoading, error } = useRpc<HomeSummary>("home_summary");
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);

  // Local edits apply instantly; the saved layout takes over once they are stored.
  const [draft, setDraft] = useState<LayoutItem[] | null>(null);
  // Older layouts may name money widgets that are now always at the top of the page.
  const layout: LayoutItem[] = (draft ?? profile?.home_layout ?? DEFAULT_LAYOUT).filter((item) =>
    WIDGETS.some((widget) => widget.id === item.id),
  );

  function change(next: LayoutItem[]) {
    setDraft(next);
    update.mutate({ home_layout: next });
  }

  function toggleWidget(id: string) {
    change(layout.some((item) => item.id === id) ? layout.filter((item) => item.id !== id) : [...layout, { id, size: "m" }]);
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6 pb-28 md:px-6 lg:py-8 lg:pb-12">
      <PageHeader
        title={greeting(profile?.display_name ?? "")}
        subtitle={`${formatDayLong(today())}.${summary ? ` ${brief(summary)}` : ""}`}
      />

      <ErrorNote error={error} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SafeToSpendPanel />
        </div>
        <Card className="lg:col-span-5" title={<PanelTitle>Log it now</PanelTitle>}>
          <QuickAdd />
        </Card>
        <WhereItWent className="lg:col-span-7" />
        <ComingUp className="lg:col-span-5" />
      </div>

      <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="display text-[28px] leading-tight">Your day</h2>
        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
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
          )}
        </div>
      </div>

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
        editing ? (
          <SortableGrid layout={layout} summary={summary} onChange={change} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {layout.map((item) => (
              <div key={item.id} className={`col-span-1 ${SPAN[item.size]}`}>
                {WIDGETS.find((widget) => widget.id === item.id)?.render(summary)}
              </div>
            ))}
          </div>
        )
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
