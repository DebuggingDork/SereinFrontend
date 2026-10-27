"use client";

import Link from "next/link";
import { useTheme } from "@/components/shell/theme";

export function Logo({ size = "text-[28px]" }: { size?: string }) {
  return (
    <span className={`display ${size} leading-none`}>
      Serein<span className="text-finance">.</span>
    </span>
  );
}

export function LandingNav() {
  const { theme, toggle } = useTheme();

  return (
    <header className="mx-auto grid max-w-[1440px] grid-cols-[1fr_auto] items-center px-6 py-7 md:grid-cols-[1fr_auto_1fr] md:px-16">
      <Link href="/" aria-label="Serein home">
        <Logo />
      </Link>

      <nav className="hidden items-center gap-8 text-[15px] text-ink-2 md:flex">
        <a href="#modules" className="transition-colors hover:text-ink">
          Modules
        </a>
        <a href="#gate" className="transition-colors hover:text-ink">
          The gate
        </a>
        <a href="#colophon" className="transition-colors hover:text-ink">
          Colophon
        </a>
      </nav>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          aria-label="Open search"
          onClick={() => window.dispatchEvent(new Event("serein:search"))}
          className="kbd pressable hidden h-5 cursor-pointer hover:border-ink-3 sm:inline-flex"
        >
          ⌘K
        </button>
        <button
          type="button"
          onClick={toggle}
          className="pressable h-11 cursor-pointer rounded-full border border-line bg-surface px-[18px] text-[15px] shadow-card hover:border-line-2"
        >
          <span suppressHydrationWarning>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>
    </header>
  );
}
