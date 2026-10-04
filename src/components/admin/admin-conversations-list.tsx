"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { ConversationStatus } from "@prisma/client";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConversationRow } from "@/components/chat/conversation-row";
import { getAdminConversations, type AdminConversationFilters } from "@/actions/chat-actions";
import { CONVERSATION_STATUS_LABELS } from "@/types/chat";
import { useDebounce } from "@/hooks/use-debounce";

const ALL = "__all__";

interface FilterOptions {
  products: { id: string; name: string }[];
  customers: { id: string; name: string; email: string }[];
}

export function AdminConversationsList({ filterOptions }: { filterOptions: FilterOptions }) {
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [status, setStatus] = React.useState<ConversationStatus | typeof ALL>(ALL);
  const [productId, setProductId] = React.useState(ALL);
  const [userId, setUserId] = React.useState(ALL);
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const filters: AdminConversationFilters = {
    search: debouncedSearch || undefined,
    status: status === ALL ? undefined : status,
    productId: productId === ALL ? undefined : productId,
    userId: userId === ALL ? undefined : userId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["admin-conversations", filters],
    queryFn: () => getAdminConversations(filters),
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Producto o cliente..."
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={(v) => setStatus(v as ConversationStatus | typeof ALL)}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los estados</SelectItem>
            {Object.entries(CONVERSATION_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger>
            <SelectValue placeholder="Producto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los productos</SelectItem>
            {filterOptions.products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los clientes</SelectItem>
            {filterOptions.customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Cargando...</p>
      ) : !conversations || conversations.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No hay consultas que coincidan con estos filtros.
        </p>
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => (
            <ConversationRow
              key={c.id}
              href={`/admin/consultas/${c.id}`}
              productName={c.variantLabel ? `${c.product.name} · ${c.variantLabel}` : c.product.name}
              productImageUrl={c.product.imageUrl}
              status={c.status}
              lastMessage={c.lastMessage}
              lastMessageAt={c.lastMessageAt}
              unreadCount={c.unreadCount}
              customer={c.customer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
