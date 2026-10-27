"use client";

import { Lock, LogOut, Moon, Shield, Sun, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/landing/nav";
import { lockNow, signOut } from "@/lib/api";
import { useFreeze } from "./freeze";
import { MODULES } from "./modules";
import { useTheme } from "./theme";

const TABS = [{ label: "Home", href: "/home", color: "var(--ink)" }, ...MODULES];

function ProfileMenu({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  const itemClass =
    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2";

  return (
    <div ref={menu} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((current) => !current)}
        className="pressable flex size-9 cursor-pointer items-center justify-center rounded-full bg-inverse text-sm font-medium text-on-inverse"
      >
        {name.trim().charAt(0).toUpperCase() || <User size={15} aria-hidden />}
      </button>
      {open && (
        <div
          role="menu"
          className="pop-in absolute top-11 right-0 z-50 w-52 rounded-2xl border border-line bg-surface p-1.5 shadow-card"
        >
          {name && <p className="truncate px-3 py-1.5 text-[13px] text-ink-3">{name}</p>}
          <Link role="menuitem" href="/profile" onClick={() => setOpen(false)} className={itemClass}>
            <User size={15} aria-hidden /> Profile and security
          </Link>
          {isAdmin && (
            <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className={itemClass}>
              <Shield size={15} aria-hidden /> Admin
            </Link>
          )}
          <button role="menuitem" type="button" onClick={toggle} className={itemClass}>
            {theme === "dark" ? <Sun size={15} aria-hidden /> : <Moon size={15} aria-hidden />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button role="menuitem" type="button" onClick={lockNow} className={itemClass}>
            <Lock size={15} aria-hidden /> Lock now
          </button>
          <button role="menuitem" type="button" onClick={signOut} className={itemClass}>
            <LogOut size={15} aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function TopBar({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const { freeze } = useFreeze();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 md:px-6">
        <Link href="/home" aria-label="Serein home" className="shrink-0">
          <Logo size="text-2xl" />
        </Link>

        <nav aria-label="Modules" className="ml-4 hidden items-center gap-1 lg:flex">
          {TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`pressable flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                  active ? "bg-surface-2 text-ink" : "text-ink-2 hover:text-ink"
                }`}
              >
                {active && tab.href !== "/home" && (
                  <span className="size-1.5 rounded-full" style={{ background: tab.color }} />
                )}
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            onClick={() => window.dispatchEvent(new Event("serein:search"))}
            className="kbd pressable hidden h-6 cursor-pointer hover:border-ink-3 sm:inline-flex"
          >
            ⌘K
          </button>
          <button
            type="button"
            onClick={freeze}
            className="pressable flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3 text-[13px] hover:border-line-2"
          >
            <span className="hidden sm:inline">Freeze Screen</span>
            <span className="sm:hidden">Freeze</span>
            <span className="kbd hidden h-5 sm:inline-flex">⌘F</span>
          </button>
          <ProfileMenu name={name} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}

// The primary navigation on small screens, always within thumb reach.
export function BottomBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Modules"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`pressable flex h-14 flex-col items-center justify-center gap-1 text-xs ${
                active ? "text-ink" : "text-ink-3"
              }`}
            >
              <span
                className="size-1.5 rounded-full transition-opacity"
                style={{ background: tab.color, opacity: active ? 1 : 0.35 }}
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
