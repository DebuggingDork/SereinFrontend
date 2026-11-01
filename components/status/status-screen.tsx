import { Bomb, Coffee, Hourglass, ServerCrash, Snail, WifiOff, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/landing/nav";

export type StatusName = "offline" | "slow" | "waking" | "down" | "busy" | "crash";

interface StatusCopy {
  icon: LucideIcon;
  tint: string;
  ink: string;
  label: string;
  title: React.ReactNode;
  body: string;
}

export const STATUS: Record<StatusName, StatusCopy> = {
  offline: {
    icon: WifiOff,
    tint: "var(--surface-2)",
    ink: "var(--ink)",
    label: "No internet",
    title: (
      <>
        You&apos;re <em>offline.</em>
      </>
    ),
    body: "Check your Wi-Fi or mobile data. Stay on this page and whatever you typed stays with it. We carry on as soon as you're back.",
  },
  slow: {
    icon: Snail,
    tint: "var(--diet-soft)",
    ink: "var(--warn)",
    label: "Slow connection",
    title: (
      <>
        This is taking <em>a while.</em>
      </>
    ),
    body: "Your connection is slow, so your money is still on its way. You can keep waiting, or carry on and it will land when it lands.",
  },
  waking: {
    icon: Coffee,
    tint: "var(--finance-soft)",
    ink: "var(--good)",
    label: "Starting up",
    title: (
      <>
        Our server is <em>waking up.</em>
      </>
    ),
    body: "It naps when nobody is around and takes up to a minute to get going. This page picks up by itself.",
  },
  down: {
    icon: ServerCrash,
    tint: "var(--bad-soft)",
    ink: "var(--bad)",
    label: "Server unavailable",
    title: (
      <>
        Our server is <em>down.</em>
      </>
    ),
    body: "That one's on us, and your data is safe. We check again every 10 seconds, and this page picks up by itself once it's back.",
  },
  busy: {
    icon: Hourglass,
    tint: "var(--planner-soft)",
    ink: "var(--planner)",
    label: "Too many requests",
    title: (
      <>
        Easy, <em>slow down.</em>
      </>
    ),
    body: "That was a lot of requests in a short time, so the server asked for a breather. Your data is safe.",
  },
  crash: {
    icon: Bomb,
    tint: "var(--bad-soft)",
    ink: "var(--bad)",
    label: "Something broke",
    title: (
      <>
        Something <em>broke.</em>
      </>
    ),
    body: "This page hit a bug and stopped. Your data is safe. Trying again usually does it.",
  },
};

export function StatusScreen({
  name,
  note,
  children,
  overlay,
}: {
  name: StatusName;
  note?: React.ReactNode;
  children?: React.ReactNode;
  overlay?: boolean;
}) {
  const { icon: Icon, tint, ink, label, title, body } = STATUS[name];
  return (
    <main
      role={overlay ? "alertdialog" : undefined}
      aria-modal={overlay ? true : undefined}
      aria-label={overlay ? label : undefined}
      className={`flex min-h-dvh flex-col bg-bg px-6 py-7 md:px-16 ${overlay ? "fade-in fixed inset-0 z-[110] overflow-y-auto" : ""}`}
    >
      <Logo />
      <div className="my-auto max-w-xl py-12">
        <span
          aria-hidden
          className="mb-7 flex size-20 items-center justify-center rounded-3xl"
          style={{ background: tint, color: ink }}
        >
          <Icon size={36} strokeWidth={1.6} />
        </span>
        <p className="text-sm text-ink-2">{label}</p>
        <h1 className="display mt-2 text-[clamp(2.75rem,6vw,4.5rem)] leading-[1.04]">{title}</h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-2">{body}</p>
        {note && <p className="tabular mt-4 text-sm text-ink-2">{note}</p>}
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </main>
  );
}
