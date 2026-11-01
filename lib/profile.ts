"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "./data";
import { supabaseBrowser } from "./supabase/client";

export interface Preferences {
  currency: string;
  weekStart: number;
  monthStart: number;
  salaryDay: number;
  salaryRule?: "date" | "last_working_day" | "last_day" | "first_working_day";
  salaryAccountId?: string | null;
  timezone: string;
}

export interface Profile {
  id: string;
  display_name: string;
  role: "user" | "admin";
  preferences: Preferences;
  home_layout: { id: string; size: "s" | "n" | "m" | "w" | "l" }[] | null;
  onboarded_at: string | null;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const supabase = supabaseBrowser();
      // The session is on hand already, and row-level security decides what comes back.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { data, error } = await supabase.from("profiles").select("*").eq("id", session?.user.id).single();
      if (error) throw friendlyError(error);
      return data as Profile;
    },
  });
}

export function useUpdateProfile(successMessage?: string) {
  const client = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const supabase = supabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("profiles").update(patch).eq("id", user?.id);
      if (error) throw friendlyError(error);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["profile"] });
      void client.invalidateQueries({ queryKey: ["rpc"] });
      if (successMessage) toast(successMessage);
    },
    onError: (error) => toast(error.message, { tone: "error" }),
  });
}
