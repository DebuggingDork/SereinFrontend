"use client";

import { QueryClient, QueryClientProvider, isServer } from "@tanstack/react-query";

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
  return <QueryClientProvider client={getClient()}>{children}</QueryClientProvider>;
}
