"use client";

import Link from "next/link";
import { Chip } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove } from "@/lib/data";
import { formatDay } from "@/lib/format";
import { MOOD_LABEL, type DiaryEntry } from "./shared";

export function EntryCard({ entry }: { entry: DiaryEntry }) {
  const remove = useRemove("diary_entries");
  return (
    <li className="flex gap-4 py-4">
      <span className="w-14 shrink-0 text-center">
        <span className="figure block text-2xl leading-none">{entry.entry_on.slice(8, 10)}</span>
        <span className="text-[11px] text-ink-3">{formatDay(entry.entry_on, { month: "short" })}</span>
      </span>
      <Link href={`/diary?entry=${entry.id}`} className="min-w-0 flex-1 hover:opacity-80">
        <p className="flex flex-wrap items-center gap-2">
          <span className="display text-lg">{entry.title || "Untitled"}</span>
          {entry.mood && <Chip tone="diary">{MOOD_LABEL[entry.mood]}</Chip>}
        </p>
        {entry.body && <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-ink-2">{entry.body}</p>}
        {entry.tags.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-1">
            {entry.tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </p>
        )}
      </Link>
      <RowActions
        onDelete={() => remove.mutate(entry.id)}
        deleteTitle="Delete this entry?"
        deleteBody="Diary entries cannot be recovered once deleted."
      />
    </li>
  );
}
