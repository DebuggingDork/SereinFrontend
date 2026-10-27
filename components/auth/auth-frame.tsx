import Link from "next/link";
import { Logo } from "@/components/landing/nav";

export function AuthFrame({
  title,
  subtitle,
  children,
  footer,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
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
