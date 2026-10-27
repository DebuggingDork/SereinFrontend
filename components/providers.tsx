"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { CommandPalette } from "./shell/command-palette";
import { FreezeProvider } from "./shell/freeze";
import { ThemeProvider } from "./shell/theme";
import { ToastProvider } from "./ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <FreezeProvider>
            {children}
            <CommandPalette />
          </FreezeProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
