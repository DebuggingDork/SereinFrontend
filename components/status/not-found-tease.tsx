"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/landing/nav";
import { buttonClass } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase/client";

const MAX_DODGES = 3;
const NOTICE_DISTANCE = 110;
const VANISH_MS = 170;
const SCREEN_MARGIN = 20;

// One line for each stage of the argument.
const LINES = [
  { title: "Aha, buddy.", body: "I think you're a hacker from emudhra? Nice try. Nothing on this page to steal." },
  { title: "Oh, leaving already?", body: "You typed that address by hand and now you want out. Come on, catch it." },
  { title: "Too slow, detective.", body: "All that hacking experience and you can't click one button?" },
  { title: "Fine. I'm bored of you.", body: "Go on, click it. Tell emudhra we said hi." },
];

export function NotFoundTease() {
  const pathname = usePathname();
  const button = useRef<HTMLAnchorElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [dodges, setDodges] = useState(0);
  const [spot, setSpot] = useState<{ left: number; top: number } | null>(null);
  const [vanished, setVanished] = useState(false);
  const [home, setHome] = useState("/");
  const moving = useRef(false);

  useEffect(() => {
    void supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) setHome("/home");
      });
  }, []);

  function pickSpot(pointerX: number, pointerY: number) {
    const size = button.current!.getBoundingClientRect();
    const text = copy.current?.getBoundingClientRect();
    const maxLeft = window.innerWidth - size.width - SCREEN_MARGIN;
    const maxTop = window.innerHeight - size.height - SCREEN_MARGIN;
    let best = { left: SCREEN_MARGIN, top: SCREEN_MARGIN };
    let bestDistance = -1;

    // The landing spot furthest from the cursor, out of a few random ones clear of the words.
    for (let attempt = 0; attempt < 24; attempt++) {
      const left = SCREEN_MARGIN + Math.random() * Math.max(0, maxLeft - SCREEN_MARGIN);
      const top = SCREEN_MARGIN + Math.random() * Math.max(0, maxTop - SCREEN_MARGIN);
      const coversText =
        text &&
        left < text.right &&
        left + size.width > text.left &&
        top < text.bottom &&
        top + size.height > text.top;
      if (coversText) continue;
      const distance = Math.hypot(left + size.width / 2 - pointerX, top + size.height / 2 - pointerY);
      if (distance > bestDistance) {
        best = { left, top };
        bestDistance = distance;
      }
    }
    return best;
  }

  function dodge(pointerX: number, pointerY: number) {
    if (moving.current || dodges >= MAX_DODGES || !button.current) return;
    moving.current = true;
    setVanished(true);
    const next = pickSpot(pointerX, pointerY);
    window.setTimeout(() => {
      setSpot(next);
      setDodges((count) => count + 1);
      setVanished(false);
      moving.current = false;
    }, VANISH_MS);
  }

  function watchPointer(event: React.PointerEvent) {
    if (!button.current || dodges >= MAX_DODGES) return;
    const box = button.current.getBoundingClientRect();
    const near = Math.hypot(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2));
    if (near < NOTICE_DISTANCE + box.width / 2) dodge(event.clientX, event.clientY);
  }

  const line = LINES[Math.min(dodges, MAX_DODGES)]!;

  return (
    <main onPointerMove={watchPointer} className="flex min-h-dvh flex-col overflow-hidden px-6 py-7 md:px-16">
      <Logo />
      <div className="my-auto max-w-2xl py-12">
        <div ref={copy}>
          <p className="tabular text-sm text-ink-2">
            404 · <span className="break-all">{pathname}</span>
          </p>
          <h1 key={dodges} className="display pop-in mt-3 text-[clamp(3rem,8vw,5.5rem)] leading-[1.02]">
            {line.title}
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-2">{line.body}</p>
        </div>

        {/* Holds the button's place, so the words stay put once it starts running. */}
        <div className="mt-8 h-12">
          <Link
            ref={button}
            href={home}
            // Touch screens have no cursor to run from, so the tap itself sets it off. Keyboards
            // report a click with no detail, and always get through.
            onPointerDown={(event) => {
              if (event.pointerType !== "mouse") dodge(event.clientX, event.clientY);
            }}
            onClick={(event) => {
              if (dodges < MAX_DODGES && event.detail > 0) event.preventDefault();
            }}
            style={spot ?? undefined}
            className={`${buttonClass("primary", "lg", "!px-7")} transition-[opacity,scale] duration-150 ${
              spot ? "fixed z-10" : ""
            } ${vanished ? "scale-50 opacity-0" : "scale-100 opacity-100"}`}
          >
            Take me home
          </Link>
        </div>
      </div>
    </main>
  );
}
