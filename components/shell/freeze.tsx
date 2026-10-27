"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isTypingTarget } from "@/lib/keyboard";

const FreezeContext = createContext<{ frozen: boolean; freeze: () => void; thaw: () => void }>({
  frozen: false,
  freeze: () => {},
  thaw: () => {},
});

export const useFreeze = () => useContext(FreezeContext);

// Drops a sheet of frosted glass over the whole screen. Nothing is logged out, so
// it suits a colleague walking past; the Lock button is for leaving the room.
export function FreezeProvider({ children }: { children: React.ReactNode }) {
  const [frozen, setFrozen] = useState(false);
  const freeze = useCallback(() => setFrozen(true), []);
  const thaw = useCallback(() => setFrozen(false), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!event.key) return;
      
      if (event.key === "Escape") {
        setFrozen(false);
        return;
      }
      const combo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f";
      const bare =
        event.key.toLowerCase() === "f" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget(event.target);
      if (combo || bare) {
        event.preventDefault();
        setFrozen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ frozen, freeze, thaw }), [frozen, freeze, thaw]);

  return (
    <FreezeContext.Provider value={value}>
      {children}
      {frozen && (
        <button
          type="button"
          onClick={thaw}
          aria-label="Close the glass"
          className="frost fade-in fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-4"
        >
          <span className="display text-5xl sm:text-6xl">
            Behind <em>glass.</em>
          </span>
          <span className="flex items-center gap-2 text-sm text-ink-2">
            Press <span className="kbd">Esc</span> or click to close the glass
          </span>
        </button>
      )}
    </FreezeContext.Provider>
  );
}
