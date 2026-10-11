"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAuth } from "@/context/AuthContext";
import { useGetConversationsQuery } from "@/Redux/api";

const POLL_MS = 15_000;
const SEEN_EVENT = "velora:messages-seen";

type SeenMap = Record<string, string>;

export interface UnreadConversation {
  id: string;
  name: string;
  text: string;
  count: number;
}

export interface MessageNotification {
  id: string;
  name: string;
  text: string;
  timestamp: string;
  unread: boolean;
}

const storageKey = (email: string, role: string) => `velora:messages-seen:${role}:${email}`;

function readSeen(key: string): SeenMap | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SeenMap) : null;
  } catch {
    return null;
  }
}

function writeSeen(key: string, map: SeenMap) {
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // Storage unavailable — the badge simply won't persist across reloads.
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

/**
 * Unread = messages from the other party newer than the last time this user opened that conversation.
 * "Seen" is tracked per browser; the first visit baselines existing history so old chats don't flood the badge.
 */
export function useUnreadMessages() {
  const { role, email } = useAuth();
  const viewer = role === "seller" ? "seller" : role === "buyer" ? "buyer" : null;
  const { data: conversations } = useGetConversationsQuery(viewer ?? skipToken, { pollingInterval: POLL_MS });
  const key = viewer && email ? storageKey(email, viewer) : null;
  const [seen, setSeen] = useState<SeenMap | null>(null);

  useEffect(() => {
    if (!key) return;
    const sync = () => setSeen(readSeen(key) ?? {});
    sync();
    window.addEventListener(SEEN_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SEEN_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [key]);

  // First ever load for this account: treat what already exists as read.
  useEffect(() => {
    if (!key || !conversations || readSeen(key)) return;
    const baseline: SeenMap = {};
    for (const c of conversations) {
      const last = c.messages.at(-1);
      if (last) baseline[c.id] = last.timestamp;
    }
    writeSeen(key, baseline);
  }, [key, conversations]);

  const items = useMemo<UnreadConversation[]>(() => {
    if (!viewer || !conversations || !seen) return [];
    const result: UnreadConversation[] = [];
    for (const c of conversations) {
      const since = seen[c.id] ?? "";
      const fresh = c.messages.filter((m) => m.sender !== viewer && m.timestamp > since);
      if (fresh.length) {
        result.push({
          id: c.id,
          name: viewer === "seller" ? c.buyerName : c.storeName,
          text: fresh.at(-1)!.text,
          count: fresh.length,
        });
      }
    }
    return result;
  }, [viewer, conversations, seen]);

  // Every message received from the other party, newest first — read ones stay as history.
  const notifications = useMemo<MessageNotification[]>(() => {
    if (!viewer || !conversations || !seen) return [];
    return conversations
      .flatMap((c) =>
        c.messages
          .filter((m) => m.sender !== viewer)
          .map((m) => ({
            id: m.id,
            name: viewer === "seller" ? c.buyerName : c.storeName,
            text: m.text,
            timestamp: m.timestamp,
            unread: m.timestamp > (seen[c.id] ?? ""),
          })),
      )
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
      .slice(0, 20);
  }, [viewer, conversations, seen]);

  const total = items.reduce((sum, c) => sum + c.count, 0);

  const markSeen = useCallback(
    (conversationId: string, timestamp: string) => {
      if (!key) return;
      const current = readSeen(key) ?? {};
      if ((current[conversationId] ?? "") >= timestamp) return;
      writeSeen(key, { ...current, [conversationId]: timestamp });
    },
    [key],
  );

  return { total, items, notifications, markSeen, messagesHref: viewer === "seller" ? "/seller/messages" : "/account/messages" };
}
