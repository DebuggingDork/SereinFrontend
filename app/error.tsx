"use client";

import { StatusScreen } from "@/components/status/status-screen";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <StatusScreen name="crash">
      <Button size="lg" onClick={reset}>
        Try again
      </Button>
    </StatusScreen>
  );
}
