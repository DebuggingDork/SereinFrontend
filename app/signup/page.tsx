"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { AuthFrame, FormError } from "@/components/auth/auth-frame";
import { Button } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/field";
import { supabaseBrowser } from "@/lib/supabase/client";

const schema = z.object({
  name: z.string().trim().min(1, "What should we call you?").max(80),
  email: z.email("That email does not look right."),
  password: z.string().min(8, "Use at least 8 characters for your password."),
});

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse({ ...form, email: form.email.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: signUpError } = await supabaseBrowser().auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { name: parsed.data.name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/gate`,
      },
    });
    if (signUpError) {
      setBusy(false);
      setError(signUpError.message);
      return;
    }
    router.push(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
  }

  return (
    <AuthFrame
      title={
        <>
          Pull up <em>a chair.</em>
        </>
      }
      subtitle="An account, a confirmation email, then a few questions only you can answer."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-ink underline underline-offset-2">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field label="Name" htmlFor="name">
          <Input id="name" autoComplete="name" autoFocus value={form.name} onChange={update("name")} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={form.email} onChange={update("email")} />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <PasswordInput
            id="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update("password")}
          />
        </Field>
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>
    </AuthFrame>
  );
}
