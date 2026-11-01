"use client";

import { CornerDownLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AuthFrame, FormError } from "@/components/auth/auth-frame";
import { Button } from "@/components/ui/button";
import { ShaderBackground } from "@/components/ui/adisyon-shader";
import { Input } from "@/components/ui/field";
import { api, ApiError, signOut } from "@/lib/api";

type Challenge =
  | { state: "setup" }
  | { state: "locked"; lockedUntil: string; attempt: number; maxAttempts: number }
  | { state: "challenge"; question: string; attempt: number; maxAttempts: number };

type VerifyResponse =
  | { ok: true }
  | {
      ok: false;
      roast: string;
      question: string | null;
      attempt: number;
      maxAttempts: number;
      lockedUntil: string | null;
    };

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/home";
}

function secondsUntil(iso: string) {
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 1000));
}

function formatWait(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function GateForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [question, setQuestion] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(4);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [answer, setAnswer] = useState("");
  const [roast, setRoast] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const challenge = await api<Challenge>("/gate/challenge");
      if (challenge.state === "setup") {
        router.replace("/gate/setup");
        return;
      }
      setAttempt(challenge.attempt);
      setMaxAttempts(challenge.maxAttempts);
      if (challenge.state === "locked") {
        setLockedUntil(challenge.lockedUntil);
        setQuestion(null);
      } else {
        setLockedUntil(null);
        setQuestion(challenge.question);
      }
    } catch (caught) {
      // Login would send a signed-in person straight back here, so say what happened instead.
      const rejected = caught instanceof ApiError && caught.status === 401;
      setError(
        rejected
          ? "We couldn't confirm your session. Try again, or sign out and back in."
          : caught instanceof Error
            ? caught.message
            : "Something went wrong.",
      );
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // Fetching the challenge on mount is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const seconds = secondsUntil(lockedUntil);
      setRemaining(seconds);
      if (seconds === 0) {
        setLockedUntil(null);
        setRoast(null);
        void load();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil, load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!answer.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api<VerifyResponse>("/gate/verify", { body: { answer } });
      if (result.ok) {
        // A full navigation, so the proxy sees the new pass cookie straight away.
        window.location.assign(next);
        return;
      }
      setRoast(result.roast);
      setAttempt(result.attempt);
      setMaxAttempts(result.maxAttempts);
      setQuestion(result.question);
      setLockedUntil(result.lockedUntil);
      setShakeKey((key) => key + 1);
      setAnswer("");
      input.current?.focus();
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "locked") {
        setLockedUntil(caught.data.lockedUntil as string);
        setRoast(caught.message);
      } else {
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
      }
    }
    setBusy(false);
  }

  if (loading && !question && !lockedUntil) {
    return (
      <div aria-busy className="space-y-4">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-4/5" />
        <div className="skeleton h-11 w-full" />
      </div>
    );
  }

  if (!question && !lockedUntil) {
    return (
      <div>
        <FormError message={error ?? "We couldn't load your question."} />
        <Button type="button" size="lg" onClick={() => void load()} className="mt-4 !px-5">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} key={shakeKey} className={shakeKey ? "shake" : ""}>
      <FormError message={error} />
      <p className="font-mono text-xs tracking-wide text-ink-2">
        Attempt {Math.min(attempt, maxAttempts)} of {maxAttempts}
      </p>

      {lockedUntil ? (
        <div role="status" className="mt-3">
          <h2 className="display text-[26px] leading-tight">{roast ?? "Take a break. Think harder."}</h2>
          <p className="mt-3 text-ink-2">
            You can try again in <span className="tabular text-ink">{formatWait(remaining)}</span>.
          </p>
        </div>
      ) : (
        <>
          <h2 className="display mt-3 text-[26px] leading-tight">{question}</h2>
          <label htmlFor="answer" className="mt-4 block text-[13px] text-ink-2">
            Your answer
          </label>
          <Input
            ref={input}
            id="answer"
            autoFocus
            autoComplete="off"
            className="mt-1.5"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
          />
          <p role="status" className="min-h-8 pt-2 text-[13px] text-bad">
            {roast}
          </p>
          <Button type="submit" size="lg" disabled={busy || !answer.trim()} className="!px-5">
            {busy ? "Checking…" : "Continue"}
            <span className="flex size-5 items-center justify-center rounded border border-current/40">
              <CornerDownLeft size={11} aria-hidden />
            </span>
          </Button>
        </>
      )}
    </form>
  );
}

export default function GatePage() {
  return (
    <AuthFrame
      backdrop={<ShaderBackground className="absolute inset-0" />}
      title={
        <>
          Is this <em>really you?</em>
        </>
      }
      footer={
        <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/gate/recovery" className="underline underline-offset-2 hover:text-ink">
            I forgot my answers
          </Link>
          <button type="button" onClick={signOut} className="cursor-pointer underline underline-offset-2 hover:text-ink">
            Sign out
          </button>
        </span>
      }
    >
      <Suspense>
        <GateForm />
      </Suspense>
    </AuthFrame>
  );
}
