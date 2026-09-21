"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SearchBar } from "@/components/products/search-bar";
import { AccountBar, AccountMenu } from "@/components/layout/account-menu";
import { SiteLogo } from "@/components/layout/site-logo";
import { cn } from "@/lib/utils";

/**
 * Fixed top header, height driven by the --header-h CSS variable (see
 * globals.css) — tall on purpose so the logo can be large and legible.
 * Three-zone grid (nav — logo — search + actions) with the logo always in
 * the true center. Below lg the left zone is empty and, on phones, the
 * action icons stack vertically in the narrow right gutter so the big
 * centered logo still fits.
 */
export function Header() {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.03)]",
      )}
      style={{ height: "var(--header-h)" }}
    >
      <div className="relative mx-auto grid h-full max-w-[1920px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 md:gap-4 md:px-6 lg:px-10">
        {/* Left zone: primary navigation. Only from lg up — below that the
            big centered logo leaves no room for it; the same links live in
            the footer. The wrapper div stays in the grid so the logo keeps
            its centered column either way. */}
        <div>
          <nav className="hidden items-center gap-7 lg:flex">
            {siteConfig.nav.map((item, index) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                {item.label}
                {index === 0 && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
              </Link>
            ))}
          </nav>
        </div>

        {/* Center zone: logo */}
        <Link href="/" aria-label="Inicio" className="justify-self-center">
          <SiteLogo priority />
        </Link>

        {/* Tablet/desktop account strip, pinned to the top-right corner (it
            floats above the search bar, so it costs no extra header height). */}
        <AccountBar />

        {/* Right zone: search + actions */}
        <div className="flex min-w-0 flex-col items-end justify-center gap-0.5 md:flex-row md:items-center md:justify-end md:gap-2 lg:gap-4">
          <div className="hidden min-w-0 w-full max-w-md md:block lg:max-w-lg">
            <SearchBar />
          </div>
          <AccountMenu />
          <ThemeToggle className="h-8 w-8 md:h-10 md:w-10" />
        </div>
      </div>
    </header>
  );
}
