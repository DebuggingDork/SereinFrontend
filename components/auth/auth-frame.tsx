import Link from "next/link";
import { Logo } from "@/components/landing/nav";

export function AuthFrame({
  title,
  subtitle,
  children,
  footer,
  backdrop,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  // A moving picture behind the page. It runs from near black to near white, so no plain text
  // would stay readable on it: everything moves into one solid card.
  backdrop?: React.ReactNode;
}) {
  if (backdrop) {
    return (
      <main className="relative isolate flex min-h-dvh items-center justify-center bg-[#031c26] px-5 py-10">
        <div aria-hidden className="fixed inset-0 -z-10">
          {backdrop}
        </div>
        <div className="rise w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <Link href="/" aria-label="Serein home" className="inline-block">
            <Logo />
          </Link>
          <h1 className="display mt-7 text-[36px] leading-[1.08]">{title}</h1>
          {subtitle && <p className="mt-3 leading-relaxed text-ink-2">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-2">{footer}</div>}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center px-5 py-10">
      <Link href="/" aria-label="Serein home" className="mb-auto self-start sm:self-center">
        <Logo />
      </Link>
      <div className="rise my-10 w-full max-w-md">
        <h1 className="display text-[40px] leading-[1.08]">{title}</h1>
        {subtitle && <p className="mt-3 leading-relaxed text-ink-2">{subtitle}</p>}
        <div className="mt-7 rounded-3xl border border-line bg-surface p-6 sm:p-7">{children}</div>
        {footer && <div className="mt-5 text-center text-sm text-ink-2">{footer}</div>}
      </div>
      <div className="mt-auto" />
    </main>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="pop-in rounded-xl bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
      {message}
    </p>
  );
}
