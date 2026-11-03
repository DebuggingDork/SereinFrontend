"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { friendlyError, invalidateTable } from "@/lib/data";
import { number, today } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";

// One weight per day: logging again replaces that morning's number.
export function useLogWeight(onDone?: () => void) {
  const client = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (weight_kg: number) => {
      const { error } = await supabaseBrowser()
        .from("weight_logs")
        .upsert({ logged_on: today(), weight_kg }, { onConflict: "user_id,logged_on" });
      if (error) throw friendlyError(error);
    },
    onSuccess: () => {
      invalidateTable(client, "weight_logs");
      onDone?.();
      toast("Saved");
    },
    onError: (error) => toast(error.message, { tone: "error" }),
  });
}

export function QuickWeigh({ logged }: { logged?: number | null }) {
  const [value, setValue] = useState("");
  const log = useLogWeight(() => setValue(""));
  const parsed = Number(value);
  const valid = parsed >= 20 && parsed <= 400;
  return (
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
        placeholder={logged ? `${number(logged, 1)} kg logged today` : "This morning, in kg"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <Button type="submit" disabled={!valid || log.isPending}>
        Save
      </Button>
    </form>
  );
}
