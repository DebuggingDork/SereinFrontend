import { LinkButton } from "@/components/ui/button";

export function ClosingBand() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 pb-20 md:px-16 lg:pb-[100px]">
      <div
        data-theme="dark"
        className="flex flex-col items-center gap-9 rounded-[28px] border border-line bg-[#0d0f12] px-6 pt-20 pb-20 text-center text-ink lg:pt-[86px]"
      >
        <h2 className="display text-[clamp(2.25rem,3.4vw,3rem)] leading-none">
          Come in. <em>Close the glass.</em>
        </h2>
        <LinkButton href="/login" size="lg" className="!h-[46px] !px-8">
          Enter the Gate
        </LinkButton>
      </div>
    </section>
  );
}

export function Colophon() {
  return (
    <footer id="colophon" className="mx-auto max-w-[1440px] px-6 pb-16 text-center md:px-16">
      <p className="display text-[22px]">Serein</p>
      <p className="display mx-auto mt-1 max-w-xl text-sm leading-[25px] text-ink-2 italic">
        Set in Fraunces and Instrument Sans, with figures in JetBrains Mono.
        <br />
        Printed on warm alabaster, stored on nobody else&apos;s server but your own account.
      </p>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-1 text-sm text-ink-2">
        Colophon · <span className="kbd">Esc</span> to close the glass · <span className="kbd">⌘K</span> to search · ©
        2026
      </p>
    </footer>
  );
}
