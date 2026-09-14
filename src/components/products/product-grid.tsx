"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, List as ListIcon, SearchX } from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import { ProductListItem } from "@/components/products/product-list-item";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductFilters } from "@/components/products/product-filters-context";
import { useProducts } from "@/hooks/use-products";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

export function ProductGrid() {
  const { filters } = useProductFilters();
  const { data, isLoading, isError } = useProducts(filters);
  const [view, setView] = React.useState<ViewMode>("grid");

  return (
    <div className="flex-1">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            "Buscando productos..."
          ) : (
            <>
              <span className="font-medium text-foreground">{data?.total ?? 0}</span> productos
              encontrados
            </>
          )}
        </p>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label="Ver como grilla"
            aria-pressed={view === "grid"}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              view === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-label="Ver como lista"
            aria-pressed={view === "list"}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">
          Ocurrió un error al cargar los productos. Probá de nuevo en unos segundos.
        </div>
      )}

      {isLoading && !data && <ProductGridSkeleton view={view} />}

      {data && data.products.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <SearchX className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No encontramos productos</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Probá ajustar los filtros o buscar con otras palabras clave.
          </p>
        </div>
      )}

      {data && data.products.length > 0 && (
        <AnimatePresence mode="wait">
          {view === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4"
            >
              {data.products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              {data.products.map((product, i) => (
                <ProductListItem key={product.id} product={product} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function ProductGridSkeleton({ view }: { view: ViewMode }) {
  const items = Array.from({ length: 8 });
  if (view === "list") {
    return (
      <div className="flex flex-col gap-3">
        {items.map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {items.map((_, i) => (
        <Skeleton key={i} className="aspect-[3/4.2] w-full rounded-xl" />
      ))}
    </div>
  );
}
