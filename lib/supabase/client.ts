import { createBrowserClient } from "@supabase/ssr";
import { trackedFetch } from "@/lib/connection";

let client: ReturnType<typeof createBrowserClient> | undefined;

export function supabaseBrowser() {
  client ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    global: { fetch: trackedFetch("database") },
  });
  return client;
}
