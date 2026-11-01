import { LinkButton } from "@/components/ui/button";
import { HeroFacts, LivePreview } from "./live-preview";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] items-center gap-12 px-6 pt-8 pb-20 md:px-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] xl:grid-cols-[minmax(0,1fr)_776px] lg:gap-16 lg:pt-12 lg:pb-36">
      <div>
                <h1
          className="display rise max-w-[30rem] text-[clamp(2.5rem,4.2vw,3.75rem)] leading-[1.06]"
          style={{ "--delay": "60ms" } as React.CSSProperties}
        >
          Salary in. Bills out. <em>What&apos;s left is yours.</em>
        </h1>
        <p
          className="rise mt-5 max-w-[29rem] text-[17px] leading-[28px] text-ink-2"
          style={{ "--delay": "120ms" } as React.CSSProperties}
        >
          See what&apos;s safe to spend today, stay on top of what&apos;s due, track what you eat and write down how the day
          went. Your money, plans, meals and thoughts, all in one private place.
        </p>
        <div
          className="rise mt-7 flex flex-wrap gap-3"
          style={{ "--delay": "180ms" } as React.CSSProperties}
        >
          <LinkButton href="/signup" size="lg" className="!px-7">
            Start saving
          </LinkButton>
          <LinkButton href="/login" variant="outline" size="lg">
            Log in
          </LinkButton>
        </div>
        <HeroFacts />
      </div>

      <LivePreview />
    </section>
  );
}
