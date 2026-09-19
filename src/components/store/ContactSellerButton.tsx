"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export function ContactSellerButton({ storeId }: { storeId: string }) {
  const { role } = useAuth();

  if (role !== "buyer") return null;

  return (
    <Link href={`/account/messages?store=${storeId}`}>
      <Button variant="outline" size="sm">
        <MessageCircle size={16} />
        Contact seller
      </Button>
    </Link>
  );
}
