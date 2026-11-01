import { ClosingBand, Colophon } from "@/components/landing/closing";
import { Hero } from "@/components/landing/hero";
import { LandingNav } from "@/components/landing/nav";
import { Pillars } from "@/components/landing/pillars";

export default function LandingPage() {
  return (
    <main>
      <LandingNav />
      <Hero />
      <Pillars />
      <ClosingBand />
      <Colophon />
    </main>
  );
}
