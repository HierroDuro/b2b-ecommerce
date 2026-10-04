"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, MessageSquareText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { startConversation } from "@/actions/chat-actions";
import { cn } from "@/lib/utils";

interface InquireButtonProps {
  productId: string;
  productName: string;
  /** Label of the selected variant (e.g. "Rosa"); saved on the conversation so its
   * product card shows that option's price. */
  variantLabel?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
}

/**
 * The catalog's only call to action — this is a catalog, not a store, so
 * there is no cart/checkout, just an inquiry that opens (or resumes) a chat
 * conversation about the product. Logged-out visitors are gated behind
 * AuthDialog first; once authenticated as a customer, this finds-or-creates
 * the conversation and navigates to it.
 */
export function InquireButton({
  productId,
  productName,
  variantLabel,
  disabled,
  className,
  size = "sm",
}: InquireButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authOpen, setAuthOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const proceedToConversation = async () => {
    setLoading(true);
    const result = await startConversation(productId, variantLabel);
    setLoading(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    router.push(`/consultas/${result.conversationId}${result.isNew ? "?prefill=1" : ""}`);
  };

  const handleClick = () => {
    if (disabled || loading) return;

    const isCustomer = status === "authenticated" && session?.user?.userType === "customer";
    if (!isCustomer) {
      setAuthOpen(true);
      return;
    }

    void proceedToConversation();
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        aria-label={`Consultar por ${productName}`}
        className={cn(
          "gap-2 bg-gradient-to-r from-primary to-[hsl(var(--aurora-2))] shadow-[0_6px_18px_-6px_hsl(var(--primary)/0.55)]",
          "transition-[filter,box-shadow] hover:from-primary hover:to-[hsl(var(--aurora-2))] hover:brightness-110 hover:shadow-[0_10px_24px_-6px_hsl(var(--primary)/0.7)]",
          className,
        )}
        size={size}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareText className="h-4 w-4" />}
        Consultar
      </Button>

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onAuthenticated={() => {
          setAuthOpen(false);
          void proceedToConversation();
        }}
      />
    </>
  );
}
