"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGetConversationsQuery, useSendMessageMutation, useStartConversationMutation } from "@/Redux/api";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";

const POLL_MS = 15_000;

function BuyerMessagesInner() {
  const searchParams = useSearchParams();
  const storeParam = searchParams.get("store");
  const { data: conversations = [], isLoading } = useGetConversationsQuery("buyer", { pollingInterval: POLL_MS });
  const [startConversation] = useStartConversationMutation();
  const [sendMessage] = useSendMessageMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const requestedStore = useRef<string | null>(null);

  // Arriving via "Contact seller": create the conversation with that store if it doesn't exist yet.
  useEffect(() => {
    if (!storeParam || isLoading || requestedStore.current === storeParam) return;
    requestedStore.current = storeParam;
    if (conversations.some((c) => c.storeId === storeParam)) return;
    startConversation({ storeId: storeParam })
      .unwrap()
      .then((created) => setSelectedId(created.id))
      .catch(() => {});
  }, [storeParam, isLoading, conversations, startConversation]);

  if (isLoading) return <PageLoader />;

  const active =
    conversations.find((c) => c.id === selectedId) ??
    (storeParam ? conversations.find((c) => c.storeId === storeParam) : conversations[0]) ??
    null;

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
          activeId={active?.id ?? null}
          onSelect={setSelectedId}
        />
        {active ? (
          <ChatWindow
            title={active.storeName}
            messages={active.messages}
            viewerRole="buyer"
            onSend={async (text) => {
              await sendMessage({ conversationId: active.id, text }).unwrap();
            }}
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
  const { role, hydrated } = useAuth();

  if (!hydrated) return <PageLoader />;

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
      <BuyerMessagesInner />
    </Suspense>
  );
}
