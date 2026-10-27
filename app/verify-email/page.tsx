"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthFrame } from "@/components/auth/auth-frame";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase/client";

function VerifyContent() {
  const email = useSearchParams().get("email");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function resend() {
    if (!email) return;
    setState("sending");
    const { error } = await supabaseBrowser().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/gate` },
    });
    setState(error ? "failed" : "sent");
  }

  return (
    <div className="space-y-4">
      <p className="leading-relaxed text-ink-2">
        We sent a confirmation link to {email ? <strong className="font-medium text-ink">{email}</strong> : "your email"}
        . You cannot sign in until you click it.
      </p>
      {email && (
        <Button variant="soft" onClick={resend} disabled={state === "sending" || state === "sent"}>
          {state === "sent" ? "Sent again" : state === "sending" ? "Sending…" : "Send it again"}
        </Button>
      )}
      {state === "failed" && <p className="text-sm text-bad">We could not resend it just now. Wait a minute and retry.</p>}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthFrame
      title={
        <>
          Check <em>your inbox.</em>
        </>
      }
      footer={
        <Link href="/login" className="underline underline-offset-2">
          Back to sign in
        </Link>
      }
    >
      <Suspense>
        <VerifyContent />
      </Suspense>
    </AuthFrame>
  );
}
