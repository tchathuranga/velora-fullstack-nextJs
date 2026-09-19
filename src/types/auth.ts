export type Role = "guest" | "buyer" | "seller" | "admin";

export interface AuthUser {
  role: Role;
  username: string;
  name: string;
  buyerId?: string;
  storeSlug?: string;
}
