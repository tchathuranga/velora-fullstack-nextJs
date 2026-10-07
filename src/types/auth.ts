import type { Address } from "@/types";

export type Role = "guest" | "buyer" | "seller" | "admin";

/** The signed-in account as the browser sees it (returned by /api/auth/*). */
export interface AuthUser {
  role: Exclude<Role, "guest">;
  username: string;
  name: string;
  email: string;
  buyerId?: string;
  /** Set only while the account's store is approved. */
  storeSlug?: string;
  /**
   * The account's store slug whatever its status — lets a still-pending (or rejected) seller
   * application be checked on while signed in as a buyer.
   */
  sellerStoreSlug?: string;
  address?: Address;
}
