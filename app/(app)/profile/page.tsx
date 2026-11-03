"use client";

import { Download, Lock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FormError } from "@/components/auth/auth-frame";
import {
  filledQuestions,
  QuestionEditor,
  validateQuestions,
  type QuestionDraft,
} from "@/components/gate/question-editor";
import { PreferencesForm } from "@/components/shell/preferences-form";
import { useTheme } from "@/components/shell/theme";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/components/ui/entity-form";
import { Field, Input } from "@/components/ui/field";
import { Card, PageHeader, Skeleton } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, lockNow } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase/client";

type VerifyResult = { ok: true } | { ok: false; roast: string; question: string | null; lockedUntil: string | null };

function SecurityQuestions() {
  const [saved, setSaved] = useState<{ id: string; question: string }[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const { questions } = await api<{ questions: { id: string; question: string }[] }>("/gate/questions");
    setSaved(questions);
  }, []);

  useEffect(() => {
    // Fetching the saved questions on mount is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load().catch(() => setSaved([]));
  }, [load]);

  async function save() {
    const problem = validateQuestions(drafts);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/gate/questions", { method: "PUT", body: { questions: filledQuestions(drafts) } });
      toast("Questions updated");
      setEditing(false);
      await load();
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "gate_stale") {
        // Changing questions wants a fresh answer, not just a live pass.
        const fresh = await api<{ state: string; question?: string; lockedUntil?: string }>("/gate/challenge");
        if (fresh.question) setChallenge(fresh.question);
        else setError("Too many attempts. Try again shortly.");
      } else {
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
      }
    }
    setBusy(false);
  }

  async function confirmIdentity(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api<VerifyResult>("/gate/verify", { body: { answer } });
      setAnswer("");
      if (result.ok) {
        setChallenge(null);
        setBusy(false);
        await save();
        return;
      }
      setError(result.roast);
      if (result.lockedUntil) window.location.assign("/gate");
      else setChallenge(result.question);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    }
    setBusy(false);
  }

  if (!saved) return <Skeleton className="h-32" />;

  if (challenge) {
    return (
      <form onSubmit={confirmIdentity} className="space-y-4">
        <p className="text-sm text-ink-2">Before changing them, confirm it is you.</p>
        <Field label={challenge} htmlFor="confirm-answer">
          <Input id="confirm-answer" autoFocus autoComplete="off" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </Field>
        <FormError message={error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={busy || !answer.trim()}>
            Confirm
          </Button>
          <Button variant="ghost" onClick={() => setChallenge(null)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <QuestionEditor questions={drafts} onChange={setDrafts} />
        <FormError message={error} />
        <div className="flex gap-2">
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save questions"}
          </Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ul className="mb-4 space-y-1.5 text-sm">
        {saved.map((question) => (
          <li key={question.id}>{question.question}</li>
        ))}
      </ul>
      <Button
        variant="soft"
        size="sm"
        onClick={() => {
          setDrafts(saved.map((question) => ({ question: question.question, answer: "" })));
          setEditing(true);
          setError(null);
        }}
      >
        Change questions
      </Button>
    </div>
  );
}

function AccountDetails() {
  const { toast } = useToast();
  return (
    <div className="grid gap-6">
      <EntityForm
        submitLabel="Change email"
        fields={[{ name: "email", label: "New email", required: true, hint: "We confirm it at both addresses. Your data stays with you." }]}
        onSubmit={async (values) => {
          const { error } = await supabaseBrowser().auth.updateUser({ email: String(values.email) });
          if (error) toast(error.message, { tone: "error" });
          else toast("Check both inboxes to confirm");
        }}
      />
      <EntityForm
        submitLabel="Change password"
        fields={[{ name: "password", label: "New password", type: "password", required: true, hint: "At least 8 characters." }]}
        onSubmit={async (values) => {
          const password = String(values.password);
          if (password.length < 8) {
            toast("Use at least 8 characters.", { tone: "error" });
            return;
          }
          const { error } = await supabaseBrowser().auth.updateUser({ password });
          if (error) toast(error.message, { tone: "error" });
          else toast("Password changed");
        }}
      />
    </div>
  );
}

const EXPORT_TABLES = [
  "accounts", "categories", "transactions", "transaction_templates", "budgets", "scheduled_items",
  "people", "debts", "debt_payments", "goals", "net_worth_snapshots", "tasks", "foods", "meal_logs",
  "diet_targets", "meal_plans", "water_logs", "weight_logs", "health_plans", "health_plan_items",
  "health_checkpoints", "health_checkins", "body_measurements", "workout_days", "workout_exercises",
  "workout_sessions", "workout_sets", "diary_entries",
];

function DataExport() {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function exportAll() {
    setBusy(true);
    const supabase = supabaseBrowser();
    const results = await Promise.all(EXPORT_TABLES.map((table) => supabase.from(table).select("*")));
    setBusy(false);
    if (results.some((result) => result.error)) {
      toast("The export failed. Try again.", { tone: "error" });
      return;
    }
    const backup = Object.fromEntries(EXPORT_TABLES.map((table, index) => [table, results[index]!.data]));
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `serein-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <p className="mb-4 text-sm leading-relaxed text-ink-2">Everything you have stored, as one JSON file.</p>
      <Button variant="soft" onClick={exportAll} disabled={busy}>
        <Download size={14} aria-hidden /> {busy ? "Preparing…" : "Export all my data"}
      </Button>
    </>
  );
}

export default function ProfilePage() {
  const { theme, toggle } = useTheme();
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-28 md:px-6 lg:py-8 lg:pb-12">
      <PageHeader
        title="Profile and security"
        action={
          <Button variant="soft" onClick={lockNow}>
            <Lock size={14} aria-hidden /> Lock now
          </Button>
        }
      />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card title="Preferences">
          <PreferencesForm />
        </Card>
        <div className="grid gap-4">
          <Card title="Security questions">
            <SecurityQuestions />
          </Card>
          <Card title="Appearance">
            <Button variant="soft" onClick={toggle}>
              Switch to {theme === "dark" ? "light" : "dark"} mode
            </Button>
          </Card>
          <Card title="Your data">
            <DataExport />
          </Card>
        </div>
        <Card title="Email and password">
          <AccountDetails />
        </Card>
      </div>
    </main>
  );
}
