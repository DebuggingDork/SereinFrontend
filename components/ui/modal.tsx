"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { AccentTitle } from "./primitives";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const first =
      panel.current?.querySelector<HTMLElement>("[data-autofocus]") ??
      panel.current?.querySelector<HTMLElement>("input, select, textarea, button");
    first?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fade-in fixed inset-0 z-[80] flex items-end justify-center bg-black/30 sm:items-center sm:p-6"
      onMouseDown={onClose}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        className="pop-in max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-surface p-6 shadow-card sm:rounded-3xl"
      >
        <header className="mb-5 flex items-center justify-between">
          <h2 className="display text-2xl">
            <AccentTitle text={title} />
          </h2>
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={onClose}
            className="pressable cursor-pointer rounded-full p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
          >
            <X size={16} aria-hidden />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  title,
  body,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="leading-relaxed text-ink-2">{body}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="pressable h-10 cursor-pointer rounded-full border border-line px-4 text-sm hover:border-line-2"
        >
          Keep it
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="pressable h-10 cursor-pointer rounded-full bg-bad-soft px-4 text-sm font-medium text-bad"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
