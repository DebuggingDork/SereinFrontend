"use client";

import { Snail, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  connectionServerSnapshot,
  connectionSnapshot,
  dismissLimit,
  dismissStall,
  retryNow,
  setOffline,
  setSlowLink,
  subscribeConnection,
} from "@/lib/connection";
import { StatusScreen } from "./status-screen";

const WAKING_FOR_MS = 60_000;
const SLOW_LINKS = ["slow-2g", "2g"];

type NetworkInformation = EventTarget & { effectiveType?: string };

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

// Sits over the page rather than replacing it, so nothing typed is lost while it shows.
export function ConnectionStatus() {
  const state = useSyncExternalStore(subscribeConnection, connectionSnapshot, connectionServerSnapshot);
  const [bannerClosed, setBannerClosed] = useState(false);
  const now = useNow(Boolean(state.down || state.limitedUntil));

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    const link = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const syncLink = () => setSlowLink(SLOW_LINKS.includes(link?.effectiveType ?? ""));
    syncLink();
    link?.addEventListener("change", syncLink);

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      link?.removeEventListener("change", syncLink);
    };
  }, []);

  useEffect(() => {
    if (state.limitedUntil && now >= state.limitedUntil) dismissLimit();
  }, [state.limitedUntil, now]);

  if (state.offline) {
    return (
      <StatusScreen overlay name="offline">
        <Button size="lg" onClick={() => setOffline(!navigator.onLine)}>
          Check again
        </Button>
      </StatusScreen>
    );
  }

  if (state.down) {
    const waking = state.down.targets.includes("backend") && now - state.down.since < WAKING_FOR_MS;
    return (
      <StatusScreen overlay name={waking ? "waking" : "down"}>
        <Button size="lg" onClick={retryNow}>
          Check now
        </Button>
      </StatusScreen>
    );
  }

  if (state.limitedUntil) {
    const seconds = Math.max(0, Math.ceil((state.limitedUntil - now) / 1000));
    return (
      <StatusScreen overlay name="busy" note={`You can carry on in ${seconds}s.`}>
        <Button size="lg" variant="soft" onClick={dismissLimit}>
          Back to the page
        </Button>
      </StatusScreen>
    );
  }

  if (state.stalled) {
    return (
      <StatusScreen overlay name="slow">
        <Button size="lg" onClick={dismissStall}>
          Keep waiting
        </Button>
        <Button size="lg" variant="soft" onClick={() => window.location.reload()}>
          Reload the page
        </Button>
      </StatusScreen>
    );
  }

  if (state.slow && !bannerClosed) {
    return (
      <div
        role="status"
        className="pop-in fixed inset-x-4 bottom-20 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-sm shadow-card lg:bottom-6"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-health-soft text-warn" aria-hidden>
          <Snail size={16} />
        </span>
        <span className="flex-1">Your connection is slow. Still working on it.</span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setBannerClosed(true)}
          className="pressable cursor-pointer rounded-full p-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          <X size={14} aria-hidden />
        </button>
      </div>
    );
  }

  return null;
}
