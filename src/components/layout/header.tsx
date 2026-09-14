"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Boxes } from "lucide-react";

import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SearchBar } from "@/components/products/search-bar";
import { AccountMenu } from "@/components/layout/account-menu";
import { cn } from "@/lib/utils";

/**
 * Fixed top header: 75px tall, white/soft-shadow, three-zone layout
 * (nav — logo — search + actions) so the logo stays visually centered
 * regardless of how wide the nav or search area end up being.
 */
export function Header() {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.03)]",
      )}
      style={{ height: siteConfig.headerHeight }}
    >
      <div className="mx-auto grid h-full max-w-[1920px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 lg:px-10">
        {/* Left zone: primary navigation. Hidden below `md` — at phone
            widths there isn't room for three nav labels plus the centered
            logo and the action icons; the same links live in the footer,
            so nothing is unreachable on mobile. */}
        <nav className="hidden items-center gap-7 md:flex">
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

        {/* Center zone: logo */}
        <Link href="/" className="flex items-center gap-2 justify-self-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Boxes className="h-4 w-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {siteConfig.shortName.toLowerCase()}
          </span>
        </Link>

        {/* Right zone: search + actions */}
        <div className="flex items-center justify-end gap-4">
          <div className="hidden w-full max-w-md md:block lg:max-w-lg">
            <SearchBar />
          </div>
          <AccountMenu />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
