"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function DiarySettingsPage() {
  const { toast } = useToast();

  async function exportEntries() {
    const { data, error } = await supabaseBrowser()
      .from("diary_entries")
      .select("entry_on, title, body, mood, tags")
      .order("entry_on");
    if (error) {
      toast("The export failed. Try again.", { tone: "error" });
      return;
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "serein-diary.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader title="Diary settings" />
      <Card title="Your words are yours" className="max-w-lg">
        <p className="mb-4 text-sm leading-relaxed text-ink-2">Download every entry as a JSON file, whenever you like.</p>
        <Button variant="soft" onClick={exportEntries}>
          <Download size={14} aria-hidden /> Export entries
        </Button>
      </Card>
    </>
  );
}
