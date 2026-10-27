import type { FieldDef } from "@/components/ui/entity-form";

export const ACCOUNT_KIND_LABEL = {
  bank: "Bank",
  wallet: "Wallet",
  cash: "Cash",
  card: "Credit card",
  investment: "Investment",
} as const;

const isCard = (values: Record<string, unknown>) => values.kind === "card";

const LAST_FOUR: Pick<FieldDef, "pattern" | "patternMessage" | "maxLength" | "inputMode"> = {
  maxLength: 4,
  inputMode: "numeric",
  pattern: /^[0-9]{4}$/,
  patternMessage: "Exactly four digits, and only ever the last four.",
};

export const ACCOUNT_FIELDS: FieldDef[] = [
  {
    name: "kind",
    label: "Type",
    type: "select",
    required: true,
    half: true,
    options: Object.entries(ACCOUNT_KIND_LABEL).map(([value, label]) => ({ value, label })),
  },
  { name: "name", label: "Nickname", required: true, half: true, maxLength: 60, placeholder: "Salary account" },
  { name: "bank_name", label: "Bank or provider", half: true, maxLength: 60, placeholder: "HDFC" },
  { name: "last_four", label: "Last four digits", half: true, placeholder: "4092", ...LAST_FOUR },
  { name: "balance", label: "Balance today", type: "number", required: true, half: true, when: (v) => !isCard(v) },
  { name: "credit_limit", label: "Credit limit", type: "number", min: 0, half: true, when: isCard },
  { name: "card_used", label: "Amount used", type: "number", min: 0, required: true, half: true, when: isCard },
  { name: "statement_day", label: "Statement day", type: "number", min: 1, max: 31, half: true, when: isCard },
  { name: "due_day", label: "Due day", type: "number", min: 1, max: 31, half: true, when: isCard },
];

// A card's balance column holds the amount used, so the form's two fields share it.
export function accountPayload(values: Record<string, unknown>) {
  const { card_used, ...rest } = values;
  return { ...rest, balance: values.kind === "card" ? card_used : values.balance };
}
