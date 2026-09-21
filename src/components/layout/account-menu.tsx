"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, LogOut, MessageCircle, User, UserPlus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getCustomerUnreadTotal } from "@/actions/chat-actions";

/** Shared session state for both header variants. */
function useCustomerAccount() {
  const { data: session, status } = useSession();
  const isCustomer = status === "authenticated" && session?.user?.userType === "customer";

  const { data: unread } = useQuery({
    queryKey: ["customer-unread-total"],
    queryFn: () => getCustomerUnreadTotal(),
    enabled: isCustomer,
    refetchInterval: 10_000,
  });

  const fullName = session?.user?.name?.trim() ?? "";
  return {
    loading: status === "loading",
    isCustomer,
    fullName,
    firstName: fullName.split(/\s+/)[0] || "cliente",
    email: session?.user?.email ?? "",
    unread: Number(unread ?? 0),
  };
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
      {count}
    </span>
  );
}

function AccountMenuItems({ unread }: { unread: number }) {
  return (
    <>
      <DropdownMenuItem asChild>
        <Link href="/consultas" className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Mis consultas
          </span>
          <UnreadBadge count={unread} />
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => void signOut({ callbackUrl: "/" })}>
        <span className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </span>
      </DropdownMenuItem>
    </>
  );
}

/**
 * Tablet/desktop: a visible strip in the header's top-right corner (above
 * the search bar, where the header has free space). Logged out it offers
 * "Creá tu cuenta" / "Ingresá"; logged in it says so explicitly ("Sesión
 * iniciada · Hola, <nombre>") with the account menu behind it.
 */
export function AccountBar() {
  const { loading, isCustomer, firstName, fullName, email, unread } = useCustomerAccount();

  // Reserve the space while the session loads, so a logged-in visitor
  // doesn't see "Ingresá" flash before it flips.
  if (loading) return <div className="absolute right-6 top-2 hidden h-7 md:block lg:right-10" />;

  if (!isCustomer) {
    return (
      <div className="absolute right-6 top-2 hidden items-center gap-1 text-xs md:flex lg:right-10">
        <Link
          href="/cuenta/registro"
          className="rounded-full px-3 py-1.5 font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        >
          Creá tu cuenta
        </Link>
        <Link
          href="/cuenta/ingresar"
          className="rounded-full bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ingresá
        </Link>
      </div>
    );
  }

  return (
    <div className="absolute right-6 top-2 hidden items-center gap-2 md:flex lg:right-10">
      {/* Always visible (not buried in the menu): the inbox is a main action. */}
      <Link
        href="/consultas"
        aria-label="Mis consultas"
        className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Mis consultas</span>
        {unread > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unread}
          </span>
        )}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Menú de tu cuenta"
            className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:bg-muted"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="hidden text-muted-foreground lg:inline">Sesión iniciada</span>
            <span className="font-semibold text-foreground">Hola, {firstName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-semibold text-foreground">{fullName || firstName}</p>
            {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <AccountMenuItems unread={unread} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Phone: the header's right gutter is only ~44px wide, so there's no room
 * for text buttons — a single icon opens the same options. Logged in, the
 * icon becomes the customer's initial with a green "online" dot.
 */
export function AccountMenu() {
  const { loading, isCustomer, firstName, fullName, email, unread } = useCustomerAccount();

  if (loading) return <div className="h-9 w-9 md:hidden" />;

  if (!isCustomer) {
    return (
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Ingresá o creá tu cuenta"
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              <User className="h-[18px] w-[18px]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem asChild>
              <Link href="/cuenta/ingresar" className="flex items-center gap-2 font-semibold">
                <User className="h-4 w-4" />
                Ingresá
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/cuenta/registro" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Creá tu cuenta
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5 md:hidden">
      <Link
        href="/consultas"
        aria-label="Mis consultas"
        className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <MessageCircle className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1">
            <UnreadBadge count={unread} />
          </span>
        )}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Menú de tu cuenta"
            className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary"
          >
            {firstName.charAt(0)}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Sesión iniciada
            </p>
            <p className="text-sm font-semibold text-foreground">Hola, {firstName}</p>
            {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
            {!email && fullName && <p className="truncate text-xs text-muted-foreground">{fullName}</p>}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <AccountMenuItems unread={unread} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
