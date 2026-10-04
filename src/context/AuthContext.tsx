"use client";

import { createContext, useContext, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hydrateAuth,
  loginSuccess,
  logout as logoutAction,
  registerBuyer,
  registerSeller,
  saveAddress as saveAddressAction,
  setHydrated,
  type RegisteredUser,
  type RegisteredSeller,
} from "@/store/authSlice";
import { findDemoUser, findDemoAdmin, type DemoUser } from "@/lib/data/users";
import { getStoreBySlug } from "@/lib/data/stores";
import type { Role } from "@/types/auth";
import type { Address, Store } from "@/types";

export type { Role } from "@/types/auth";
export type { DemoUser } from "@/lib/data/users";

interface AuthContextValue {
  role: Role;
  hydrated: boolean;
  username: string | null;
  displayName: string;
  storeSlug: string | null;
  buyerId: string | null;
  /**
   * The store slug of the signed-in account's seller application, if any — set even while signed
   * in as a buyer and the store is still under review, so the account can check on it.
   */
  sellerStoreSlug: string | null;
  /**
   * Matches against the demo buyer/seller list (or the signed-up user), and logs in on a match.
   * A self-registered seller only signs in as "seller" once their store is approved; until then
   * the same credentials sign them in as a buyer, with `sellerStoreSlug` pointing at the pending
   * application.
   */
  login: (users: DemoUser[], username: string, password: string, stores: Store[]) => DemoUser | null;
  /** Matches against the demo admin list, and logs in on a match. */
  loginAdmin: (admins: DemoUser[], username: string, password: string) => DemoUser | null;
  logout: () => void;
  registerAsBuyer: (name: string, username: string, email: string, password: string) => void;
  /**
   * Promotes the currently signed-up buyer to a seller tied to the given store, reusing their
   * existing username/password so they keep logging in with the same credentials from signup.
   */
  registerAsSeller: (storeSlug: string) => void;
  /** The given account's saved delivery address, if any. */
  getAddress: (username: string) => Address | undefined;
  /** Saves a delivery address on the given account. */
  saveAddress: (username: string, address: Address) => void;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.auth.role);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const username = useAppSelector((state) => state.auth.username);
  const signupName = useAppSelector((state) => state.auth.signupName);
  const storeSlug = useAppSelector((state) => state.auth.storeSlug);
  const buyerId = useAppSelector((state) => state.auth.buyerId);
  const registeredUser = useAppSelector((state) => state.auth.registeredUser);
  const registeredSeller = useAppSelector((state) => state.auth.registeredSeller);
  const addressesByUsername = useAppSelector((state) => state.auth.addressesByUsername);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem("velora_auth");
      if (stored) {
        const parsed = JSON.parse(stored) as {
          role?: Role;
          username?: string | null;
          signupName?: string | null;
          storeSlug?: string | null;
          buyerId?: string | null;
          registeredUser?: RegisteredUser | null;
          registeredSeller?: RegisteredSeller | null;
          addressesByUsername?: Record<string, Address>;
        };
        dispatch(hydrateAuth(parsed));
      }
    } catch {
      // ignore
    }

    dispatch(setHydrated());
  }, [dispatch]);

  const login = (users: DemoUser[], usernameInput: string, password: string, stores: Store[]) => {
    const normalizedInput = usernameInput.trim().toLowerCase();

    // A self-registered seller shares the same username/password as the buyer account they were
    // promoted from. They only sign in as "seller" once an admin has approved their store —
    // until then the same credentials sign them in as a buyer (see registeredMatch below), with
    // sellerStoreSlug pointing at the pending application so they can check on it.
    const registeredSellerMatch =
      registeredSeller &&
      (registeredSeller.username.toLowerCase() === normalizedInput || registeredSeller.email.toLowerCase() === normalizedInput) &&
      registeredSeller.password === password
        ? registeredSeller
        : undefined;

    if (registeredSellerMatch && getStoreBySlug(stores, registeredSellerMatch.storeSlug)?.status === "active") {
      const seller = { ...registeredSellerMatch, role: "seller" as const };
      dispatch(
        loginSuccess({
          role: seller.role,
          username: seller.username,
          signupName: seller.name,
          storeSlug: seller.storeSlug,
          registeredSeller: seller,
        }),
      );
      return seller;
    }

    const registeredMatch =
      registeredUser &&
      (registeredUser.username.toLowerCase() === normalizedInput || registeredUser.email.toLowerCase() === normalizedInput) &&
      registeredUser.password === password
        ? registeredUser
        : undefined;

    if (registeredMatch) {
      const user = { ...registeredMatch, role: "buyer" as const };
      dispatch(
        loginSuccess({
          role: user.role,
          username: user.username,
          signupName: user.name,
          registeredUser: user,
          registeredSeller,
        }),
      );
      return user;
    }

    // A pending/rejected seller application has no matching buyer account (e.g. demo data) —
    // sign them in as the seller anyway so they land somewhere rather than "invalid credentials".
    if (registeredSellerMatch) {
      const seller = { ...registeredSellerMatch, role: "seller" as const };
      dispatch(
        loginSuccess({
          role: seller.role,
          username: seller.username,
          signupName: seller.name,
          storeSlug: seller.storeSlug,
          registeredSeller: seller,
        }),
      );
      return seller;
    }

    const match = findDemoUser(users, usernameInput, password);
    if (!match) return null;
    dispatch(
      loginSuccess({
        role: match.role,
        username: match.username,
        signupName: match.name,
        storeSlug: match.storeSlug ?? null,
        buyerId: match.buyerId ?? null,
        registeredUser,
      }),
    );
    return match;
  };

  const loginAdmin = (admins: DemoUser[], usernameInput: string, password: string) => {
    const match = findDemoAdmin(admins, usernameInput, password);
    if (!match) return null;
    dispatch(loginSuccess({ role: match.role, username: match.username, signupName: match.name, registeredUser }));
    return match;
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  const registerAsBuyer = (name: string, usernameInput: string, email: string, password: string) => {
    const newUser: RegisteredUser = {
      name,
      username: usernameInput.trim(),
      email: email.trim().toLowerCase(),
      password,
    };
    dispatch(registerBuyer(newUser));
  };

  const registerAsSeller = (storeSlug: string) => {
    if (!registeredUser) return;
    const newSeller: RegisteredSeller = {
      name: registeredUser.name,
      username: registeredUser.username,
      email: registeredUser.email,
      password: registeredUser.password,
      storeSlug,
    };
    dispatch(registerSeller(newSeller));
  };

  const getAddress = (forUsername: string) => addressesByUsername[forUsername];

  const saveAddress = (forUsername: string, address: Address) => {
    dispatch(saveAddressAction({ username: forUsername, address }));
  };

  // `signupName` is set on every login path to whichever account is currently signed in;
  // `registeredUser` just caches the last self-registered account's credentials for future
  // logins and can be stale (e.g. after logging in as a different demo user), so it must
  // never take precedence over `signupName` for what's actually displayed.
  const displayName = signupName ?? registeredUser?.name ?? "Guest";
  const sellerStoreSlug = registeredSeller?.storeSlug ?? null;

  return (
    <AuthContext.Provider
      value={{
        role,
        hydrated,
        username,
        displayName,
        storeSlug,
        buyerId,
        sellerStoreSlug,
        login,
        loginAdmin,
        logout,
        registerAsBuyer,
        registerAsSeller,
        getAddress,
        saveAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
