"use client";

import * as React from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { ActionResult } from "@/actions/product-actions";

/**
 * Click-to-edit text cell — the SKU counterpart of `EditableNumberCell`
 * (see that file for the click/save/cancel pattern both share). Kept as
 * its own component rather than generalizing the two into one because the
 * number cell's numeric coercion and min/step handling don't apply here.
 */
export function EditableTextCell({
  value,
  onSave,
  onSaved,
  className,
  inputClassName,
  ariaLabel,
}: {
  value: string;
  onSave: (value: string) => Promise<ActionResult>;
  /** Called after a successful save — the caller re-fetches/refreshes. */
  onSaved: (value: string) => void;
  className?: string;
  inputClassName?: string;
  ariaLabel: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const startEdit = () => {
    if (saving) return;
    setDraft(value);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error("No puede quedar vacío.");
      cancel();
      return;
    }
    if (trimmed === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const result = await onSave(trimmed);
    setSaving(false);
    if (!result.success) {
      toast.error(result.message);
      cancel();
      return;
    }
    setEditing(false);
    onSaved(trimmed);
  };

  React.useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        disabled={saving}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "h-8 w-full min-w-[8rem] rounded-md border border-primary bg-background px-2 text-sm outline-none",
          inputClassName,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        startEdit();
      }}
      aria-label={`Editar ${ariaLabel}`}
      className={cn(
        "rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted/60",
        saving && "opacity-50",
        className,
      )}
    >
      {value}
    </button>
  );
}
