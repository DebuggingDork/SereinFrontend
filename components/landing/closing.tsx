import { LinkButton } from "@/components/ui/button";

export function ClosingBand() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 pb-20 md:px-16 lg:pb-[100px]">
      <div
        data-theme="dark"
        className="flex flex-col items-center gap-9 rounded-[28px] border border-line bg-[#0d0f12] px-6 pt-20 pb-20 text-center text-ink lg:pt-[86px]"
      >
        <h2 className="display text-[clamp(2.25rem,3.4vw,3rem)] leading-none">
          Your whole day, <em>in one place.</em>
        </h2>
        <LinkButton href="/signup" size="lg" className="!h-[46px] !px-8">
          Get started
        </LinkButton>
      </div>
    </section>
  );
}
