"use client";

import { useMemo } from "react";
import { useRpc } from "@/lib/data";
import { monthBounds, shiftMonth, today } from "@/lib/format";

export type MonthPoint = {
  day: number;
  thisMonth: number | null;
  lastMonth: number | null;
};

// Running spend by day of the month, for this month and the one before.
export function useMonthCompare() {
  const query = useRpc<{ day: string; total: number }[]>("daily_spending", { p_days: 62 });

  const points = useMemo(() => {
    const rows = query.data ?? [];
    const thisMonth = monthBounds();
    const lastMonth = monthBounds(shiftMonth(today(), -1));
    // Days that have not happened yet stay empty, so the line stops at today.
    const days = new Map<number, MonthPoint>();
    let thisRun = 0;
    let lastRun = 0;
    for (const row of rows) {
      const dayNumber = Number(row.day.slice(8, 10));
      const entry = days.get(dayNumber) ?? { day: dayNumber, thisMonth: null, lastMonth: null };
      if (row.day >= thisMonth.from && row.day <= thisMonth.to) {
        thisRun += Number(row.total);
        entry.thisMonth = thisRun;
      } else if (row.day >= lastMonth.from && row.day <= lastMonth.to) {
        lastRun += Number(row.total);
        entry.lastMonth = lastRun;
      }
      days.set(dayNumber, entry);
    }
    return [...days.values()].sort((a, b) => a.day - b.day);
  }, [query.data]);

  const todayNumber = Number(today().slice(8, 10));
  const spent = points.reduce((latest, point) => point.thisMonth ?? latest, 0);
  // What had gone by this same date last month, which is the fair comparison.
  const spentLastMonthSoFar = points
    .filter((point) => point.day <= todayNumber)
    .reduce((latest, point) => point.lastMonth ?? latest, 0);

  return { query, points, spent, spentLastMonthSoFar };
}
