import type { Metadata } from "next";
import { ModuleLayout } from "@/components/shell/module-layout";

export const metadata: Metadata = { title: "Finance" };

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <ModuleLayout moduleKey="finance">{children}</ModuleLayout>;
}
