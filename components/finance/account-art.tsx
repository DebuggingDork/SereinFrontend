import { inr } from "@/lib/format";
import { ACCOUNT_KIND_LABEL } from "./account-fields";
import type { Account } from "./shared";

export interface AccountArtProps {
  kind: Account["kind"];
  name: string;
  bank?: string | null;
  lastFour?: string | null;
  balance: number;
  limit?: number | null;
  dueLabel?: string | null;
}

const SHELL = "relative aspect-[1.586/1] w-full overflow-hidden rounded-[18px] select-none";

// Picks a look from the name, so an account keeps its finish between visits.
function pick<T>(items: T[], text: string): T {
  let total = 0;
  for (const letter of text) total = (total * 31 + letter.charCodeAt(0)) % 9973;
  return items[total % items.length]!;
}

const CARD_FINISHES = [
  { base: "linear-gradient(135deg,#10222e 0%,#25495c 52%,#0c1a24 100%)", accent: "#8fd3e8" },
  { base: "linear-gradient(135deg,#17171a 0%,#3b3b42 50%,#0e0e10 100%)", accent: "#d9d4c5" },
  { base: "linear-gradient(135deg,#0a2d23 0%,#176650 52%,#07201a 100%)", accent: "#8df0c4" },
  { base: "linear-gradient(135deg,#22103f 0%,#4d2591 52%,#160a2b 100%)", accent: "#c8b2ff" },
  { base: "linear-gradient(135deg,#3d1014 0%,#86282e 52%,#260a0d 100%)", accent: "#ffb9a8" },
];

function Chip() {
  return (
    <svg viewBox="0 0 46 34" aria-hidden className="h-[13%] w-auto min-h-7">
      <defs>
        <linearGradient id="card-chip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6dc95" />
          <stop offset="0.5" stopColor="#c99a3f" />
          <stop offset="1" stopColor="#f1d283" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="45" height="33" rx="6" fill="url(#card-chip)" stroke="#8d6a26" />
      <path
        d="M0 11h13c3 0 4 2 4 4v4c0 2-1 4-4 4H0M46 11H33c-3 0-4 2-4 4v4c0 2 1 4 4 4h13M17 0v9c0 2 1 2 2 2h8c1 0 2 0 2-2V0M17 34v-9c0-2 1-2 2-2h8c1 0 2 0 2 2v9"
        fill="none"
        stroke="#8d6a26"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function Contactless({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 9.5a6 6 0 0 1 0 5M10 7a10 10 0 0 1 0 10M14 4.5a15 15 0 0 1 0 15" />
    </svg>
  );
}

function CreditCard({ name, bank, lastFour, balance, limit, dueLabel }: AccountArtProps) {
  const finish = pick(CARD_FINISHES, name || "card");
  const used = limit ? Math.min(1, Math.max(0, balance / limit)) : 0;
  return (
    <div className={`${SHELL} flex flex-col justify-between p-[5.5%] text-[#f4f1e8] shadow-lg`} style={{ background: finish.base }}>
      <span aria-hidden className="absolute -top-1/2 -right-1/4 size-[120%] rounded-full bg-white/[0.06]" />
      <span aria-hidden className="absolute -bottom-2/3 -left-1/4 size-[110%] rounded-full bg-black/15" />

      <div className="relative flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-[15px] font-semibold tracking-wide">{bank || name || "Your card"}</p>
        <p className="shrink-0 text-[10px] tracking-[0.18em] uppercase opacity-80">Credit</p>
      </div>

      <div className="relative flex items-center justify-between">
        <Chip />
        <Contactless color={finish.accent} />
      </div>

      <p className="relative font-mono text-[clamp(13px,4.6cqw,20px)] tracking-[0.14em] [text-shadow:0_1px_1px_rgb(0_0_0/0.6)]">
        •••• •••• •••• {lastFour || "••••"}
      </p>

      <div className="relative flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.14em] uppercase opacity-75">Used</p>
          <p className="figure truncate text-[22px] leading-tight">{inr(balance)}</p>
          {limit ? <p className="text-[11px] opacity-80">of {inr(limit)}</p> : null}
        </div>
        <div className="min-w-0 text-right">
          <p className="truncate text-[12px] tracking-wide uppercase">{name || "Nickname"}</p>
          {dueLabel && <p className="text-[11px] opacity-80">Due {dueLabel}</p>}
        </div>
      </div>
      {limit ? (
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
          <span className="block h-full" style={{ width: `${used * 100}%`, background: finish.accent }} />
        </span>
      ) : null}
    </div>
  );
}

// Colours follow the Mahatma Gandhi New Series, but this is an illustration of a note and
// deliberately not a copy of one: no portrait, emblem, serial number or issuer's wording.
const NOTES = [
  { value: 500, paper: "#b9bda2", ink: "#3d4230", deep: "#8f947a" },
  { value: 200, paper: "#efc07a", ink: "#5a3a0c", deep: "#d99b45" },
  { value: 100, paper: "#bdb7e0", ink: "#352e63", deep: "#918acb" },
  { value: 50, paper: "#a4dbdd", ink: "#134a4d", deep: "#6ebdc1" },
  { value: 20, paper: "#cfdc8f", ink: "#3f4a12", deep: "#a8ba59" },
  { value: 10, paper: "#cfa881", ink: "#4a2c11", deep: "#a97f55" },
];

function noteFor(balance: number) {
  return NOTES.find((note) => balance >= note.value) ?? NOTES[NOTES.length - 1]!;
}

function Note({ note, children, className = "", style }: { note: (typeof NOTES)[number]; children?: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`absolute rounded-[4px] shadow-md ${className}`}
      style={{
        ...style,
        color: note.ink,
        backgroundColor: note.paper,
        backgroundImage: `repeating-radial-gradient(circle at 72% 50%, transparent 0 5px, ${note.deep}55 5px 6px), repeating-linear-gradient(90deg, transparent 0 7px, ${note.deep}22 7px 8px)`,
      }}
    >
      {children}
    </div>
  );
}

function RupeeNotes({ name, balance }: AccountArtProps) {
  const note = noteFor(balance);
  const count = Math.floor(balance / note.value);
  return (
    <div className={`${SHELL} bg-[#ece9df] dark:bg-[#1b1f25]`}>
      {count >= 3 && <Note note={note} className="inset-x-[8%] top-[14%] bottom-[22%] -rotate-[5deg]" />}
      {count >= 2 && <Note note={note} className="inset-x-[7%] top-[15%] bottom-[20%] rotate-[3.5deg]" />}
      <Note note={note} className="inset-x-[6%] top-[17%] bottom-[17%] flex flex-col justify-between overflow-hidden border border-black/10 p-[3.5%]">
        <span aria-hidden className="absolute inset-[3%] rounded-[2px] border border-current opacity-30" />
        <span aria-hidden className="absolute top-1/2 left-[72%] flex aspect-square h-[62%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-current text-[clamp(20px,7cqw,34px)] opacity-25">
          ₹
        </span>
        <div className="relative flex items-start justify-between px-[2%] text-sm font-bold">
          <span>₹{note.value}</span>
          <span className="max-w-[60%] truncate text-[11px] font-medium tracking-wide uppercase">{name || "Cash"}</span>
        </div>
        <div className="relative flex items-end justify-between gap-2 px-[2%]">
          <span className="figure rounded-lg bg-white/75 px-2.5 py-0.5 text-[clamp(20px,8cqw,30px)] leading-tight text-[#17150f] shadow-sm">
            {inr(balance)}
          </span>
          <span className="shrink-0 text-sm font-bold">₹{note.value}</span>
        </div>
      </Note>
    </div>
  );
}

function Wallet({ name, bank, balance }: AccountArtProps) {
  const note = NOTES[2]!;
  return (
    <div className={`${SHELL} bg-[#ece9df] dark:bg-[#1b1f25]`}>
      {/* Notes peeking out of the top. */}
      <Note note={NOTES[0]!} className="inset-x-[14%] top-[6%] h-[40%] -rotate-[3deg]" />
      <Note note={note} className="inset-x-[12%] top-[9%] h-[40%] rotate-[2deg]" />

      <div
        className="absolute inset-x-[6%] top-[22%] bottom-[7%] rounded-[16px] shadow-xl"
        style={{
          backgroundColor: "#5b3a22",
          backgroundImage:
            "radial-gradient(circle at 25% 15%, rgb(255 255 255 / 0.14), transparent 55%), repeating-linear-gradient(35deg, rgb(0 0 0 / 0.05) 0 2px, transparent 2px 5px)",
        }}
      >
        <span aria-hidden className="absolute inset-[5px] rounded-[12px] border border-dashed border-[#d6b48a]/55" />
        <div className="relative flex h-full flex-col justify-between p-[6%] text-[#f5e7d2]">
          <p className="truncate pr-[22%] text-[13px] tracking-wide">{bank || name || "Wallet"}</p>
          <div>
            <p className="text-[10px] tracking-[0.14em] uppercase opacity-80">Inside</p>
            <p className="figure truncate text-[clamp(22px,8.5cqw,34px)] leading-tight text-[#f2cf8e] [text-shadow:0_1px_1px_rgb(0_0_0/0.6)]">
              {inr(balance)}
            </p>
          </div>
        </div>
        {/* The strap and its press stud. */}
        <span aria-hidden className="absolute top-1/2 -right-px h-[34%] w-[22%] -translate-y-1/2 rounded-l-xl bg-[#442a18] shadow-md">
          <span className="absolute top-1/2 left-[22%] size-3 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#f4dca8,#a67c32)] shadow" />
        </span>
      </div>
    </div>
  );
}

function BankCheque({ name, bank, lastFour, balance }: AccountArtProps) {
  return (
    <div
      className={`${SHELL} flex flex-col justify-between border border-black/10 p-[5%] text-[#16324f] shadow-md`}
      style={{
        backgroundColor: "#eaf2f7",
        backgroundImage:
          "repeating-linear-gradient(115deg, rgb(22 50 79 / 0.045) 0 1px, transparent 1px 7px), repeating-linear-gradient(65deg, rgb(22 50 79 / 0.045) 0 1px, transparent 1px 7px)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{bank || "Your bank"}</p>
          <p className="truncate text-xs opacity-75">{name || "Savings account"}</p>
        </div>
        <p className="shrink-0 text-right text-[10px] tracking-[0.14em] uppercase opacity-70">Bank account</p>
      </div>

      <div>
        <div className="flex items-end gap-2 text-[12px]">
          <span className="shrink-0 opacity-75">Balance</span>
          <span aria-hidden className="mb-1 flex-1 border-b border-current opacity-40" />
        </div>
        <div className="mt-2 flex items-center justify-end">
          <span className="figure max-w-full truncate rounded-md border border-current/40 bg-white/70 px-3 py-1 text-[clamp(20px,8cqw,30px)] leading-tight">
            {inr(balance)}
          </span>
        </div>
      </div>

      <p className="font-mono text-[12px] tracking-[0.18em] opacity-85">A/C •••• {lastFour || "••••"}</p>
    </div>
  );
}

function ShareCertificate({ name, bank, balance }: AccountArtProps) {
  return (
    <div
      className={`${SHELL} border border-[#b89b5e]/50 p-[3%] text-[#3b2f14] shadow-md`}
      style={{ backgroundColor: "#f6efdc" }}
    >
      <div className="flex h-full flex-col items-center justify-between rounded-[12px] border-2 border-double border-[#a98a4c] px-[5%] py-[4%] text-center">
        <p className="text-[10px] tracking-[0.22em] uppercase opacity-75">{bank || "Investments"}</p>
        <p className="display max-w-full truncate text-[clamp(17px,6cqw,24px)] leading-tight italic">{name || "Your holdings"}</p>
        <p className="figure max-w-full truncate text-[clamp(24px,10cqw,38px)] leading-none">{inr(balance)}</p>
        <div className="flex w-full items-center gap-3">
          <span aria-hidden className="h-px flex-1 bg-[#a98a4c]/60" />
          <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[#a98a4c] bg-[radial-gradient(circle_at_35%_30%,#f7e2ac,#c9a255)] text-xs font-bold text-[#5c4716]">
            ₹
          </span>
          <span aria-hidden className="h-px flex-1 bg-[#a98a4c]/60" />
        </div>
      </div>
    </div>
  );
}

const ART = {
  card: CreditCard,
  cash: RupeeNotes,
  wallet: Wallet,
  bank: BankCheque,
  investment: ShareCertificate,
} as const;

export function AccountArt(props: AccountArtProps) {
  const Art = ART[props.kind];
  const summary = `${ACCOUNT_KIND_LABEL[props.kind]}, ${props.name || "unnamed"}, ${inr(props.balance)}`;
  return (
    // A size container, so the type inside scales with the art rather than the screen.
    <div role="img" aria-label={summary} className="[container-type:inline-size]">
      <Art {...props} />
    </div>
  );
}

// What the art should show for the values currently typed into the account form.
export function accountArtFromForm(values: Record<string, unknown>): AccountArtProps {
  const kind = (values.kind || "bank") as Account["kind"];
  const number = (value: unknown) => Number(value) || 0;
  return {
    kind,
    name: String(values.name ?? ""),
    bank: String(values.bank_name ?? ""),
    lastFour: String(values.last_four ?? ""),
    balance: number(kind === "card" ? values.card_used : values.balance),
    limit: number(values.credit_limit) || null,
  };
}
