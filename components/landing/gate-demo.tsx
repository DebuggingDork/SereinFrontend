"use client";

import { Check, CornerDownLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const QUESTIONS = [
  "What was the first street you lived on?",
  "What was your first pet called?",
  "Which teacher do you still think about?",
  "What did you always order as a kid?",
];
const ROASTS = [
  "Nope. Nice try, detective.",
  "Still wrong. Are you even the owner of this account?",
  "I'm starting to think you're just guessing. Use your brain.",
  "Take a break. Think harder.",
];
const COOLDOWN_SECONDS = 30;

function GateDoor() {
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState("");
  const [roast, setRoast] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [opened, setOpened] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown(cooldown - 1);
      if (cooldown === 1) {
        setAttempt(0);
        setRoast(null);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function miss() {
    const next = attempt + 1;
    setAttempt(next);
    setRoast(ROASTS[next - 1] ?? ROASTS[3]!);
    setShakeKey((key) => key + 1);
    setAnswer("");
    if (next >= 4) setCooldown(COOLDOWN_SECONDS);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (cooldown > 0 || !answer.trim()) return;
    if (answer.trim().toLowerCase().replace(/\s+/g, " ") === "serein") {
      setOpened(true);
    } else {
      miss();
    }
  }

  if (opened) {
    return (
      <div className="pop-in flex min-h-[230px] flex-col items-center justify-center gap-3 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-finance-soft text-good">
          <Check size={20} aria-hidden />
        </span>
        <p className="display text-2xl">The door opens. No fanfare.</p>
        <button
          type="button"
          onClick={() => {
            setOpened(false);
            setAttempt(0);
            setRoast(null);
            setAnswer("");
          }}
          className="text-sm text-ink-2 underline underline-offset-2"
        >
          Close it again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} key={shakeKey} className={shakeKey ? "shake" : ""}>
      <p className="font-mono text-xs tracking-wide text-ink-2">Attempt {attempt} of 4</p>
      <h3 className="display mt-[17px] text-[26px] leading-[1.2] sm:text-[32px]">{QUESTIONS[attempt % QUESTIONS.length]}</h3>
      <label htmlFor="gate-answer" className="mt-5 block text-[13px] leading-5 text-ink-2">
        Your answer
      </label>
      <input
        id="gate-answer"
        value={answer}
        disabled={cooldown > 0}
        onChange={(event) => setAnswer(event.target.value)}
        autoComplete="off"
        className="mt-1.5 h-12 w-full rounded-xl border border-line bg-field px-4 outline-none transition-colors focus:border-ink-3 disabled:opacity-60"
      />
      <p role="status" className="min-h-[52px] pt-2 text-[13px] text-bad">
        {roast}
        {cooldown > 0 && ` The door reopens in ${cooldown}s.`}
      </p>
      <div className="flex flex-wrap gap-2.5">
        <Button type="submit" disabled={cooldown > 0} size="lg" >
          Open the door
          <span className="flex size-5 items-center justify-center rounded border border-current/40">
            <CornerDownLeft size={11} aria-hidden />
          </span>
        </Button>
        <Button variant="soft" size="lg" className="!px-[21px]" disabled={cooldown > 0} onClick={miss}>
          Try a wrong answer
        </Button>
      </div>
    </form>
  );
}

function RecoveryDemo() {
  const [kind, setKind] = useState<"normal" | "super" | null>(null);
  return (
    <div className="fade-in">
      <p className="font-mono text-xs tracking-wide text-ink-2">Delayed recovery</p>
      <h3 className="display mt-3 text-[26px] leading-tight">Forgot every answer? Time is the second key.</h3>
      {kind ? (
        <p className="pop-in mt-4 text-[15px] leading-relaxed text-ink-2">
          Your request has been triggered. You can set up new questions in{" "}
          <strong className="font-medium text-ink">{kind === "normal" ? "90" : "20"} minutes</strong>. We email you the
          moment it was made, so a stranger cannot do this quietly.
        </p>
      ) : (
        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
          Confirm your email, pick how urgent it is, and wait. Your data is never touched, only the questions change.
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-2.5">
        <Button size="lg" className="!px-5" onClick={() => setKind("normal")}>
          Normal · 90 minutes
        </Button>
        <Button variant="soft" size="lg" className="!px-5" onClick={() => setKind("super")}>
          Super · 20 minutes
        </Button>
      </div>
    </div>
  );
}

export function GateDemo() {
  const [view, setView] = useState<"gate" | "recovery">("gate");

  return (
    <section id="gate" className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] items-start gap-10 px-6 pb-24 md:px-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,648px)] lg:pb-[109px]">
      <div>
        <p className="eyebrow">The rotating gate</p>
        <h2 className="display mt-5 text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.0625]">
          Guess wrong. <em>See what happens.</em>
        </h2>
        <p className="mt-5 max-w-[30rem] text-lg leading-[29px] text-ink-2">
          Every sign-in asks one of your own questions at random. Four misses and the door shuts for a while. Answers
          are hashed and compared on the server only.
        </p>
        <div className="mt-7 flex gap-2.5">
          <button
            type="button"
            aria-pressed={view === "gate"}
            onClick={() => setView("gate")}
            className={`pressable h-11 cursor-pointer rounded-full px-5 text-sm ${
              view === "gate" ? "bg-inverse text-on-inverse" : "border border-line hover:border-line-2"
            }`}
          >
            The gate
          </button>
          <button
            type="button"
            aria-pressed={view === "recovery"}
            onClick={() => setView("recovery")}
            className={`pressable h-11 cursor-pointer rounded-full px-5 text-sm ${
              view === "recovery" ? "bg-inverse text-on-inverse" : "border border-line hover:border-line-2"
            }`}
          >
            Forgot my answers
          </button>
        </div>
        <p className="display mt-[22px] text-base text-ink-2 italic">— Psst: the right answer is “serein”.</p>
      </div>
      <div className="rounded-3xl border border-line bg-surface p-7 sm:p-9">
        {view === "gate" ? <GateDoor /> : <RecoveryDemo />}
      </div>
    </section>
  );
}
