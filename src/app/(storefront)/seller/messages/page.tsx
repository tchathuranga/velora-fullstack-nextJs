"use client";

import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAuth } from "@/context/AuthContext";
import { useGetConversationsQuery, useSendMessageMutation } from "@/Redux/api";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { PageLoader } from "@/components/ui/PageLoader";

const POLL_MS = 15_000;

export default function SellerMessagesPage() {
  const { role, hydrated } = useAuth();
  const { data, isLoading } = useGetConversationsQuery(role === "seller" ? "seller" : skipToken, {
    pollingInterval: POLL_MS,
  });
  const [sendMessage] = useSendMessageMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!hydrated || isLoading) return <PageLoader />;

  // A buyer who opened the chat but hasn't written yet isn't worth showing.
  const conversations = (data ?? []).filter((c) => c.messages.length > 0);
  const active = conversations.find((c) => c.id === selectedId) ?? conversations[0] ?? null;

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
          activeId={active?.id ?? null}
          onSelect={setSelectedId}
        />
        {active ? (
          <ChatWindow
            title={active.buyerName}
            messages={active.messages}
            viewerRole="seller"
            onSend={async (text) => {
              await sendMessage({ conversationId: active.id, text }).unwrap();
            }}
          />
        ) : (
          <div className="flex h-[32rem] items-center justify-center text-sm text-[var(--color-muted)]">
            No conversations yet — buyers who message your store will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
