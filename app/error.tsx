"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="display text-4xl">
        Something <em>slipped.</em>
      </h1>
      <p className="max-w-sm text-ink-2">That page failed to load. Your data is safe.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
