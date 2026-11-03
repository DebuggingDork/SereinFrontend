"use client";

import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { MODULE_ACCENT, MODULES, type ModuleDef } from "./modules";

const LABEL_MS = 2400;

const QuickAddSheet = dynamic(() => import("./quick-add-sheets"), { ssr: false });

const BUTTON_CLASS =
  "glass glass-fab fixed z-40 flex h-[3.25rem] min-w-[3.25rem] cursor-pointer items-center justify-center rounded-full px-3.5 lg:hidden";

// Sits on the dock's right edge at any width, clear of the dock itself.
const BUTTON_PLACE: React.CSSProperties = {
  right: "max(0.75rem, calc(50% - 14rem))",
  bottom: "calc(env(safe-area-inset-bottom) + 84px)",
};

// Remounts per module, so entering one replays the arrival and names what the plus adds there.
function QuickAddButton({ moduleDef }: { moduleDef: ModuleDef }) {
  const pathname = usePathname();
  const pending = useSearchParams().get("new");
  const [named, setNamed] = useState(true);
  const [open, setOpen] = useState(false);
  const { label, title, href } = moduleDef.quickAdd;

  useEffect(() => {
    // Fetched ahead of the tap, so the form opens at once.
    if (!href) void import("./quick-add-sheets");
    const timer = setTimeout(() => setNamed(false), LABEL_MS);
    return () => clearTimeout(timer);
  }, [href]);

  // The sheet holds a history entry, so the phone's back gesture closes it instead of leaving the page.
  useEffect(() => {
    if (!open) return;
    const onBack = () => setOpen(false);
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [open]);

  function show() {
    window.history.pushState(null, "", window.location.href);
    setOpen(true);
  }
  // Stable, because Modal refocuses its first field whenever this changes.
  const close = useCallback(() => window.history.back(), []);

  const content = (
    <>
      <Plus size={22} strokeWidth={2.25} aria-hidden className="glass-fab-icon shrink-0" style={{ color: MODULE_ACCENT[moduleDef.key] }} />
      <span
        aria-hidden
        className={`grid transition-[grid-template-columns,opacity] duration-500 ease-[var(--ease-out-soft)] ${
          named ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0"
        }`}
      >
        <span className="overflow-hidden text-sm font-medium whitespace-nowrap text-ink">
          <span className="pr-1 pl-1.5">{label}</span>
        </span>
      </span>
    </>
  );

  if (href) {
    const path = href.split("?")[0];
    const here = pathname === path;
    return (
      <Link
        href={here ? `${path}?new=${Number(pending ?? 0) + 1}` : href}
        replace={here}
        scroll={!here}
        aria-label={title}
        title={title}
        style={BUTTON_PLACE}
        className={BUTTON_CLASS}
      >
        {content}
      </Link>
    );
  }

  return (
    <>
      <button type="button" aria-haspopup="dialog" aria-label={title} title={title} onClick={show} style={BUTTON_PLACE} className={BUTTON_CLASS}>
        {content}
      </button>
      {open && <QuickAddSheet moduleKey={moduleDef.key} onClose={close} />}
    </>
  );
}

// One tap to each module's most common entry, on phones and tablets.
export function QuickAdd() {
  const pathname = usePathname();
  const moduleDef = MODULES.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
  if (!moduleDef) return null;
  return (
    <Suspense fallback={null}>
      <QuickAddButton key={moduleDef.key} moduleDef={moduleDef} />
    </Suspense>
  );
}
