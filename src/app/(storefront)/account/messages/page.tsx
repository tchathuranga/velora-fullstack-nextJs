"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { Conversation, Store } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getConversationsForBuyer } from "@/lib/data/messages";
import { getStoreById } from "@/lib/data/stores";
import { fetchJson } from "@/lib/fetchJson";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { generateId } from "@/lib/utils";

function BuyerMessagesInner({ buyerId, buyerName }: { buyerId: string; buyerName: string }) {
  const searchParams = useSearchParams();
  const [stores, setStores] = useState<Store[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchJson<Conversation[]>("/data/conversations.json"), fetchJson<Store[]>("/data/stores.json")])
      .then(([conversationsData, storesData]) => {
        const buyerConversations = getConversationsForBuyer(conversationsData, buyerId);
        setConversations(buyerConversations);
        setActiveId(buyerConversations[0]?.id ?? null);
        setStores(storesData);
      })
      .finally(() => setLoading(false));
  }, [buyerId]);

  useEffect(() => {
    if (loading) return;
    const storeId = searchParams.get("store");
    if (!storeId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConversations((prev) => {
      const existing = prev.find((c) => c.storeId === storeId);
      if (existing) {
        setActiveId(existing.id);
        return prev;
      }
      const store = getStoreById(stores, storeId);
      if (!store) return prev;
      const draft: Conversation = {
        id: generateId("conv"),
        buyerId,
        buyerName,
        storeId: store.id,
        storeName: store.storeName,
        messages: [],
      };
      setActiveId(draft.id);
      return [draft, ...prev];
    });
  }, [searchParams, buyerId, buyerName, stores, loading]);

  if (loading) return <PageLoader />;

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const sendMessage = (text: string) => {
    if (!active) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? { ...c, messages: [...c.messages, { id: generateId("msg"), sender: "buyer", text, timestamp: new Date().toISOString() }] }
          : c,
      ),
    );
  };

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
      <div className="card mt-6 grid grid-cols-1 sm:grid-cols-[16rem_1fr]">
        <ConversationList
          conversations={conversations.map((c) => ({
            id: c.id,
            name: c.storeName,
            preview: c.messages.at(-1)?.text ?? "Start the conversation",
          }))}
          activeId={activeId}
          onSelect={setActiveId}
        />
        {active ? (
          <ChatWindow
            title={active.storeName}
            messages={active.messages}
            viewerRole="buyer"
            onSend={sendMessage}
            emptyHint="Say hello to get the conversation started."
          />
        ) : (
          <div className="flex h-[32rem] items-center justify-center text-sm text-[var(--color-muted)]">
            Select a store to view your conversation, or contact a seller from a product page to start
            a new one.
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuyerMessagesPage() {
  const { role, buyerId, displayName } = useAuth();

  if (role !== "buyer") {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <LogIn size={26} />
        </span>
        <p className="text-slate-600">Log in as a buyer to see your messages.</p>
        <Link href="/login">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <BuyerMessagesInner buyerId={buyerId ?? "guest-buyer"} buyerName={displayName} />
    </Suspense>
  );
}
