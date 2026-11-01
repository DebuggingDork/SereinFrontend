"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthFrame, FormError } from "@/components/auth/auth-frame";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { supabaseBrowser } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "link" ? "That link has expired or was already used. Sign in instead." : null,
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setBusy(false);
      setError(
        signInError.code === "email_not_confirmed"
          ? "Your email is not confirmed yet. Check your inbox for the link."
          : "That email and password do not match.",
      );
      return;
    }
    const next = params.get("next");
    router.replace(next ? `/gate?next=${encodeURIComponent(next)}` : "/gate");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormError message={error} />
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      <Button type="submit" size="lg" disabled={busy} className="w-full">
        {busy ? "Checking…" : "Log in"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/forgot-password" className="text-ink-2 underline underline-offset-2 hover:text-ink">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthFrame
      title={
        <>
          Back so <em>soon?</em>
        </>
      }
      subtitle="Welcome back. We will ask one security question next."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-ink underline underline-offset-2">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthFrame>
  );
}
