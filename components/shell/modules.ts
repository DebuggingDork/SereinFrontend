import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  CreditCard,
  Droplets,
  Dumbbell,
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
  key: "finance" | "planner" | "health" | "diary";
  label: string;
  href: string;
  color: string;
  // The one thing people most often come here to add.
  quickAdd: { label: string; title: string; href: string };
  items: NavItem[];
}

// Each module's colour, in the shades that stay readable as text in both themes.
export const MODULE_ACCENT: Record<ModuleDef["key"], string> = {
  finance: "var(--good)",
  planner: "var(--planner)",
  health: "var(--warn)",
  diary: "var(--diary)",
};

export const MODULES: ModuleDef[] = [
  {
    key: "finance",
    label: "Finance",
    href: "/finance",
    color: "var(--finance)",
    quickAdd: { label: "Transaction", title: "Add a transaction", href: "/finance/transactions?new=1" },
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
    quickAdd: { label: "Task", title: "Add a task", href: "/planner/tasks?new=1" },
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
    key: "health",
    label: "Health",
    href: "/health",
    color: "var(--health)",
    quickAdd: { label: "Meal", title: "Log a meal", href: "/health/log?new=1" },
    items: [
      { label: "Today", href: "/health", icon: Sun },
      { label: "Plan", href: "/health/plan", icon: ClipboardList },
      { label: "Workouts", href: "/health/workouts", icon: Dumbbell },
      { label: "Progress", href: "/health/weight", icon: Scale },
      { label: "Meal Log", href: "/health/log", icon: Utensils },
      { label: "Foods", href: "/health/foods", icon: Apple },
      { label: "Meal Plans", href: "/health/plans", icon: UtensilsCrossed },
      { label: "Water", href: "/health/water", icon: Droplets },
      { label: "Targets", href: "/health/targets", icon: Target },
      { label: "Charts", href: "/health/charts", icon: BarChart3 },
      { label: "Settings", href: "/health/settings", icon: Settings },
    ],
  },
  {
    key: "diary",
    label: "Diary",
    href: "/diary",
    color: "var(--diary)",
    quickAdd: { label: "Entry", title: "Write a new diary entry", href: "/diary?new=1" },
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

