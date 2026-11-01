import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";

const COLUMNS = [
  {
    title: "Get started",
    links: [
      { label: "Create an account", href: "/signup" },
      { label: "Log in", href: "/login" },
    ],
  },
  {
    title: "Money",
    links: [
      { label: "Transactions", href: "/finance/transactions" },
      { label: "Budgets", href: "/finance/budgets" },
      { label: "Net worth", href: "/finance/net-worth" },
    ],
  },
  {
    title: "Also inside",
    links: [
      { label: "Planner", href: "/planner" },
      { label: "Diet", href: "/diet" },
      { label: "Diary", href: "/diary" },
    ],
  },
];

export function LandingFooter() {
  return (
    <HalftoneWordmarkFooter
      wordmark="serein"
      label="Serein"
      meta="© 2026 · No bank logins, no card numbers"
      columns={COLUMNS}
      palette={{ warm: "#10b981" }}
      monoFamily="var(--font-jetbrains), ui-monospace, monospace"
      // The links take a fixed height and the word grows with the width, so the two stay close.
      className="!h-[calc(300px+18vw)] min-[721px]:!h-[calc(195px+18vw)]"
    />
  );
}
