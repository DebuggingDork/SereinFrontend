"use client";

import { Check, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ACCOUNT_FIELDS, ACCOUNT_KIND_LABEL, accountPayload } from "@/components/finance/account-fields";
import { useAccounts } from "@/components/finance/shared";
import { DEFAULT_LAYOUT, WIDGETS } from "@/components/home/widgets";
import { Logo } from "@/components/landing/nav";
import { PREFERENCE_FIELDS, preferencesPayload } from "@/components/shell/preferences-form";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/components/ui/entity-form";
import { Skeleton } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useSave } from "@/lib/data";
import { inr } from "@/lib/format";
import { useProfile, useUpdateProfile } from "@/lib/profile";

const STEPS = ["Your accounts", "Your cards", "Preferences", "Your home"] as const;

function AccountsStep({ cards, onNext, onBack }: { cards: boolean; onNext: () => void; onBack?: () => void }) {
  const { data: accounts = [], isLoading } = useAccounts();
  const save = useSave("accounts", { successMessage: "Added" });
  const remove = useRemove("accounts");
  const [formKey, setFormKey] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const list = accounts.filter((a) => (cards ? a.kind === "card" : a.kind !== "card"));
  const fields = ACCOUNT_FIELDS.map((field) =>
    field.name === "kind"
      ? {
          ...field,
          options: Object.entries(ACCOUNT_KIND_LABEL)
            .filter(([value]) => (cards ? value === "card" : value !== "card"))
            .map(([value, label]) => ({ value, label })),
        }
      : field,
  );

  return (
    <div>
      <h1 className="display text-[40px] leading-[1.08]">
        {cards ? (
          <>
            Any <em>cards?</em>
          </>
        ) : (
          <>
            Where does your <em>money sit?</em>
          </>
        )}
      </h1>
      <p className="mt-3 leading-relaxed text-ink-2">
        {cards
          ? "A nickname, the last four digits, the limit and what you have used so far. Never the full number, expiry or CVV."
          : "A nickname, the last four digits at most, and the balance you see today. Serein never connects to your bank."}
      </p>

      <div className="mt-6 rounded-3xl border border-line bg-surface p-5">
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : (
          list.length > 0 && (
            <ul className="mb-4 divide-y divide-line">
              {list.map((account) => (
                <li key={account.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    {account.name}
                    {account.last_four && <span className="ml-2 font-mono text-xs text-ink-3">•••• {account.last_four}</span>}
                  </span>
                  <span className="tabular text-ink-2">{inr(account.balance)}</span>
                  <RowActions onDelete={() => remove.mutate(account.id)} deleteTitle={`Remove ${account.name}?`} />
                </li>
              ))}
            </ul>
          )
        )}

        {showForm || (!isLoading && list.length === 0) ? (
          <EntityForm
            key={formKey}
            submitLabel={cards ? "Add card" : "Add account"}
            fields={fields}
            initial={{ kind: cards ? "card" : "bank", balance: 0, card_used: 0 }}
            onSubmit={async (values) => {
              await save.mutateAsync(accountPayload(values));
              setFormKey((key) => key + 1);
              setShowForm(false);
            }}
          />
        ) : (
          !isLoading && (
            <Button variant="soft" size="sm" onClick={() => setShowForm(true)}>
              <Plus size={14} aria-hidden /> Add another
            </Button>
          )
        )}
      </div>

      <div className="mt-6 flex justify-between gap-2">
        {onBack ? (
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={onNext}>{list.length ? "Continue" : "Skip for now"}</Button>
      </div>
    </div>
  );
}

function PreferencesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  if (!profile) return <Skeleton className="h-64" />;

  return (
    <div>
      <h1 className="display text-[40px] leading-[1.08]">
        How does your <em>month run?</em>
      </h1>
      <p className="mt-3 leading-relaxed text-ink-2">Budgets and safe-to-spend follow your salary cycle, not the calendar.</p>
      <div className="mt-6 rounded-3xl border border-line bg-surface p-5">
        <EntityForm
          submitLabel="Continue"
          fields={PREFERENCE_FIELDS}
          initial={{ display_name: profile.display_name, ...profile.preferences }}
          onCancel={onBack}
          onSubmit={async (values) => {
            await update.mutateAsync(preferencesPayload(values, Intl.DateTimeFormat().resolvedOptions().timeZone));
            onNext();
          }}
        />
      </div>
    </div>
  );
}

function WidgetsStep({ onBack, onFinish, busy }: { onBack: () => void; onFinish: (ids: string[]) => void; busy: boolean }) {
  const [picked, setPicked] = useState<string[]>(DEFAULT_LAYOUT.map((w) => w.id));
  const toggle = (id: string) =>
    setPicked((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  return (
    <div>
      <h1 className="display text-[40px] leading-[1.08]">
        Pick <em>your home.</em>
      </h1>
      <p className="mt-3 leading-relaxed text-ink-2">Choose what you want at a glance. You can rearrange it any time.</p>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {WIDGETS.map((widget) => {
          const on = picked.includes(widget.id);
          return (
            <li key={widget.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(widget.id)}
                className={`pressable flex h-full w-full cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left ${
                  on ? "border-ink bg-surface" : "border-line hover:border-line-2"
                }`}
              >
                <span
                  className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                    on ? "border-ink bg-inverse text-on-inverse" : "border-line-2"
                  }`}
                >
                  {on && <Check size={10} aria-hidden />}
                </span>
                <span>
                  <span className="block text-sm">{widget.label}</span>
                  <span className="block text-xs text-ink-3">{widget.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 flex justify-between gap-2">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => onFinish(picked)} disabled={busy || picked.length === 0}>
          {busy ? "Finishing…" : "Finish"}
        </Button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  useEffect(() => {
    if (profile?.onboarded_at) router.replace("/home");
  }, [profile, router]);

  async function finish(ids: string[]) {
    await update.mutateAsync({
      home_layout: ids.map((id) => ({ id, size: "m" as const })),
      onboarded_at: new Date().toISOString(),
    });
    window.location.assign("/home");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-10">
      <div className="flex items-center justify-between">
        <Logo />
        <ol aria-label="Setup progress" className="flex gap-1.5">
          {STEPS.map((name, index) => (
            <li
              key={name}
              aria-current={index === step ? "step" : undefined}
              title={name}
              className={`h-1 w-7 rounded-full transition-colors ${index <= step ? "bg-ink" : "bg-line-2"}`}
            />
          ))}
        </ol>
      </div>
      <div key={step} className="rise mt-12">
        {step === 0 && <AccountsStep cards={false} onNext={() => setStep(1)} />}
        {step === 1 && <AccountsStep cards onBack={() => setStep(0)} onNext={() => setStep(2)} />}
        {step === 2 && <PreferencesStep onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <WidgetsStep onBack={() => setStep(2)} onFinish={finish} busy={update.isPending} />}
      </div>
    </main>
  );
}
