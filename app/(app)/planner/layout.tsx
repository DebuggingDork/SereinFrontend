import type { Metadata } from "next";
import { ModuleLayout } from "@/components/shell/module-layout";

export const metadata: Metadata = { title: "Planner" };

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return <ModuleLayout moduleKey="planner">{children}</ModuleLayout>;
}
