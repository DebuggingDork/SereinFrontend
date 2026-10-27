"use client";

import { useState } from "react";
import { AuthFrame, FormError } from "@/components/auth/auth-frame";
import {
  filledQuestions,
  QuestionEditor,
  starterQuestions,
  validateQuestions,
} from "@/components/gate/question-editor";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function GateSetupPage() {
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
      await api("/gate/setup", { body: { questions: filledQuestions(questions) } });
      window.location.assign("/onboarding");
    } catch (caught) {
      setBusy(false);
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    }
  }

  return (
    <AuthFrame
      title={
        <>
          Questions <em>only you</em> can answer.
        </>
      }
      subtitle="Every sign-in asks one at random. Answers are hashed before they are saved, so nobody can read them, including us."
    >
      <form onSubmit={submit} className="space-y-5">
        <QuestionEditor questions={questions} onChange={setQuestions} />
        <FormError message={error} />
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? "Saving…" : "Save and go in"}
        </Button>
      </form>
    </AuthFrame>
  );
}
