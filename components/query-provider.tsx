"use client";

import { QueryClient, QueryClientProvider, isServer } from "@tanstack/react-query";
import { useEffect } from "react";

const makeClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
    },
  });

let browserClient: QueryClient | undefined;

// One cache per tab, so moving between the app and the admin panel keeps what is
// already fetched. On the server each render gets its own, so users never share one.
function getClient() {
  if (isServer) return makeClient();
  browserClient ??= makeClient();
  return browserClient;
}

// Only signed-in screens fetch data, so the landing and sign-in pages skip this.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = getClient();

  // Whatever failed during an outage loads again once the connection returns.
  useEffect(() => {
    const refresh = () => void client.invalidateQueries();
    window.addEventListener("serein:reconnected", refresh);
    return () => window.removeEventListener("serein:reconnected", refresh);
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
