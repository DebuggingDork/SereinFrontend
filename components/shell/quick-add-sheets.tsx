"use client";

import { TransactionForm } from "@/components/finance/transaction-form";
import { MealForm } from "@/components/health/shared";
import { TaskForm } from "@/components/planner/tasks";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useSave } from "@/lib/data";
import type { ModuleDef } from "./modules";

function TransactionSheet({ onClose }: { onClose: () => void }) {
  const save = useSave("transactions", { alsoInvalidate: ["accounts"] });
  const { toast } = useToast();
  return (
    <Modal title="New entry" onClose={onClose}>
      <TransactionForm
        initial={{}}
        onCancel={onClose}
        onSubmit={async (values, mode) => {
          await save.mutateAsync(values);
          toast("Saved");
          if (mode === "primary") onClose();
        }}
      />
    </Modal>
  );
}

// The form for a module's quick add, opened over whichever page is showing.
export default function QuickAddSheet({ moduleKey, onClose }: { moduleKey: ModuleDef["key"]; onClose: () => void }) {
  if (moduleKey === "finance") return <TransactionSheet onClose={onClose} />;
  if (moduleKey === "planner") return <TaskForm task={{}} onClose={onClose} />;
  if (moduleKey === "health") return <MealForm meal={{}} onClose={onClose} />;
  return null;
}
