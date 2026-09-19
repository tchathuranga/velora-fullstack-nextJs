"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Search,
  ShoppingCart,
  Heart,
  Bell,
  User,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  MessageCircle,
  PackagePlus,
  Rocket,
} from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setMobileOpen, setQuery } from "@/store/headerSlice";

export function Header() {
  const { role, logout: authLogout, displayName, storeSlug } = useAuth();
  const { itemCount } = useCart();
  const { productIds } = useWishlist();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mobileOpen = useAppSelector((state) => state.header.mobileOpen);
  const query = useAppSelector((state) => state.header.query);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  };

  const logout = () => {
    authLogout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/95 backdrop-blur">
      <div className="container-page flex flex-wrap items-center gap-3 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
            <Store size={18} />
          </span>
          <span className="text-xl font-bold text-slate-900">
            EDEELZ<span className="text-[var(--color-primary)]">.lk</span>
          </span>
        </Link>

        <form onSubmit={onSearch} className="order-3 w-full sm:order-none sm:flex-1 sm:max-w-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(e) => dispatch(setQuery(e.target.value))}
              type="search"
              placeholder="Search products, brands and stores"
              className="input-base pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          {(role === "guest" || role === "buyer") && (
            <Link href={role === "buyer" ? "/sell/register" : "/signup?next=/sell/register"} className="hidden sm:block">
              <Button variant="outline" size="sm">
                <Rocket size={16} />
                Become a seller
              </Button>
            </Link>
          )}

          <IconLink href="/wishlist" label="Wish List" count={productIds.length}>
            <Heart size={20} />
          </IconLink>
          <IconLink href="/cart" label="Cart" count={itemCount}>
            <ShoppingCart size={20} />
          </IconLink>

          <Dropdown
            trigger={() => (
              <span className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100">
                <Bell size={20} />
              </span>
            )}
          >
            {() => (
              <div className="px-4 py-3 text-sm text-slate-500">You&apos;re all caught up — no new notifications.</div>
            )}
          </Dropdown>

          {role === "guest" ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-[var(--color-primary)]">
                Log in
              </Link>
              <span className="text-slate-300">/</span>
              <Link href="/signup" className="text-sm font-medium text-slate-700 hover:text-[var(--color-primary)]">
                Sign up
              </Link>
            </div>
          ) : (
            <Dropdown
              trigger={() => (
                <span className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                    <User size={16} />
                  </span>
                  <span className="hidden md:inline">{displayName}</span>
                </span>
              )}
            >
              {(close) => (
                <nav className="flex flex-col">
                  {role === "buyer" && (
                    <>
                      <DropdownLink href="/account" icon={<User size={16} />} onClick={close}>
                        My Account
                      </DropdownLink>
                      <DropdownLink href="/account/messages" icon={<MessageCircle size={16} />} onClick={close}>
                        Messages
                      </DropdownLink>
                    </>
                  )}
                  {role === "seller" && (
                    <>
                      <DropdownLink href={`/store/${storeSlug}`} icon={<LayoutDashboard size={16} />} onClick={close}>
                        My Store
                      </DropdownLink>
                      <DropdownLink href="/seller/products/new" icon={<PackagePlus size={16} />} onClick={close}>
                        List a Product
                      </DropdownLink>
                      <DropdownLink href="/seller/messages" icon={<MessageCircle size={16} />} onClick={close}>
                        Messages
                      </DropdownLink>
                    </>
                  )}
                  {role === "admin" && (
                    <>
                      <DropdownLink href="/admin/sellers" icon={<LayoutDashboard size={16} />} onClick={close}>
                        Seller Dashboard
                      </DropdownLink>
                      <DropdownLink href="/admin/buyers" icon={<LayoutDashboard size={16} />} onClick={close}>
                        Buyer Dashboard
                      </DropdownLink>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      logout();
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-slate-50"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </nav>
              )}
            </Dropdown>
          )}

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 sm:hidden"
            onClick={() => dispatch(setMobileOpen(!mobileOpen))}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--color-border)] bg-white sm:hidden">
          <nav className="container-page flex flex-col gap-1 py-3 text-sm">
            {(role === "guest" || role === "buyer") && (
              <DropdownLink
                href={role === "buyer" ? "/sell/register" : "/signup?next=/sell/register"}
                icon={<Rocket size={16} />}
                onClick={() => dispatch(setMobileOpen(false))}
              >
                Become a seller
              </DropdownLink>
            )}
            {role === "guest" && (
              <>
                <DropdownLink href="/login" onClick={() => dispatch(setMobileOpen(false))}>
                  Log in
                </DropdownLink>
                <DropdownLink href="/signup" onClick={() => dispatch(setMobileOpen(false))}>
                  Sign up
                </DropdownLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function IconLink({
  href,
  label,
  count,
  children,
}: {
  href: string;
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
    >
      {children}
      {!!count && count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-semibold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function DropdownLink({
  href,
  children,
  onClick,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[var(--color-primary)]"
    >
      {icon}
      {children}
    </Link>
  );
}
