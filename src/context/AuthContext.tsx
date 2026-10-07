"use client";

import { createContext, useContext, useMemo } from "react";
import {
  RegisterInput,
  useAdminLoginMutation,
  useGetSessionQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useSaveAddressMutation,
} from "@/Redux/api";
import type { AuthUser, Role } from "@/types/auth";
import type { Address } from "@/types";

export type { Role } from "@/types/auth";

interface AuthContextValue {
  role: Role;
  /** True once the first session check (cookie → account) has finished, so guards don't redirect too early. */
  hydrated: boolean;
  username: string | null;
  displayName: string;
  email: string | null;
  /** Set only while the account's store is approved (i.e. signed in as a seller). */
  storeSlug: string | null;
  buyerId: string | null;
  /**
   * The store slug of the signed-in account's seller application, if any — set even while signed
   * in as a buyer and the store is still under review, so the account can check on it.
   */
  sellerStoreSlug: string | null;
  /** The signed-in buyer's saved delivery address, if any. */
  address: Address | undefined;
  /** Every action below rejects with the API error; use `getErrorMessage(err)` to display it. */
  login: (identifier: string, password: string) => Promise<AuthUser>;
  loginAdmin: (username: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  saveAddress: (address: Address) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetSessionQuery();
  const [loginMutation] = useLoginMutation();
  const [adminLoginMutation] = useAdminLoginMutation();
  const [registerMutation] = useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();
  const [saveAddressMutation] = useSaveAddressMutation();

  const value = useMemo<AuthContextValue>(
    () => ({
      role: user?.role ?? "guest",
      hydrated: !isLoading,
      username: user?.username ?? null,
      displayName: user?.name ?? "Guest",
      email: user?.email ?? null,
      storeSlug: user?.storeSlug ?? null,
      buyerId: user?.buyerId ?? null,
      sellerStoreSlug: user?.sellerStoreSlug ?? null,
      address: user?.address,
      login: async (identifier, password) => {
        return (await loginMutation({ identifier, password }).unwrap())!;
      },
      loginAdmin: async (username, password) => {
        await adminLoginMutation({ username, password }).unwrap();
      },
      register: async (input) => {
        await registerMutation(input).unwrap();
      },
      logout: async () => {
        await logoutMutation().unwrap();
      },
      saveAddress: async (address) => {
        await saveAddressMutation(address).unwrap();
      },
    }),
    [user, isLoading, loginMutation, adminLoginMutation, registerMutation, logoutMutation, saveAddressMutation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
