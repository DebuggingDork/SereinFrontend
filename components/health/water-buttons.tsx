"use client";

import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSave } from "@/lib/data";
import { today } from "@/lib/format";

const AMOUNTS = [250, 500, 750];

export function WaterButtons({ current }: { current: number }) {
  const save = useSave("water_logs");
  const log = (amount_ml: number) => save.mutate({ amount_ml, logged_on: today() });
  return (
    <div className="flex flex-wrap gap-2">
      {AMOUNTS.map((amount) => (
        <Button key={amount} variant="soft" size="sm" disabled={save.isPending} onClick={() => log(amount)}>
          +{amount} ml
        </Button>
      ))}
      <Button variant="ghost" size="sm" disabled={save.isPending || current < 250} onClick={() => log(-250)}>
        <Undo2 size={13} aria-hidden /> 250 ml
      </Button>
    </div>
  );
}
