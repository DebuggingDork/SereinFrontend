"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULE_ACCENT, MODULES, type ModuleDef } from "./modules";

function isActive(pathname: string, href: string, root: string) {
  return href === root ? pathname === root : pathname === href || pathname.startsWith(`${href}/`);
}

export function ModuleLayout({ moduleKey, children }: { moduleKey: ModuleDef["key"]; children: React.ReactNode }) {
  const moduleDef = MODULES.find((m) => m.key === moduleKey)!;
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-[1440px] gap-6 lg:px-6" style={{ "--accent": MODULE_ACCENT[moduleKey] } as React.CSSProperties}>
      <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 overflow-y-auto py-6 lg:block">
        <p className="display mb-4 flex items-center gap-2.5 px-3 text-2xl">
          <span className="size-2.5 rounded-full" style={{ background: moduleDef.color }} />
          {moduleDef.label}
        </p>
        <nav aria-label={`${moduleDef.label} sections`} className="space-y-0.5">
          {moduleDef.items.map((item) => {
            const active = isActive(pathname, item.href, moduleDef.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`pressable flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm ${
                  active ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <item.icon
                  size={15}
                  aria-hidden
                  style={active ? { color: moduleDef.color } : undefined}
                  className={active ? "" : "text-ink-3"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <nav
          aria-label={`${moduleDef.label} sections`}
          className="no-scrollbar sticky top-16 z-30 flex gap-1 overflow-x-auto border-b border-line bg-bg/85 px-4 py-2 backdrop-blur-md lg:hidden"
        >
          {moduleDef.items.map((item) => {
            const active = isActive(pathname, item.href, moduleDef.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`pressable rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap ${
                  active ? "bg-inverse text-on-inverse" : "text-ink-2"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="px-4 py-6 pb-40 md:px-6 lg:px-2 lg:py-8 lg:pb-12">{children}</main>
      </div>
    </div>
  );
}
