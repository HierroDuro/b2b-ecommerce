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
      {/* With enough categories the panel can end up taller than the
          viewport. A `sticky` element that tall gets pinned by its top
          edge with nowhere left to "unstick" to, so plain page scroll
          could never reach its lower categories — scrolling the mouse
          wheel over it did nothing once stuck. Capping its own height and
          scrolling *inside* the card (instead of relying on page scroll)
          keeps every category reachable regardless of screen size. */}
      <div
        className="overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-soft"
        style={{ maxHeight: "calc(100vh - var(--header-h) - 48px)" }}
      >
        <FilterPanelContent categories={categories} />
      </div>
    </motion.aside>
  );
}
