"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "./modal";

export function RowActions({
  onEdit,
  onDuplicate,
  onDelete,
  deleteTitle = "Delete this?",
  deleteBody = "This cannot be undone.",
}: {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  deleteTitle?: string;
  deleteBody?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const buttonClass = "pressable cursor-pointer rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink";
  return (
    <span className="flex shrink-0 items-center">
      {onEdit && (
        <button type="button" aria-label="Edit" onClick={onEdit} className={buttonClass}>
          <Pencil size={14} aria-hidden />
        </button>
      )}
      {onDuplicate && (
        <button type="button" aria-label="Duplicate" onClick={onDuplicate} className={buttonClass}>
          <Copy size={14} aria-hidden />
        </button>
      )}
      {onDelete && (
        <button type="button" aria-label="Delete" onClick={() => setConfirming(true)} className={buttonClass}>
          <Trash2 size={14} aria-hidden />
        </button>
      )}
      {confirming && onDelete && (
        <ConfirmModal
          title={deleteTitle}
          body={deleteBody}
          onConfirm={onDelete}
          onClose={() => setConfirming(false)}
        />
      )}
    </span>
  );
}
