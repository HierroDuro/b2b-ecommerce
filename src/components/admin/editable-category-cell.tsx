"use client";

import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/actions/product-actions";

/**
 * Click-to-edit category cell — same reveal/save pattern as
 * `EditableNumberCell`/`EditableTextCell`, but the "editor" is a `<Select>`
 * instead of an `<input>`: picking an option *is* the commit, so there's
 * no separate blur/Enter step. `defaultOpen` pops it open the moment it
 * mounts, so one click both reveals and opens the dropdown.
 */
export function EditableCategoryCell({
  categoryId,
  categoryName,
  categories,
  onSave,
  onSaved,
  ariaLabel,
}: {
  categoryId: string;
  categoryName: string;
  categories: { id: string; name: string }[];
  onSave: (categoryId: string) => Promise<ActionResult>;
  /** Called after a successful save — the caller re-fetches/refreshes. */
  onSaved: (categoryId: string, categoryName: string) => void;
  ariaLabel: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const handleChange = async (newCategoryId: string) => {
    setEditing(false);
    if (newCategoryId === categoryId) return;
    setSaving(true);
    const result = await onSave(newCategoryId);
    setSaving(false);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    const newCategory = categories.find((c) => c.id === newCategoryId);
    onSaved(newCategoryId, newCategory?.name ?? categoryName);
  };

  if (editing) {
    return (
      <Select
        defaultOpen
        value={categoryId}
        onValueChange={handleChange}
        onOpenChange={(open) => {
          if (!open) setEditing(false);
        }}
      >
        <SelectTrigger
          className="h-8 w-auto min-w-[10rem] text-sm"
          onClick={(e) => e.stopPropagation()}
          aria-label={ariaLabel}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!saving) setEditing(true);
      }}
      disabled={saving}
      aria-label={`Editar ${ariaLabel}`}
      className={cn("rounded-md transition-opacity", saving && "opacity-50")}
    >
      <Badge variant="outline">{categoryName}</Badge>
    </button>
  );
}
