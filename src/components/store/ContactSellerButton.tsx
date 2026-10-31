"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

/** `productId` / `orderId` make the message center show which listing or order the buyer is asking about. */
export function ContactSellerButton({
  storeId,
  productId,
  orderId,
  label = "Contact seller",
}: {
  storeId: string;
  productId?: string;
  orderId?: string;
  label?: string;
}) {
  const { role } = useAuth();

  if (role !== "buyer") return null;

  const params = new URLSearchParams({ store: storeId });
  if (productId) params.set("product", productId);
  if (orderId) params.set("order", orderId);

  return (
    <Link href={`/account/messages?${params.toString()}`}>
      <Button variant="outline" size="sm">
        <MessageCircle size={16} />
        {label}
      </Button>
    </Link>
  );
}
