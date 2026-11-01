"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "@/components/shell/theme";

export function Logo({ size = "text-[28px]" }: { size?: string }) {
  return (
    <span className={`display ${size} leading-none`}>
      Serein<span className="text-finance">.</span>
    </span>
  );
}

function showFeatures() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("modules")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
}

export function LandingNav() {
  const { theme, toggle } = useTheme();
  const router = useRouter();

  // Old links may still carry the section in the address. Land there, then tidy it away.
  useEffect(() => {
    if (!window.location.hash) return;
    showFeatures();
    // Through the router, which otherwise writes the original address back as it starts up.
    router.replace("/", { scroll: false });
  }, [router]);

  return (
    <header className="mx-auto grid max-w-[1440px] grid-cols-[1fr_auto] items-center px-6 py-7 md:grid-cols-[1fr_auto_1.14fr] md:px-16">
      <Link href="/" aria-label="Serein home">
        <Logo />
      </Link>

      <nav className="hidden items-center gap-8 text-[15px] text-ink-2 md:flex">
        <button type="button" onClick={showFeatures} className="cursor-pointer transition-colors hover:text-ink">
          Features
        </button>
      </nav>

      <div className="flex items-center justify-end gap-3">
        <Link href="/login" className="text-[15px] text-ink-2 transition-colors hover:text-ink">
          Log in
        </Link>
        <button
          type="button"
          onClick={toggle}
          className="pressable h-11 cursor-pointer rounded-full border border-line bg-surface px-[18px] text-sm shadow-card hover:border-line-2"
        >
          <span suppressHydrationWarning>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>
    </header>
  );
}
