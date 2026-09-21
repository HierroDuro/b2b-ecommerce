"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Dark mode toggle for the header. Renders nothing meaningful until
 * mounted client-side (theme is unknown during SSR) to avoid hydration
 * mismatches, per next-themes' documented pattern.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const toggle = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambiar modo oscuro"
      onClick={toggle}
      className={cn("relative rounded-full text-muted-foreground hover:text-foreground", className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {mounted && resolvedTheme === "dark" ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            <Moon className="h-[18px] w-[18px]" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            <Sun className="h-[18px] w-[18px]" />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
