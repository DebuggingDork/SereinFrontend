"use client";

import { CommandPalette } from "./shell/command-palette";
import { FreezeProvider } from "./shell/freeze";
import { ThemeProvider } from "./shell/theme";
import { ConnectionStatus } from "./status/connection-status";
import { ToastProvider } from "./ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <FreezeProvider>
          {children}
          <CommandPalette />
          <ConnectionStatus />
        </FreezeProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
