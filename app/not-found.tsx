import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="display text-5xl">
        Nothing <em>behind this door.</em>
      </h1>
      <p className="text-ink-2">That page does not exist.</p>
      <LinkButton href="/">Back to the start</LinkButton>
    </main>
  );
}
