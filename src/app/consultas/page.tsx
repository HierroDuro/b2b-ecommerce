import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CustomerConversationsList } from "@/components/chat/customer-conversations-list";
import { getCustomerConversations } from "@/actions/chat-actions";
import { requireCustomerSession } from "@/lib/require-customer";

export const metadata: Metadata = {
  title: "Mis consultas",
  robots: { index: false, follow: false },
};

export default async function MyConversationsPage() {
  const session = await requireCustomerSession();
  if (!session) redirect("/cuenta/ingresar");

  const conversations = await getCustomerConversations();

  return (
    <div className="min-h-screen">
      <Header />
      <main
        className="mx-auto max-w-2xl px-6 pb-24 lg:px-10"
        style={{ paddingTop: "calc(var(--header-h) + 32px)" }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mis consultas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas tus conversaciones con nuestro equipo sobre los productos que consultaste.
        </p>
        <div className="mt-6">
          <CustomerConversationsList conversations={conversations} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
