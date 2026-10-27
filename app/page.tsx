import { ClosingBand, Colophon } from "@/components/landing/closing";
import { GateDemo } from "@/components/landing/gate-demo";
import { Hero } from "@/components/landing/hero";
import { LandingNav } from "@/components/landing/nav";
import { Pillars } from "@/components/landing/pillars";

export default function LandingPage() {
  return (
    <main>
      <LandingNav />
      <Hero />
      <Pillars />
      <GateDemo />
      <ClosingBand />
      <Colophon />
    </main>
  );
}
