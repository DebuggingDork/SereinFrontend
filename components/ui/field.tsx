import type { ComponentProps } from "react";

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-field px-3.5 text-[15px] outline-none transition-colors placeholder:text-ink-3 focus:border-ink-3 disabled:opacity-60 aria-invalid:border-bad";

export function Field({
  label,
  hint,
  error,
  children,
  className = "",
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-[13px] text-bad">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-[13px] text-ink-3">{hint}</p>
      )}
    </div>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`${inputClass} cursor-pointer appearance-auto ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea className={`${inputClass} h-auto min-h-24 py-2.5 leading-relaxed ${className}`} {...props} />;
}
