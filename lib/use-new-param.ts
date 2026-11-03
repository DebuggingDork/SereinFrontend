"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

// A page's lazy useState only reads ?new= on first load. This also catches the param arriving
// while the page is already open, as it does when the quick add button is tapped from that page.
export function useOnNewParam(open: () => void) {
  const value = useSearchParams().get("new");
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (value) open();
  }
}
