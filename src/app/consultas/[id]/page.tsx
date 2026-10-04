import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, User, Mail } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductMiniCard } from "@/components/chat/product-mini-card";
import { ConversationStatusBadge } from "@/components/chat/conversation-status-badge";
import { ChatThread } from "@/components/chat/chat-thread";
import { getConversationProductContext } from "@/actions/chat-actions";
import { requireCustomerSession } from "@/lib/require-customer";

export const metadata: Metadata = {
  title: "Consulta",
  robots: { index: false, follow: false },
};

const DEFAULT_INQUIRY_MESSAGE =
  "Hola, estoy interesado en este producto y quisiera realizar una consulta.";

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ prefill?: string }>;
}) {
  const session = await requireCustomerSession();
  if (!session) redirect("/cuenta/ingresar");

  const { id } = await params;
  const { prefill } = await searchParams;

  const context = await getConversationProductContext(id);
  if (!context) notFound();

  return (
    <div className="min-h-screen">
      <Header />
      <main
        className="mx-auto max-w-2xl px-6 pb-24 lg:px-10"
        style={{ paddingTop: "calc(var(--header-h) + 32px)" }}
      >
        <Link
          href="/consultas"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Mis consultas
        </Link>

        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Consulta</h1>
          <ConversationStatusBadge status={context.status} />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            <User className="h-4 w-4 text-muted-foreground" />
            Cliente: {context.customer.name}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            Gmail del cliente: {context.customer.email}
          </span>
        </div>

        <div className="mb-4">
          <ProductMiniCard {...context.product} />
        </div>

        <ChatThread conversationId={id} prefill={prefill === "1" ? DEFAULT_INQUIRY_MESSAGE : undefined} />
      </main>
      <Footer />
    </div>
  );
}
