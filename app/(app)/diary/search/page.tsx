"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { MOOD_LABEL, type Mood } from "@/components/diary/shared";
import { Input } from "@/components/ui/field";
import { Card, Chip, Empty, ErrorNote, ListSkeleton, PageHeader } from "@/components/ui/primitives";
import { useRpc } from "@/lib/data";
import { formatDay } from "@/lib/format";

interface Result {
  id: string;
  entry_on: string;
  title: string;
  mood: Mood | null;
  snippet: string;
}

// Highlights come back wrapped in <mark>. The text is the user's own and is never
// rendered as HTML, so the tags are split out rather than injected.
function Snippet({ text }: { text: string }) {
  return (
    <>
      {text.split(/(<mark>.*?<\/mark>)/g).map((part, index) =>
        part.startsWith("<mark>") ? (
          <mark key={index} className="rounded-sm bg-diary-soft px-0.5 text-ink">
            {part.slice(6, -7)}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export default function DiarySearchPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data = [], isLoading, error } = useRpc<Result[]>("search_diary", { p_query: debounced }, debounced.length > 1);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Search" subtitle="Every word you have written." />
      <div className="relative mb-4">
        <Search size={15} aria-hidden className="absolute top-3.5 left-3.5 text-ink-3" />
        <Input
          aria-label="Search your diary"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='rain, or "quiet street"'
          className="pl-10"
        />
      </div>
      <ErrorNote error={error} />
      {debounced.length > 1 && (
        <Card>
          {isLoading ? (
            <ListSkeleton rows={2} />
          ) : data.length === 0 ? (
            <Empty compact title="Nothing found" hint="Try a different word." />
          ) : (
            <ul className="divide-y divide-line">
              {data.map((result) => (
                <li key={result.id}>
                  <Link href={`/diary?entry=${result.id}`} className="block py-3 hover:opacity-80">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="display text-lg">{result.title || "Untitled"}</span>
                      <span className="text-xs text-ink-3">{formatDay(result.entry_on, { day: "numeric", month: "short", year: "numeric" })}</span>
                      {result.mood && <Chip tone="diary">{MOOD_LABEL[result.mood]}</Chip>}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-2">
                      <Snippet text={result.snippet} />
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
