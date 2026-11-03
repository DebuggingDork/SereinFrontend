"use client";

import { useState } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { TrendChart } from "@/components/charts/marks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Card, ErrorNote, PageHeader } from "@/components/ui/primitives";
import { RowActions } from "@/components/ui/row-actions";
import { useRemove, useRows } from "@/lib/data";
import { formatDay, number, shortDay, today } from "@/lib/format";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { friendlyError, invalidateTable } from "@/lib/data";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

interface WeightLog {
  id: string;
  logged_on: string;
  weight_kg: number;
}

export default function WeightPage() {
  const { data: logs = [], isLoading, error } = useRows<WeightLog>("weight_logs", { order: [["logged_on"]], limit: 365 });
  const remove = useRemove("weight_logs");
  const client = useQueryClient();
  const { toast } = useToast();
  const [value, setValue] = useState("");

  // One weight per day: logging again today replaces the morning's number.
  const log = useMutation({
    mutationFn: async (weight_kg: number) => {
      const {
        data: { user },
      } = await supabaseBrowser().auth.getUser();
      const { error: upsertError } = await supabaseBrowser()
        .from("weight_logs")
        .upsert({ user_id: user?.id, logged_on: today(), weight_kg }, { onConflict: "user_id,logged_on" });
      if (upsertError) throw friendlyError(upsertError);
    },
    onSuccess: () => {
      invalidateTable(client, "weight_logs");
      setValue("");
      toast("Saved");
    },
    onError: (mutationError) => toast(mutationError.message, { tone: "error" }),
  });

  const parsed = Number(value);
  const valid = parsed >= 20 && parsed <= 400;
  const latest = logs[logs.length - 1];
  const first = logs[0];
  const change = latest && first ? Number(latest.weight_kg) - Number(first.weight_kg) : 0;

  return (
    <>
      <PageHeader title="Weight" />
      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <ChartCard
          title="Weight trend"
          loading={isLoading}
          error={error}
          empty={logs.length < 2}
          emptyHint="Two entries make a line."
          table={{ columns: ["Date", "Weight"], rows: logs.map((l) => [shortDay(l.logged_on), `${l.weight_kg} kg`]) }}
        >
          <TrendChart
            data={logs.map((l) => ({ day: l.logged_on, weight: Number(l.weight_kg) }))}
            x="day"
            xFormat={shortDay}
            series={[{ key: "weight", label: "Weight", color: "var(--health)" }]}
            format={(v) => `${number(v, 1)} kg`}
            axisFormat={(v) => number(v, 1)}
            height={260}
          />
        </ChartCard>

        <div className="space-y-4">
          <Card title="Today">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (valid) log.mutate(parsed);
              }}
              className="flex gap-2"
            >
              <Input
                aria-label="Weight in kilograms"
                inputMode="decimal"
                placeholder="kg"
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
              <Button type="submit" disabled={!valid || log.isPending}>
                Save
              </Button>
            </form>
            {latest && (
              <p className="mt-3 text-[13px] text-ink-2">
                Latest {number(latest.weight_kg, 1)} kg
                {logs.length > 1 && ` · ${change > 0 ? "+" : ""}${number(change, 1)} kg since ${formatDay(first!.logged_on)}`}
              </p>
            )}
          </Card>
          <ErrorNote error={error} />
          {logs.length > 0 && (
            <Card title="History">
              <ul className="max-h-72 divide-y divide-line overflow-y-auto">
                {[...logs].reverse().map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                    <span className="text-ink-2">{formatDay(entry.logged_on)}</span>
                    <span className="tabular ml-auto">{number(entry.weight_kg, 1)} kg</span>
                    <RowActions onDelete={() => remove.mutate(entry.id)} deleteTitle="Delete this entry?" />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
