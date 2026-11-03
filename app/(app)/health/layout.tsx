import type { Metadata } from "next";
import { ModuleLayout } from "@/components/shell/module-layout";

export const metadata: Metadata = { title: "Health" };

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return <ModuleLayout moduleKey="health">{children}</ModuleLayout>;
}
