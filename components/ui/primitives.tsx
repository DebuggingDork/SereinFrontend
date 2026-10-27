import Link from "next/link";

export function Card({
  children,
  className = "",
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={`rounded-3xl border border-line bg-surface p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[15px] text-ink-2">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-[34px] leading-tight sm:text-[40px]">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-2">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </header>
  );
}

export function Empty({
  title,
  hint,
  action,
  compact,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 text-center ${compact ? "py-6" : "py-14"}`}>
      <p className="display text-xl">{title}</p>
      {hint && <p className="max-w-sm text-sm leading-relaxed text-ink-2">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "h-24" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14" />
      ))}
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-xl bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
      {error instanceof Error ? error.message : "Something went wrong."}
    </p>
  );
}

export function ProgressBar({
  value,
  color = "var(--ink)",
  marker,
  label,
}: {
  value: number;
  color?: string;
  // A 0 to 1 position for the "today" tick, so pace is visible at a glance.
  marker?: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative h-1.5 rounded-full bg-line"
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${clamped * 100}%`, background: color }}
      />
      {marker !== undefined && (
        <span
          title="Today"
          className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-ink"
          style={{ left: `${Math.max(0, Math.min(1, marker)) * 100}%` }}
        />
      )}
    </div>
  );
}

export function Ring({
  value,
  size = 72,
  thickness = 7,
  color = "var(--ink)",
  children,
}: {
  value: number;
  size?: number;
  thickness?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${clamped * circumference} ${circumference}`}
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[13px]">{children}</div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  note,
  href,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const inner = (
    <>
      <p className="text-[13px] text-ink-2">{label}</p>
      <p className="figure mt-1 text-[28px] leading-tight sm:text-[32px]">{value}</p>
      {note && <p className="mt-1 text-[13px] text-ink-2">{note}</p>}
    </>
  );
  const classes = `block rounded-3xl border border-line bg-surface p-5 ${className}`;
  return href ? (
    <Link href={href} className={`${classes} transition-colors hover:border-line-2`}>
      {inner}
    </Link>
  ) : (
    <div className={classes}>{inner}</div>
  );
}

const CHIP_TONES = {
  neutral: "bg-surface-2 text-ink-2",
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  finance: "bg-finance-soft text-good",
  planner: "bg-planner-soft text-planner",
  diet: "bg-diet-soft text-warn",
  diary: "bg-diary-soft text-diary",
} as const;

export function Chip({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: keyof typeof CHIP_TONES;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${CHIP_TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-surface-2 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`pressable h-8 cursor-pointer rounded-full px-3 text-[13px] whitespace-nowrap ${
            value === option.value ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
