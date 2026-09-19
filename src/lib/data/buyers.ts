import { Buyer } from "@/types";

export function getBuyerById(buyers: Buyer[], id: string): Buyer | undefined {
  return buyers.find((b) => b.id === id);
}
