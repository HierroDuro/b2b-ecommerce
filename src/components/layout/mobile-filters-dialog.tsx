"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FilterPanelContent } from "@/components/products/filter-panel-content";
import { useProductFilters } from "@/components/products/product-filters-context";
import type { BrandOptionDTO, CategoryDTO } from "@/types/product";

/** Filters entry point for < lg screens, where the sticky sidebar is hidden. */
export function MobileFiltersDialog({
  categories,
  brands,
}: {
  categories: CategoryDTO[];
  brands: BrandOptionDTO[];
}) {
  const [open, setOpen] = React.useState(false);
  const { activeFilterCount } = useProductFilters();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 lg:hidden">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Filtros</DialogTitle>
        </DialogHeader>
        <FilterPanelContent categories={categories} brands={brands} />
      </DialogContent>
    </Dialog>
  );
}
