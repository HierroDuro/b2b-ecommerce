"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useProductFilters } from "@/components/products/product-filters-context";
import { cn } from "@/lib/utils";

/**
 * Large search input in the header. Local `draft` state keeps the input
 * feeling instant while typing; the shared filter context only updates
 * the (debounced, in the parent hook that reads it) global search term —
 * see `useProducts`, which debounces before hitting the API.
 */
export function SearchBar({ className }: { className?: string }) {
  const { filters, setSearch } = useProductFilters();
  const [draft, setDraft] = React.useState(filters.search);

  React.useEffect(() => {
    setSearch(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className={cn("group relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        className={cn(
          "h-11 rounded-full border-border/80 bg-muted/40 pl-9 pr-9 text-sm",
          "transition-all duration-200 focus-visible:border-primary/40 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/10",
          // type="search" gets its own native clear button in Chrome/Edge,
          // which stacked right next to the custom one below — hide it so
          // there's only ever the one X.
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden",
        )}
      />
      {draft.length > 0 && (
        <button
          type="button"
          onClick={() => setDraft("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
