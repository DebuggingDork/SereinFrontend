import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STATUS, StatusScreen, type StatusName } from "@/components/status/status-screen";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Status", robots: { index: false } };

// Each state as a plain page, so it can be looked at without breaking anything to see it.
export default async function StatusPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  if (!Object.hasOwn(STATUS, state)) notFound();
  return (
    <StatusScreen name={state as StatusName}>
      <LinkButton href="/" size="lg">
        Back to Serein
      </LinkButton>
    </StatusScreen>
  );
}
