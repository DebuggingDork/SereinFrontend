import { redirect } from "next/navigation";
import { BottomBar, TopBar } from "@/components/shell/top-bar";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, onboarded_at")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarded_at) redirect("/onboarding");

  return (
    <div className="min-h-dvh">
      <TopBar name={profile?.display_name ?? ""} isAdmin={profile?.role === "admin"} />
      {children}
      <BottomBar />
    </div>
  );
}
