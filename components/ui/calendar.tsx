"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { addDays, monthBounds, monthYear, parseDay, shiftMonth, toDay, today } from "@/lib/format";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthNav({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
        className="pressable cursor-pointer rounded-full p-2 hover:bg-surface-2"
      >
        <ChevronLeft size={16} aria-hidden />
      </button>
      <span className="display min-w-40 text-center text-xl">{monthYear(month)}</span>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => onChange(shiftMonth(month, 1))}
        className="pressable cursor-pointer rounded-full p-2 hover:bg-surface-2"
      >
        <ChevronRight size={16} aria-hidden />
      </button>
    </div>
  );
}

export function MonthGrid({
  month,
  selected,
  onSelect,
  renderDay,
}: {
  month: string;
  selected?: string | null;
  onSelect?: (day: string) => void;
  renderDay: (day: string) => React.ReactNode;
}) {
  const days = useMemo(() => {
    const { from, to } = monthBounds(month);
    const lead = (parseDay(from).getDay() + 6) % 7;
    const first = addDays(from, -lead);
    const total = lead + parseDay(to).getDate();
    const cells = Math.ceil(total / 7) * 7;
    return Array.from({ length: cells }, (_, index) => addDays(first, index));
  }, [month]);

  const currentMonth = parseDay(month).getMonth();
  const now = today();

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-ink-3">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = parseDay(day).getMonth() === currentMonth;
          const isToday = day === now;
          const isSelected = day === selected;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect?.(day)}
              aria-pressed={isSelected}
              aria-label={parseDay(day).toLocaleDateString("en-IN", { dateStyle: "long" })}
              className={`pressable flex min-h-14 cursor-pointer flex-col rounded-xl border p-1.5 text-left sm:min-h-20 sm:p-2 ${
                isSelected
                  ? "border-ink bg-surface"
                  : "border-transparent bg-surface-2/50 hover:border-line-2"
              } ${inMonth ? "" : "opacity-35"}`}
            >
              <span
                className={`tabular flex size-5 items-center justify-center rounded-full text-[11px] ${
                  isToday ? "bg-inverse text-on-inverse" : "text-ink-2"
                }`}
              >
                {parseDay(day).getDate()}
              </span>
              <span className="mt-auto block min-w-0 text-[10px] leading-tight sm:text-[11px]">{renderDay(day)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const todayMonth = () => toDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
