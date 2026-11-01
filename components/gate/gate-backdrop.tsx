"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ShaderBackground = dynamic(() => import("@/components/ui/adisyon-shader").then((m) => m.ShaderBackground), {
  ssr: false,
});

const START_WITHIN_MS = 1_000;

// The question comes first. This gradient paints with the page, and the moving waves fade in
// over it once the browser has a moment, because setting up WebGL can hold up the main thread.
export function GateBackdrop() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const start = () => setAnimate(true);
    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(start, { timeout: START_WITHIN_MS });
      return () => window.cancelIdleCallback(handle);
    }
    const timer = setTimeout(start, START_WITHIN_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 bg-[linear-gradient(to_top,#031c26,#1b6ca8_35%,#5ad2f4_65%,#eaf9ff)]">
      {animate && <ShaderBackground className="fade-in absolute inset-0" />}
    </div>
  );
}
