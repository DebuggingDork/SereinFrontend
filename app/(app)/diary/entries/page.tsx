"use client";

import { EntryCard } from "@/components/diary/entry-card";
import type { DiaryEntry } from "@/components/diary/shared";
import { LinkButton } from "@/components/ui/button";
import { Card, Empty, ErrorNote, ListSkeleton, PageHeader } from "@/components/ui/primitives";
import { useRows } from "@/lib/data";

export default function EntriesPage() {
  const { data: entries = [], isLoading, error } = useRows<DiaryEntry>("diary_entries", {
    order: [["entry_on", { ascending: false }], ["created_at", { ascending: false }]],
    limit: 200,
  });

  return (
    <>
      <PageHeader title="Entries" subtitle={entries.length ? `${entries.length} written` : undefined} />
      <ErrorNote error={error} />
      {isLoading ? (
        <ListSkeleton />
      ) : entries.length === 0 ? (
        <Card>
          <Empty title="Nothing written yet" hint="One line a day is plenty." action={<LinkButton href="/diary">Write</LinkButton>} />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
