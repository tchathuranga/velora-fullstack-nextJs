import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Role } from "@/types/auth";
import { Address } from "@/types";

export interface RegisteredUser {
  username: string;
  email: string;
  password: string;
  name: string;
}

export interface RegisteredSeller {
  username: string;
  email: string;
  password: string;
  name: string;
  storeSlug: string;
}

interface AuthState {
  role: Role;
  hydrated: boolean;
  username: string | null;
  signupName: string | null;
  storeSlug: string | null;
  buyerId: string | null;
  registeredUser: RegisteredUser | null;
  registeredSeller: RegisteredSeller | null;
  /** Saved delivery addresses, keyed by username — part of each account's own data. */
  addressesByUsername: Record<string, Address>;
}

const STORAGE_KEY = "velora_auth";

const initialState: AuthState = {
  role: "guest",
  hydrated: false,
  username: null,
  signupName: null,
  storeSlug: null,
  buyerId: null,
  registeredUser: null,
  registeredSeller: null,
  addressesByUsername: {},
};

const persistAuth = (state: AuthState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth: (state, action: PayloadAction<Partial<AuthState> | null | undefined>) => {
      const payload = action.payload ?? {};
      state.role = payload.role ?? "guest";
      state.username = payload.username ?? null;
      state.signupName = payload.signupName ?? null;
      state.storeSlug = payload.storeSlug ?? null;
      state.buyerId = payload.buyerId ?? null;
      state.registeredUser = payload.registeredUser ?? null;
      state.registeredSeller = payload.registeredSeller ?? null;
      state.addressesByUsername = payload.addressesByUsername ?? {};
    },
    setHydrated: (state) => {
      state.hydrated = true;
    },
    setGuest: (state) => {
      state.role = "guest";
      state.username = null;
      state.signupName = null;
      state.storeSlug = null;
      state.buyerId = null;
      persistAuth(state);
    },
    loginSuccess: (
      state,
      action: PayloadAction<{
        role: Role;
        username: string;
        signupName?: string | null;
        storeSlug?: string | null;
        buyerId?: string | null;
        registeredUser?: RegisteredUser | null;
        registeredSeller?: RegisteredSeller | null;
      }>,
    ) => {
      const {
        role,
        username,
        signupName = null,
        storeSlug = null,
        buyerId = null,
        registeredUser = state.registeredUser,
        registeredSeller = state.registeredSeller,
      } = action.payload;
      state.role = role;
      state.username = username;
      state.signupName = signupName;
      state.storeSlug = storeSlug;
      state.buyerId = buyerId;
      state.registeredUser = registeredUser;
      state.registeredSeller = registeredSeller;
      persistAuth(state);
    },
    logout: (state) => {
      state.role = "guest";
      state.username = null;
      state.signupName = null;
      state.storeSlug = null;
      state.buyerId = null;
      persistAuth(state);
    },
    registerBuyer: (state, action: PayloadAction<RegisteredUser>) => {
      const user = action.payload;
      state.role = "buyer";
      state.username = user.username;
      state.signupName = user.name;
      state.storeSlug = null;
      state.buyerId = null;
      state.registeredUser = user;
      persistAuth(state);
    },
    registerSeller: (state, action: PayloadAction<RegisteredSeller>) => {
      const seller = action.payload;
      state.role = "seller";
      state.username = seller.username;
      state.signupName = seller.name;
      state.storeSlug = seller.storeSlug;
      state.buyerId = null;
      state.registeredSeller = seller;
      persistAuth(state);
    },
    saveAddress: (state, action: PayloadAction<{ username: string; address: Address }>) => {
      state.addressesByUsername[action.payload.username] = action.payload.address;
      persistAuth(state);
    },
  },
});

export const { hydrateAuth, setHydrated, setGuest, loginSuccess, logout, registerBuyer, registerSeller, saveAddress } =
  authSlice.actions;
export default authSlice.reducer;
