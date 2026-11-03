import { redirect } from "next/navigation";
import { QueryProvider } from "@/components/query-provider";
import { QuickAdd } from "@/components/shell/quick-add";
import { BottomBar, TopBar } from "@/components/shell/top-bar";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  // proxy.ts has already verified this session, so no second trip to the auth server.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, onboarded_at")
    .eq("id", userId)
    .single();

  if (profile && !profile.onboarded_at) redirect("/onboarding");

  return (
    <QueryProvider>
      <div className="min-h-dvh">
        <TopBar name={profile?.display_name ?? ""} isAdmin={profile?.role === "admin"} />
        {children}
        <QuickAdd />
        <BottomBar />
      </div>
    </QueryProvider>
  );
}
