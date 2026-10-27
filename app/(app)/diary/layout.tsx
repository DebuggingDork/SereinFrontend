import type { Metadata } from "next";
import { ModuleLayout } from "@/components/shell/module-layout";

export const metadata: Metadata = { title: "Diary" };

export default function DiaryLayout({ children }: { children: React.ReactNode }) {
  return <ModuleLayout moduleKey="diary">{children}</ModuleLayout>;
}
