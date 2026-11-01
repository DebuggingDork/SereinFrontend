"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame, FormError } from "@/components/auth/auth-frame";
import { Button } from "@/components/ui/button";
import { Field, PasswordInput } from "@/components/ui/field";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function NewPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabaseBrowser().auth.updateUser({ password });
    if (updateError) {
      setBusy(false);
      setError(updateError.message);
      return;
    }
    router.replace("/gate");
  }

  return (
    <AuthFrame
      title={
        <>
          A new <em>password.</em>
        </>
      }
      subtitle="Choose something you have not used here before."
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="New password" htmlFor="password" hint="At least 8 characters.">
          <PasswordInput
            id="password"
            autoFocus
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? "Saving…" : "Save and continue"}
        </Button>
      </form>
    </AuthFrame>
  );
}
