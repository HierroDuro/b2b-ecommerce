"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Pencil, Trash2, Search, X, SearchX } from "lucide-react";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { deleteProduct, getProductConversationCount, toggleProductFlag } from "@/actions/product-actions";
import { formatCurrency } from "@/lib/utils";
import { fuzzyScore, productSearchText } from "@/lib/fuzzy-search";
import type { ProductDTO } from "@/types/product";

export function ProductTable({ products }: { products: ProductDTO[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ProductDTO | null>(null);
  const [deleteConversationCount, setDeleteConversationCount] = React.useState(0);
  const [search, setSearch] = React.useState("");

  // Same typo-tolerant matching as the public catalog (see lib/fuzzy-search)
  // — the whole admin catalog is already loaded client-side, so filtering
  // here is a plain in-memory scan, no extra request needed.
  const visibleProducts = React.useMemo(() => {
    if (!search.trim()) return products;
    return products
      .map((p) => ({ product: p, score: fuzzyScore(search, productSearchText(p)) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.product);
  }, [products, search]);

  const handleToggle = async (
    product: ProductDTO,
    flag: "isFeatured" | "isActive" | "isOnSale",
    value: boolean,
  ) => {
    setPendingId(product.id);
    const result = await toggleProductFlag(product.id, flag, value);
    setPendingId(null);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    router.refresh();
  };

  // Asked fresh at click time (not baked into the page props) so the
  // warning's number is always the real, current one.
  const requestDelete = async (product: ProductDTO) => {
    setDeleteConversationCount(0);
    setDeleteTarget(product);
    try {
      setDeleteConversationCount(await getProductConversationCount(product.id));
    } catch {
      // Count is only for the warning — the delete itself re-checks
      // server-side and refuses without confirmation if chats exist.
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteProduct(deleteTarget.id, {
      deleteConversations: deleteConversationCount > 0,
    });
    setDeleteTarget(null);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.refresh();
  };

  return (
    <>
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, SKU o marca..."
          aria-label="Buscar productos"
          className="pl-9 pr-9"
        />
        {search.length > 0 && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {search.trim() && (
        <p className="mb-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{visibleProducts.length}</span>{" "}
          resultado{visibleProducts.length === 1 ? "" : "s"} para &quot;{search}&quot;
        </p>
      )}

      {visibleProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <SearchX className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No encontramos productos</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Probá con otro nombre, SKU o marca.
          </p>
        </div>
      ) : (
        <>
      {/* Desktop: full table. */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Destacado</TableHead>
              <TableHead>Oferta</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted/40">
                      <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-1" />
                    </div>
                    <span className="line-clamp-1 max-w-[220px] text-sm font-medium">
                      {product.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{product.sku}</TableCell>
                <TableCell>
                  <Badge variant="outline">{product.category.name}</Badge>
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {formatCurrency(product.price)}
                </TableCell>
                <TableCell>
                  <span className={product.stock === 0 ? "text-destructive font-medium" : ""}>
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={product.isFeatured}
                    disabled={pendingId === product.id}
                    onCheckedChange={(checked) => handleToggle(product, "isFeatured", checked)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={product.isOnSale}
                    disabled={pendingId === product.id}
                    onCheckedChange={(checked) => handleToggle(product, "isOnSale", checked)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={product.isActive}
                    disabled={pendingId === product.id}
                    onCheckedChange={(checked) => handleToggle(product, "isActive", checked)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => requestDelete(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: one card per product — every control is a full-width tap
          target, nothing requires scrolling sideways to reach. */}
      <div className="space-y-3 md:hidden">
        {visibleProducts.map((product) => (
          <div key={product.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted/40">
                <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-1" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.sku}</p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {product.category.name}
              </Badge>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(product.price)}
              </span>
              <span
                className={
                  product.stock === 0
                    ? "text-sm font-medium text-destructive"
                    : "text-sm text-muted-foreground"
                }
              >
                Stock: {product.stock}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`featured-${product.id}`} className="cursor-pointer text-xs">
                  Destacado
                </Label>
                <Switch
                  id={`featured-${product.id}`}
                  checked={product.isFeatured}
                  disabled={pendingId === product.id}
                  onCheckedChange={(checked) => handleToggle(product, "isFeatured", checked)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`onsale-${product.id}`} className="cursor-pointer text-xs">
                  Oferta
                </Label>
                <Switch
                  id={`onsale-${product.id}`}
                  checked={product.isOnSale}
                  disabled={pendingId === product.id}
                  onCheckedChange={(checked) => handleToggle(product, "isOnSale", checked)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`active-${product.id}`} className="cursor-pointer text-xs">
                  Activo
                </Label>
                <Switch
                  id={`active-${product.id}`}
                  checked={product.isActive}
                  disabled={pendingId === product.id}
                  onCheckedChange={(checked) => handleToggle(product, "isActive", checked)}
                />
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" asChild>
                <Link href={`/admin/products/${product.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 text-destructive hover:text-destructive"
                onClick={() => requestDelete(product)}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>
        </>
      )}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar &quot;{deleteTarget?.name}&quot;? Esta acción no se puede
              deshacer.
            </DialogDescription>
            {deleteConversationCount > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Este producto tiene{" "}
                <strong>
                  {deleteConversationCount} consulta{deleteConversationCount === 1 ? "" : "s"}
                </strong>
                . Si lo eliminás, también se {deleteConversationCount === 1 ? "borrará" : "borrarán"}{" "}
                {deleteConversationCount === 1 ? "esa consulta" : "esas consultas"} con todos sus
                mensajes.
              </div>
            )}
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
    </>
  );
}
