import { Conversation } from "@/types";

export function getConversationsForBuyer(conversations: Conversation[], buyerId: string): Conversation[] {
  return conversations.filter((c) => c.buyerId === buyerId);
}

export function getConversationsForStore(conversations: Conversation[], storeId: string): Conversation[] {
  return conversations.filter((c) => c.storeId === storeId);
}
