"use client";

import { createContext, useContext, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/Redux/hooks";
import {
  hydrateAuth,
  loginSuccess,
  logout as logoutAction,
  registerBuyer,
  setHydrated,
  type RegisteredUser,
} from "@/Redux/slices/authSlice";
import { findDemoUser, findDemoAdmin, type DemoUser } from "@/lib/data/users";
import type { Role } from "@/types/auth";

export type { Role } from "@/types/auth";
export type { DemoUser } from "@/lib/data/users";

interface AuthContextValue {
  role: Role;
  hydrated: boolean;
  username: string | null;
  displayName: string;
  storeSlug: string | null;
  buyerId: string | null;
  /** Matches against the demo buyer/seller list (or the signed-up user), and logs in on a match. */
  login: (users: DemoUser[], username: string, password: string) => DemoUser | null;
  /** Matches against the demo admin list, and logs in on a match. */
  loginAdmin: (admins: DemoUser[], username: string, password: string) => DemoUser | null;
  logout: () => void;
  registerAsBuyer: (name: string, username: string, email: string, password: string) => void;
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
        };
        dispatch(hydrateAuth(parsed));
      }
    } catch {
      // ignore
    }

    dispatch(setHydrated());
  }, [dispatch]);

  const login = (users: DemoUser[], usernameInput: string, password: string) => {
    const normalizedInput = usernameInput.trim().toLowerCase();
    const registeredMatch =
      registeredUser &&
      (registeredUser.username.toLowerCase() === normalizedInput || registeredUser.email.toLowerCase() === normalizedInput) &&
      registeredUser.password === password
        ? registeredUser
        : undefined;

    if (registeredMatch) {
      const user = { ...registeredMatch, role: "buyer" as const };
      dispatch(loginSuccess({ role: user.role, username: user.username, signupName: user.name, registeredUser: user }));
      return user;
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

  const displayName = registeredUser?.name ?? signupName ?? "Guest";

  return (
    <AuthContext.Provider
      value={{ role, hydrated, username, displayName, storeSlug, buyerId, login, loginAdmin, logout, registerAsBuyer }}
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
