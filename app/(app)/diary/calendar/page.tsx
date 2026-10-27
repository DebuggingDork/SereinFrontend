"use client";

import { useState } from "react";
import { EntryCard } from "@/components/diary/entry-card";
import { MOOD_LABEL, type DiaryEntry } from "@/components/diary/shared";
import { LinkButton } from "@/components/ui/button";
import { MonthGrid, MonthNav, todayMonth } from "@/components/ui/calendar";
import { Card, PageHeader } from "@/components/ui/primitives";
import { useRows } from "@/lib/data";
import { addDays, formatDayLong, monthBounds, today } from "@/lib/format";

export default function DiaryCalendarPage() {
  const [month, setMonth] = useState(todayMonth);
  const [selected, setSelected] = useState(today());
  const { from, to } = monthBounds(month);
  const { data: entries = [] } = useRows<DiaryEntry>("diary_entries", {
    filters: [
      ["entry_on", "gte", addDays(from, -7)],
      ["entry_on", "lte", addDays(to, 7)],
    ],
  });
  const dayEntries = entries.filter((entry) => entry.entry_on === selected);

  return (
    <>
      <PageHeader title="Calendar" action={<MonthNav month={month} onChange={setMonth} />} />
      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <Card>
          <MonthGrid
            month={month}
            selected={selected}
            onSelect={setSelected}
            renderDay={(day) => {
              const item = entries.find((entry) => entry.entry_on === day);
              if (!item) return null;
              return (
                <span className="flex items-center gap-1">
                  <span className="size-1.5 shrink-0 rounded-full bg-diary" />
                  <span className="hidden truncate text-ink-2 sm:inline">{item.mood ? MOOD_LABEL[item.mood] : ""}</span>
                </span>
              );
            }}
          />
        </Card>
        <Card title={formatDayLong(selected)}>
          {dayEntries.length === 0 ? (
            <div className="py-3">
              <p className="text-sm text-ink-3">No entry on this day.</p>
              {selected === today() && (
                <LinkButton href="/diary" variant="soft" size="sm" className="mt-3">
                  Write today&apos;s
                </LinkButton>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {dayEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
