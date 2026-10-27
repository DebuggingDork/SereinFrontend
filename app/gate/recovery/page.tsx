"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthFrame, FormError } from "@/components/auth/auth-frame";
import {
  filledQuestions,
  QuestionEditor,
  starterQuestions,
  validateQuestions,
} from "@/components/gate/question-editor";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase/client";

type Recovery = {
  state: "none" | "waiting" | "ready" | "denied" | "expired";
  kind?: "normal" | "super";
  readyAt?: string;
  emailConfirmed: boolean;
};

function minutesUntil(iso: string) {
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 60_000));
}

function ConfirmEmail() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setState("sending");
    setError(null);
    const supabase = supabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: user?.email ?? "",
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/gate/recovery`,
      },
    });
    if (otpError) {
      setState("idle");
      setError("We could not send that just now. Wait a minute and retry.");
    } else {
      setState("sent");
    }
  }

  if (state === "sent") {
    return (
      <p className="leading-relaxed text-ink-2">
        Check your inbox and open the link in this browser. It brings you straight back here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <FormError message={error} />
      <p className="leading-relaxed text-ink-2">
        First, confirm this is your email. We will send you a link. Your data stays exactly where it is, only your
        questions will change.
      </p>
      <Button size="lg" onClick={send} disabled={state === "sending"} className="w-full">
        {state === "sending" ? "Sending…" : "Email me a confirmation link"}
      </Button>
    </div>
  );
}

function ChooseKind({ onCreated }: { onCreated: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(kind: "normal" | "super") {
    setBusy(true);
    setError(null);
    try {
      await api("/recovery/requests", { body: { kind } });
      onCreated();
    } catch (caught) {
      setBusy(false);
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    }
  }

  return (
    <div className="space-y-3">
      <FormError message={error} />
      <p className="leading-relaxed text-ink-2">Email confirmed. How urgent is this?</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => request("normal")}
        className="pressable w-full cursor-pointer rounded-2xl border border-line p-4 text-left hover:border-line-2 disabled:opacity-50"
      >
        <span className="block font-medium">Normal request</span>
        <span className="text-sm text-ink-2">New questions in 90 minutes.</span>
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => request("super")}
        className="pressable w-full cursor-pointer rounded-2xl border border-line p-4 text-left hover:border-line-2 disabled:opacity-50"
      >
        <span className="block font-medium">Super request</span>
        <span className="text-sm text-ink-2">New questions in 20 minutes.</span>
      </button>
    </div>
  );
}

function Waiting({ recovery, onRefresh }: { recovery: Recovery; onRefresh: () => void }) {
  const minutes = recovery.readyAt ? minutesUntil(recovery.readyAt) : 0;
  return (
    <div role="status" className="space-y-4">
      <p className="leading-relaxed">
        Your request has been triggered.{" "}
        {minutes > 0 ? (
          <>
            You can set up new questions in <strong className="font-medium">{minutes} minutes</strong>.
          </>
        ) : (
          "It is being processed. This can take a little while."
        )}
      </p>
      <p className="text-sm leading-relaxed text-ink-2">
        We emailed you about this, and will again once your request is approved. You can close this page.
      </p>
      <Button variant="soft" onClick={onRefresh}>
        Check again
      </Button>
    </div>
  );
}

function SetNewQuestions() {
  const [questions, setQuestions] = useState(starterQuestions);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const problem = validateQuestions(questions);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/recovery/complete", { body: { questions: filledQuestions(questions) } });
      window.location.assign("/home");
    } catch (caught) {
      setBusy(false);
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="rounded-xl bg-good-soft px-3.5 py-2.5 text-sm text-good">The system has approved your request.</p>
      <QuestionEditor questions={questions} onChange={setQuestions} />
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={busy} className="w-full">
        {busy ? "Saving…" : "Save new questions"}
      </Button>
    </form>
  );
}

export default function RecoveryPage() {
  const [recovery, setRecovery] = useState<Recovery | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRecovery(await api<Recovery>("/recovery/current"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    }
  }, []);

  useEffect(() => {
    // Fetching the request status on mount is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function body() {
    if (error) return <FormError message={error} />;
    if (!recovery) return <div className="skeleton h-24 w-full" />;
    switch (recovery.state) {
      case "ready":
        return <SetNewQuestions />;
      case "waiting":
        return <Waiting recovery={recovery} onRefresh={load} />;
      case "denied":
      case "expired":
      case "none":
        return (
          <div className="space-y-4">
            {recovery.state !== "none" && (
              <p className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
                {recovery.state === "denied"
                  ? "Your last request was not approved."
                  : "Your last request ran out of time."}{" "}
                You can make a new one.
              </p>
            )}
            {recovery.emailConfirmed ? <ChooseKind onCreated={load} /> : <ConfirmEmail />}
          </div>
        );
    }
  }

  return (
    <AuthFrame
      title={
        <>
          Forgot <em>your answers?</em>
        </>
      }
      subtitle="Time is the second key. Nothing is deleted."
      footer={
        <Link href="/gate" className="underline underline-offset-2">
          Back to the gate
        </Link>
      }
    >
      {body()}
    </AuthFrame>
  );
}
