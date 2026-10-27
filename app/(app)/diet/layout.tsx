import type { Metadata } from "next";
import { ModuleLayout } from "@/components/shell/module-layout";

export const metadata: Metadata = { title: "Diet" };

export default function DietLayout({ children }: { children: React.ReactNode }) {
  return <ModuleLayout moduleKey="diet">{children}</ModuleLayout>;
}
