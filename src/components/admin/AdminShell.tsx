"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldCheck, ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminNav } from "@/components/admin/AdminNav";

const LOGIN_PATH = "/admin/login";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, hydrated, logout } = useAuth();
  const isLoginPage = pathname === LOGIN_PATH;
  const isAuthorized = role === "admin";

  useEffect(() => {
    if (hydrated && !isLoginPage && !isAuthorized) {
      router.replace(LOGIN_PATH);
    }
  }, [hydrated, isLoginPage, isAuthorized, router]);

  const handleLogout = () => {
    logout();
    router.push(LOGIN_PATH);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-[var(--color-border)] bg-slate-900 text-white">
        <div className="container-page flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <ShieldCheck size={18} />
            </span>
            <span className="text-sm font-semibold">EDEELZ.lk Admin</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthorized && !isLoginPage && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white"
              >
                <LogOut size={14} /> Log out
              </button>
            )}
            <Link href="/" className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white">
              <ArrowLeft size={14} /> Back to site
            </Link>
          </div>
        </div>
        {isAuthorized && !isLoginPage && <AdminNav />}
      </header>
      <main className="flex-1">
        {/* Avoid flashing protected content before the guard above has a chance to redirect. */}
        {isLoginPage || (hydrated && isAuthorized) ? children : null}
      </main>
    </div>
  );
}
