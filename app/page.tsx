import { ClosingBand } from "@/components/landing/closing";
import { LandingFooter } from "@/components/landing/footer";
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
      <LandingFooter />
    </main>
  );
}
