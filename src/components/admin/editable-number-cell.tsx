"use client";

import * as React from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { ActionResult } from "@/actions/product-actions";

/**
 * Click-to-edit number cell used for Precio/Stock in the admin product
 * table — saves on blur/Enter without opening the full edit form. Kept as
 * its own small component (rather than inlined per cell) so the desktop
 * table and the mobile cards can share the exact same edit/save/cancel
 * behavior.
 */
export function EditableNumberCell({
  value,
  onSave,
  onSaved,
  format,
  step = 1,
  min = 0,
  className,
  inputClassName,
  ariaLabel,
}: {
  value: number;
  onSave: (value: number) => Promise<ActionResult>;
  /** Called after a successful save — the caller re-fetches/refreshes. */
  onSaved: (value: number) => void;
  format: (value: number) => string;
  step?: number;
  min?: number;
  className?: string;
  inputClassName?: string;
  ariaLabel: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(String(value));
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const startEdit = () => {
    if (saving) return;
    setDraft(String(value));
    setEditing(true);
  };

  const cancel = () => {
    setDraft(String(value));
    setEditing(false);
  };

  const save = async () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < min) {
      toast.error("Valor inválido.");
      cancel();
      return;
    }
    if (parsed === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const result = await onSave(parsed);
    setSaving(false);
    if (!result.success) {
      toast.error(result.message);
      cancel();
      return;
    }
    setEditing(false);
    onSaved(parsed);
  };

  React.useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step={step}
        min={min}
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
          "h-8 w-24 rounded-md border border-primary bg-background px-2 text-sm outline-none",
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
      {format(value)}
    </button>
  );
}
