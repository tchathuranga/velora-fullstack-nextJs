"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Message } from "@/types";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { Button } from "@/components/ui/Button";

export function ChatWindow({
  title,
  subtitle,
  messages,
  viewerRole,
  onSend,
  emptyHint,
}: {
  title: string;
  subtitle?: string;
  messages: Message[];
  viewerRole: "buyer" | "seller";
  onSend: (text: string) => void;
  emptyHint?: string;
}) {
  const [draft, setDraft] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft("");
  };

  return (
    <div className="flex h-[32rem] flex-col">
      <div className="border-b border-[var(--color-border)] px-5 py-3">
        <p className="font-semibold text-slate-900">{title}</p>
        {subtitle && <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-[var(--color-muted)]">
            {emptyHint ?? "No messages yet."}
          </p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} own={m.sender === viewerRole} />)
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-[var(--color-border)] p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={viewerRole === "buyer" ? "Message seller (Write a message)" : "Reply to buyer (Write a message)"}
          className="input-base"
        />
        <Button type="submit" size="md" aria-label="Send">
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
