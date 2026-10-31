"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { skipToken } from "@reduxjs/toolkit/query";
import { useUnreadMessages } from "@/lib/useUnreadMessages";
import { formatDate } from "@/lib/utils";
import { useGetNotificationsQuery, useMarkNotificationsReadMutation } from "@/Redux/api";
import {
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
  ShieldCheck,
} from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { CategoryMenu } from "@/components/layout/CategoryMenu";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAppDispatch, useAppSelector } from "@/Redux/hooks";
import { setMobileOpen, setQuery } from "@/Redux/slices/headerSlice";

export function Header() {
  const { role, logout: authLogout, displayName, avatarUrl, storeSlug, sellerStoreSlug } = useAuth();
  const { itemCount } = useCart();
  const { productIds } = useWishlist();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mobileOpen = useAppSelector((state) => state.header.mobileOpen);
  const query = useAppSelector((state) => state.header.query);

  const unread = useUnreadMessages();
  const { data: bell } = useGetNotificationsQuery(role === "guest" || role === "admin" ? skipToken : undefined, {
    pollingInterval: 15_000,
  });
  const [markRead] = useMarkNotificationsReadMutation();
  const notifications = bell?.notifications ?? [];
  const unreadCount = bell?.unreadCount ?? 0;
  const [toast, setToast] = useState<{ title: string; body: string; link: string } | null>(null);
  const prevUnread = useRef<number | null>(null);

  // Pop a toast when a new notification arrives (not on first load).
  useEffect(() => {
    if (!bell) {
      prevUnread.current = null;
      return;
    }
    const prev = prevUnread.current;
    prevUnread.current = bell.unreadCount;
    const latest = bell.notifications.find((n) => !n.read);
    if (prev === null || bell.unreadCount <= prev || !latest) return;
    setToast({ title: latest.title, body: latest.body, link: latest.link });
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [bell]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  };

  const logout = async () => {
    await authLogout().catch(() => {});
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/95 backdrop-blur">
      <div className="container-page flex flex-wrap items-center gap-3 py-3">
        <Link href="/" aria-label="won.lk home" className="flex shrink-0 items-center">
          <Image src="/images/logo.png" alt="won.lk" width={2171} height={724} priority className="h-10 w-auto" />
        </Link>

        <div className="hidden shrink-0 sm:block">
          <CategoryMenu />
        </div>

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
                <CountBadge count={unreadCount} />
              </span>
            )}
          >
            {(close) =>
              role === "guest" ? (
                <div className="w-64 px-4 py-3 text-sm text-slate-500">Log in to see your notifications.</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">No notifications yet.</div>
              ) : (
                <div className="w-72 max-w-[80vw]">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markRead()}
                      className="block w-full border-b border-[var(--color-border)] px-4 py-2 text-right text-xs font-medium text-[var(--color-primary)] hover:bg-slate-50"
                    >
                      Mark all as read
                    </button>
                  )}
                  <ul className="max-h-96 divide-y divide-[var(--color-border)] overflow-y-auto">
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <Link
                          href={n.link || "#"}
                          onClick={() => {
                            if (!n.read) markRead([n.id]);
                            close();
                          }}
                          className={clsx("block px-4 py-2 text-sm hover:bg-slate-50", !n.read && "bg-[var(--color-primary-light)]")}
                        >
                          <span className="flex items-baseline justify-between gap-2">
                            <span className={clsx("truncate text-slate-800", n.read ? "font-medium" : "font-semibold")}>{n.title}</span>
                            <span className="shrink-0 text-xs text-slate-400">{formatDate(n.createdAt)}</span>
                          </span>
                          <span className="block truncate text-slate-500">{n.body}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            }
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
                  <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User size={16} />
                    )}
                  </span>
                  <span className="hidden md:inline">{displayName}</span>
                  <span className="relative -ml-1 h-0 w-0">
                    <CountBadge count={unread.total} />
                  </span>
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
                        <InlineCount count={unread.total} />
                      </DropdownLink>
                      {sellerStoreSlug && (
                        <DropdownLink href="/sell/pending" icon={<ShieldCheck size={16} />} onClick={close}>
                          Seller Account Status
                        </DropdownLink>
                      )}
                    </>
                  )}
                  {role === "seller" && (
                    <>
                      <DropdownLink href="/sell/pending" icon={<ShieldCheck size={16} />} onClick={close}>
                        Account Status
                      </DropdownLink>
                      <DropdownLink href={`/store/${storeSlug}`} icon={<LayoutDashboard size={16} />} onClick={close}>
                        My Store
                      </DropdownLink>
                      <DropdownLink href="/seller/products/new" icon={<PackagePlus size={16} />} onClick={close}>
                        List a Product
                      </DropdownLink>
                      <DropdownLink href="/seller/messages" icon={<MessageCircle size={16} />} onClick={close}>
                        Messages
                        <InlineCount count={unread.total} />
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

      {toast && (
        <Link
          href={toast.link || "#"}
          onClick={() => setToast(null)}
          role="status"
          className="fixed right-4 top-20 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-[var(--color-border)] bg-white p-3 text-sm shadow-lg"
        >
          <span className="flex items-center gap-2 font-semibold text-slate-800">
            <MessageCircle size={16} className="text-[var(--color-primary)]" />
            {toast.title}
          </span>
          <span className="mt-1 block truncate text-slate-500">{toast.body}</span>
        </Link>
      )}

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

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function InlineCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 text-xs font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
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
