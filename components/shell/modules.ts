import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCheck,
  CreditCard,
  Droplets,
  Flag,
  Hourglass,
  LayoutGrid,
  ListChecks,
  type LucideIcon,
  NotebookPen,
  PiggyBank,
  ReceiptText,
  Repeat,
  Scale,
  Search,
  Settings,
  Smile,
  Sun,
  Target,
  TrendingUp,
  Users,
  Utensils,
  UtensilsCrossed,
  Apple,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface ModuleDef {
  key: "finance" | "planner" | "diet" | "diary";
  label: string;
  href: string;
  color: string;
  items: NavItem[];
}

export const MODULES: ModuleDef[] = [
  {
    key: "finance",
    label: "Finance",
    href: "/finance",
    color: "var(--finance)",
    items: [
      { label: "Overview", href: "/finance", icon: LayoutGrid },
      { label: "Transactions", href: "/finance/transactions", icon: ReceiptText },
      { label: "Accounts and Cards", href: "/finance/accounts", icon: CreditCard },
      { label: "Calendar", href: "/finance/calendar", icon: CalendarDays },
      { label: "Budgets", href: "/finance/budgets", icon: PiggyBank },
      { label: "Scheduled and Subscriptions", href: "/finance/scheduled", icon: Repeat },
      { label: "Debts and Credits", href: "/finance/debts", icon: Users },
      { label: "Goals", href: "/finance/goals", icon: Flag },
      { label: "Net Worth", href: "/finance/net-worth", icon: TrendingUp },
      { label: "Charts", href: "/finance/charts", icon: BarChart3 },
      { label: "Settings", href: "/finance/settings", icon: Settings },
    ],
  },
  {
    key: "planner",
    label: "Planner",
    href: "/planner",
    color: "var(--planner)",
    items: [
      { label: "Today", href: "/planner", icon: Sun },
      { label: "All Tasks", href: "/planner/tasks", icon: ListChecks },
      { label: "Deadlines", href: "/planner/deadlines", icon: Hourglass },
      { label: "Calendar", href: "/planner/calendar", icon: CalendarDays },
      { label: "Completed", href: "/planner/completed", icon: CheckCheck },
      { label: "Charts", href: "/planner/charts", icon: BarChart3 },
      { label: "Settings", href: "/planner/settings", icon: Settings },
    ],
  },
  {
    key: "diet",
    label: "Diet",
    href: "/health",
    color: "var(--diet)",
    items: [
      { label: "Today", href: "/health", icon: Sun },
      { label: "Meal Log", href: "/health/log", icon: Utensils },
      { label: "Meal Plans", href: "/health/plans", icon: UtensilsCrossed },
      { label: "Targets", href: "/health/targets", icon: Target },
      { label: "Water", href: "/health/water", icon: Droplets },
      { label: "Weight", href: "/health/weight", icon: Scale },
      { label: "Foods", href: "/health/foods", icon: Apple },
      { label: "Charts", href: "/health/charts", icon: BarChart3 },
      { label: "Settings", href: "/health/settings", icon: Settings },
    ],
  },
  {
    key: "diary",
    label: "Diary",
    href: "/diary",
    color: "var(--diary)",
    items: [
      { label: "Write", href: "/diary", icon: NotebookPen },
      { label: "Entries", href: "/diary/entries", icon: BookOpen },
      { label: "Calendar", href: "/diary/calendar", icon: CalendarDays },
      { label: "Moods", href: "/diary/moods", icon: Smile },
      { label: "Search", href: "/diary/search", icon: Search },
      { label: "Settings", href: "/diary/settings", icon: Settings },
    ],
  },
];

