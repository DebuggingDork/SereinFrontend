const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const inr = (value: number | string | null | undefined) => inrFormatter.format(Number(value ?? 0));
export const inrExact = (value: number | string | null | undefined) => inrPrecise.format(Number(value ?? 0));

export function inrCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`;
  if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `₹${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `₹${Math.round(value)}`;
}

export const number = (value: number | string | null | undefined, digits = 0) =>
  Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: digits });

// Dates travel as YYYY-MM-DD. Parsing them at noon keeps them on the right day
// whatever the viewer's offset from UTC.
export const parseDay = (day: string) => new Date(`${day.slice(0, 10)}T12:00:00`);

export function toDay(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const today = () => toDay();

export function addDays(day: string, amount: number): string {
  const date = parseDay(day);
  date.setDate(date.getDate() + amount);
  return toDay(date);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / 86_400_000);
}

export const formatDay = (day: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  parseDay(day).toLocaleDateString("en-IN", options);

export const formatDayLong = (day: string) =>
  parseDay(day).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

export const shortDay = (day: string) => formatDay(day);
export const monthLabel = (day: string) => formatDay(day, { month: "short" });
export const monthYear = (day: string) => formatDay(day, { month: "long", year: "numeric" });

export function relativeDay(day: string): string {
  const diff = daysBetween(today(), day);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${-diff}d overdue`;
  if (diff < 7) return `in ${diff}d`;
  return formatDay(day);
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  const [h = "0", m = "00"] = time.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? "am" : "pm"}`;
}

export function monthBounds(day: string = today()): { from: string; to: string } {
  const date = parseDay(day);
  return {
    from: toDay(new Date(date.getFullYear(), date.getMonth(), 1, 12)),
    to: toDay(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12)),
  };
}

export function shiftMonth(day: string, months: number): string {
  const date = parseDay(day);
  return toDay(new Date(date.getFullYear(), date.getMonth() + months, 1, 12));
}
