import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { QueryProvider } from "@/components/query-provider";
import { BottomBar, TopBar } from "@/components/shell/top-bar";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

// The panel simply does not exist for anyone else. The backend checks the role
// again on every request, so this is about hiding it, not protecting it.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("display_name, role").eq("id", userId).single();
  if (profile?.role !== "admin") notFound();

  return (
    <QueryProvider>
      <div className="min-h-dvh">
        <TopBar name={profile.display_name} isAdmin />
        {children}
        <BottomBar />
      </div>
    </QueryProvider>
  );
}
