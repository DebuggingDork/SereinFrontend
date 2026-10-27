"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type Tone = "neutral" | "error";
interface Toast {
  id: number;
  message: string;
  tone: Tone;
  action?: { label: string; onClick: () => void };
}

const ToastContext = createContext<{
  toast: (message: string, options?: { tone?: Tone; action?: Toast["action"] }) => void;
}>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, options?: { tone?: Tone; action?: Toast["action"] }) => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { id, message, tone: options?.tone ?? "neutral", action: options?.action }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), options?.action ? 6000 : 3500);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pop-in pointer-events-auto flex max-w-md items-center gap-3 rounded-full px-4 py-2.5 text-sm shadow-card ${
              t.tone === "error" ? "bg-bad-soft text-bad" : "bg-inverse text-on-inverse"
            }`}
          >
            <span>{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick();
                  setToasts((current) => current.filter((x) => x.id !== t.id));
                }}
                className="pressable font-medium underline underline-offset-2"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
