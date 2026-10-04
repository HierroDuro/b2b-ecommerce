"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { ConversationStatus } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { ConversationRow } from "@/components/chat/conversation-row";

interface ConversationListEntry {
  id: string;
  status: ConversationStatus;
  product: { id: string; name: string; imageUrl: string; sku: string };
  variantLabel: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

export function CustomerConversationsList({
  conversations,
}: {
  conversations: ConversationListEntry[];
}) {
  const [search, setSearch] = React.useState("");

  const filtered = search.trim()
    ? conversations.filter((c) =>
        c.product.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : conversations;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por producto..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {conversations.length === 0
            ? "Todavía no iniciaste ninguna consulta. Buscá un producto y tocá \"Consultar\"."
            : "No encontramos consultas con ese producto."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <ConversationRow
              key={c.id}
              href={`/consultas/${c.id}`}
              productName={c.variantLabel ? `${c.product.name} · ${c.variantLabel}` : c.product.name}
              productImageUrl={c.product.imageUrl}
              status={c.status}
              lastMessage={c.lastMessage}
              lastMessageAt={c.lastMessageAt}
              unreadCount={c.unreadCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
