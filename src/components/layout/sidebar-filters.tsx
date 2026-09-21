"use client";

import { motion } from "framer-motion";

import { FilterPanelContent } from "@/components/products/filter-panel-content";
import type { CategoryDTO } from "@/types/product";

/**
 * Desktop-only sticky sidebar (stays pinned under the header while the
 * product grid scrolls). Hidden below `lg`; small screens get the same
 * filters via `MobileFiltersDialog` instead.
 */
export function SidebarFilters({ categories }: { categories: CategoryDTO[] }) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="sticky hidden w-full max-w-[260px] shrink-0 self-start lg:block"
      style={{ top: "calc(var(--header-h) + 24px)" }}
    >
      <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
        <FilterPanelContent categories={categories} />
      </div>
    </motion.aside>
  );
}
