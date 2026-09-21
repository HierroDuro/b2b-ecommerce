"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  MessageCircle,
  LogOut,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAdminUnreadTotal } from "@/actions/chat-actions";
import { SiteLogo } from "@/components/layout/site-logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/categories", label: "Categorías", icon: FolderTree },
  { href: "/admin/consultas", label: "Consultas", icon: MessageCircle },
];

function NavLinks({ unread, onNavigate }: { unread: number | undefined; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-4">
      {links.map((link) => {
        const active =
          link.href === "/admin" ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
            {link.href === "/admin/consultas" && Boolean(unread) && unread! > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground">
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SignOutButton() {
  return (
    <div className="border-t border-border p-4">
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </Button>
    </div>
  );
}

export function AdminNav({ username }: { username: string }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const { data: unread } = useQuery({
    queryKey: ["admin-unread-total"],
    queryFn: () => getAdminUnreadTotal(),
    refetchInterval: 10_000,
  });

  return (
    <>
      {/* Desktop: fixed sidebar. */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border px-6 py-5">
          <p className="text-sm font-semibold text-foreground">Panel de administración</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Sesión: {username}</p>
        </div>
        <NavLinks unread={unread} />
        <SignOutButton />
      </aside>

      {/* Mobile: top bar with a hamburger menu instead of the fixed sidebar. */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <SiteLogo className="h-7 sm:h-7" />
          <span className="text-sm font-semibold text-foreground">Panel de administración</span>
        </div>
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="relative" aria-label="Abrir menú">
              <Menu className="h-4 w-4" />
              {Boolean(unread) && unread! > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {unread}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0">
            <DialogHeader className="border-b border-border p-4 text-left">
              <DialogTitle>Panel de administración</DialogTitle>
              <p className="text-xs text-muted-foreground">Sesión: {username}</p>
            </DialogHeader>
            <NavLinks unread={unread} onNavigate={() => setMobileOpen(false)} />
            <SignOutButton />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
