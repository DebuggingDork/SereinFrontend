"use client";

import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { MOOD_LABEL, MOODS, promptForDay, type DiaryEntry, type Mood } from "@/components/diary/shared";
import { Button } from "@/components/ui/button";
import { PageHeader, Skeleton } from "@/components/ui/primitives";
import { useRows, useSave } from "@/lib/data";
import { formatDayLong, today } from "@/lib/format";

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 900;

function Editor({ entry, day }: { entry: DiaryEntry | null; day: string }) {
  const [id, setId] = useState(entry?.id ?? null);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [tags, setTags] = useState((entry?.tags ?? []).join(", "));
  const [state, setState] = useState<SaveState>("idle");
  const save = useSave("diary_entries");
  const saving = useRef(false);
  const pending = useRef(false);
  const latest = useRef({ title, body, mood, tags, id });
  latest.current = { title, body, mood, tags, id };
  const textarea = useRef<HTMLTextAreaElement>(null);

  // Saves are queued rather than overlapped, so a slow request cannot create a
  // duplicate entry or overwrite newer text with older text.
  const flush = useCallback(async () => {
    if (saving.current) {
      pending.current = true;
      return;
    }
    const current = latest.current;
    if (!current.id && !current.title.trim() && !current.body.trim() && !current.mood) return;

    saving.current = true;
    setState("saving");
    try {
      const saved = await save.mutateAsync({
        ...(current.id ? { id: current.id } : { entry_on: day }),
        title: current.title,
        body: current.body,
        mood: current.mood,
        tags: current.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setId(saved.id);
      latest.current.id = saved.id;
      setState("saved");
    } catch {
      setState("error");
    }
    saving.current = false;
    if (pending.current) {
      pending.current = false;
      void flush();
    }
  }, [day, save]);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isDirty = useRef(false);
  const schedule = useCallback(() => {
    isDirty.current = true;
    // Honest from the first keystroke: "Saved" only ever describes what is on the server.
    setState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      isDirty.current = false;
      void flush();
    }, AUTOSAVE_DELAY_MS);
  }, [flush]);

  // Leaving the page within the debounce window still saves what was typed.
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (isDirty.current) void flushRef.current();
    },
    [],
  );

  // Grows with the writing, so the page scrolls rather than a tiny box.
  useEffect(() => {
    const node = textarea.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.max(node.scrollHeight, 320)}px`;
  }, [body]);

  const status = {
    idle: "",
    saving: "Saving…",
    saved: "Saved",
    error: "Could not save. Keep this tab open and try again.",
  }[state];

  return (
    <div className="rounded-3xl border border-line bg-surface p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="radiogroup" aria-label="Mood" className="flex flex-wrap gap-1.5">
          {MOODS.map((name) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={mood === name}
              onClick={() => {
                setMood(mood === name ? null : name);
                schedule();
              }}
              className={`pressable h-9 cursor-pointer rounded-full border px-3.5 text-sm ${
                mood === name ? "border-transparent bg-inverse text-on-inverse" : "border-line hover:border-line-2"
              }`}
            >
              {MOOD_LABEL[name]}
            </button>
          ))}
        </div>
        <span role="status" className={`flex items-center gap-1.5 text-[13px] ${state === "error" ? "text-bad" : "text-ink-2"}`}>
          {state === "saved" && <span className="size-1.5 rounded-full bg-diary" />}
          {status}
        </span>
      </div>

      <input
        aria-label="Title"
        value={title}
        maxLength={160}
        onChange={(event) => {
          setTitle(event.target.value);
          schedule();
        }}
        placeholder="Title, if it has one"
        className="display mt-6 w-full bg-transparent text-[28px] leading-tight outline-none placeholder:text-ink-3"
      />
      <textarea
        ref={textarea}
        aria-label="Entry"
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          schedule();
        }}
        placeholder="Start anywhere."
        className="mt-3 w-full resize-none bg-transparent text-[17px] leading-relaxed outline-none placeholder:text-ink-3"
      />
      <input
        aria-label="Tags, separated by commas"
        value={tags}
        onChange={(event) => {
          setTags(event.target.value);
          schedule();
        }}
        placeholder="Tags, separated by commas"
        className="mt-4 w-full border-t border-line bg-transparent pt-3 text-[13px] outline-none placeholder:text-ink-3"
      />
    </div>
  );
}

function WriteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const entryId = params.get("entry");
  const startNew = params.get("new") === "1";
  const day = today();

  const { data: rows = [], isLoading } = useRows<DiaryEntry>("diary_entries", {
    filters: entryId ? [["id", "eq", entryId]] : [["entry_on", "eq", day]],
    order: [["created_at", { ascending: false }]],
  });

  const entry = startNew ? null : (rows[0] ?? null);
  const shownDay = entry?.entry_on ?? day;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={formatDayLong(shownDay)}
        action={
          <Button variant="soft" onClick={() => router.push("/diary?new=1")}>
            <Plus size={15} aria-hidden /> Another entry
          </Button>
        }
      />
      {!entry && (
        <div className="mb-5">
          <p className="display text-lg italic">Prompt of the day</p>
          <p className="display mt-1 text-2xl leading-snug">{promptForDay(day)}</p>
        </div>
      )}
      {isLoading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : (
        // The key ignores the entry's id: a first save must not remount the editor mid-sentence.
        <Editor key={entryId ?? (startNew ? "new" : "today")} entry={entry} day={shownDay} />
      )}
    </div>
  );
}

export default function DiaryWritePage() {
  return (
    <Suspense>
      <WriteContent />
    </Suspense>
  );
}
