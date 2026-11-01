"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthFrame, FormError } from "@/components/auth/auth-frame";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: resetError } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/new-password`,
    });
    setBusy(false);
    if (resetError) setError("We could not send that just now. Wait a minute and retry.");
    else setSent(true);
  }

  return (
    <AuthFrame
      title={
        <>
          It happens. <em>Let&apos;s reset it.</em>
        </>
      }
      subtitle="You will still answer a security question after resetting it."
      footer={
        <Link href="/login" className="underline underline-offset-2">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="leading-relaxed text-ink-2">If that email has an account, a reset link is on its way.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <FormError message={error} />
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthFrame>
  );
}
