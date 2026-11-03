"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MODULE_ACCENT, MODULES, type ModuleDef } from "./modules";

const LABEL_MS = 2400;

// Remounts per module, so entering one replays the arrival and names what the plus adds there.
function QuickAddButton({ moduleDef }: { moduleDef: ModuleDef }) {
  const pathname = usePathname();
  const pending = useSearchParams().get("new");
  const [named, setNamed] = useState(true);
  const { label, title, href } = moduleDef.quickAdd;

  useEffect(() => {
    const timer = setTimeout(() => setNamed(false), LABEL_MS);
    return () => clearTimeout(timer);
  }, []);

  const path = href.split("?")[0];
  const here = pathname === path;

  return (
    <Link
      href={here ? `${path}?new=${Number(pending ?? 0) + 1}` : href}
      replace={here}
      scroll={!here}
      aria-label={title}
      title={title}
      // Sits on the dock's right edge at any width, clear of the dock itself.
      style={
        {
          "--tint": moduleDef.color,
          right: "max(0.75rem, calc(50% - 14rem))",
          bottom: "calc(env(safe-area-inset-bottom) + 84px)",
        } as React.CSSProperties
      }
      className="glass-fab fixed z-40 flex h-[3.25rem] min-w-[3.25rem] items-center justify-center rounded-full px-3.5 lg:hidden"
    >
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
    </Link>
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
