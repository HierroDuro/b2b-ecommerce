"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Check, X, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createCategory, updateCategory, deleteCategory } from "@/actions/category-actions";
import { formatCurrency, cn } from "@/lib/utils";
import type { CategoryDTO, ProductDTO } from "@/types/product";

export function CategoryManager({
  categories,
  products,
}: {
  categories: CategoryDTO[];
  products: ProductDTO[];
}) {
  const router = useRouter();
  const [newName, setNewName] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<CategoryDTO | null>(null);
  // Which category's product list is expanded — one at a time, an
  // accordion rather than a set, since opening several at once on a
  // catalog this size would just turn the page into the products table.
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const result = await createCategory(newName);
    setCreating(false);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    setNewName("");
    router.refresh();
  };

  const startEdit = (category: CategoryDTO) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const saveEdit = async (id: string) => {
    const result = await updateCategory(id, editingName);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    setEditingId(null);
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.refresh();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Nombre de la nueva categoría"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button onClick={handleCreate} disabled={creating} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {categories.map((category) => {
          const isExpanded = expandedId === category.id;
          const categoryProducts = products.filter((p) => p.category.id === category.id);

          return (
            <li key={category.id}>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                {editingId === category.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => saveEdit(category.id)}>
                        <Check className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : category.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      aria-expanded={isExpanded}
                      aria-label={
                        isExpanded
                          ? `Ocultar productos de ${category.name}`
                          : `Ver productos de ${category.name}`
                      }
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                      <span className="text-sm font-medium text-foreground">{category.name}</span>
                      {typeof category.productCount === "number" && (
                        <Badge variant="secondary">{category.productCount} productos</Badge>
                      )}
                    </button>
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {isExpanded && (
                <div className="border-t border-border bg-muted/30 px-4 py-3">
                  {categoryProducts.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">
                      Todavía no hay productos en esta categoría.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {categoryProducts.map((product) => (
                        <li key={product.id}>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-background"
                          >
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-white">
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                sizes="40px"
                                className="object-contain p-1"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-sm font-medium text-foreground">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(product.price)} · Stock: {product.stock}
                                {!product.isActive && " · Inactivo"}
                              </p>
                            </div>
                            <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar &quot;{deleteTarget?.name}&quot;? Si tiene productos
              asociados, no se podrá eliminar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
