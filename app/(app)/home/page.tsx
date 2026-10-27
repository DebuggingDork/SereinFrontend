"use client";

import { Check, Settings2 } from "lucide-react";
import dynamic from "next/dynamic";
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

export default function HomePage() {
  const { data: profile } = useProfile();
  const { data: summary, isLoading, error } = useRpc<HomeSummary>("home_summary");
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);

  // Local edits apply instantly; the saved layout takes over once they are stored.
  const [draft, setDraft] = useState<LayoutItem[] | null>(null);
  const layout: LayoutItem[] = draft ?? profile?.home_layout ?? DEFAULT_LAYOUT;

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
