import type { Metadata } from "next";
import { NotFoundTease } from "@/components/status/not-found-tease";

export const metadata: Metadata = { title: "Nice try" };

export default function NotFound() {
  return <NotFoundTease />;
}
