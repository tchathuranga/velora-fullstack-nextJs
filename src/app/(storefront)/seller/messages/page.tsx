"use client";

import { useEffect, useState } from "react";
import { Conversation, Store } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getStoreBySlug } from "@/lib/data/stores";
import { getConversationsForStore } from "@/lib/data/messages";
import { fetchJson } from "@/lib/fetchJson";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { PageLoader } from "@/components/ui/PageLoader";
import { generateId } from "@/lib/utils";

export default function SellerMessagesPage() {
  const { storeSlug } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchJson<Store[]>("/data/stores.json"), fetchJson<Conversation[]>("/data/conversations.json")])
      .then(([stores, conversationsData]) => {
        const store = storeSlug ? getStoreBySlug(stores, storeSlug) : undefined;
        const storeConversations = store ? getConversationsForStore(conversationsData, store.id) : [];
        setConversations(storeConversations);
        setActiveId(storeConversations[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, [storeSlug]);

  if (loading) return <PageLoader />;

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const sendReply = (text: string) => {
    if (!active) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? { ...c, messages: [...c.messages, { id: generateId("msg"), sender: "seller", text, timestamp: new Date().toISOString() }] }
          : c,
      ),
    );
  };

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold text-slate-900">Message center</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Buyers can start a conversation with your store — you can reply here.
      </p>
      <div className="card mt-6 grid grid-cols-1 sm:grid-cols-[16rem_1fr]">
        <ConversationList
          conversations={conversations.map((c) => ({
            id: c.id,
            name: c.buyerName,
            preview: c.messages.at(-1)?.text ?? "",
          }))}
          activeId={activeId}
          onSelect={setActiveId}
        />
        {active ? (
          <ChatWindow title={active.buyerName} messages={active.messages} viewerRole="seller" onSend={sendReply} />
        ) : (
          <div className="flex h-[32rem] items-center justify-center text-sm text-[var(--color-muted)]">
            No conversations yet — buyers who message your store will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
