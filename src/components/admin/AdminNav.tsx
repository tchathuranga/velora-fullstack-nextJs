"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/buyers", label: "Buyers" },
  { href: "/admin/sellers/payments", label: "Payments" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-white/10 bg-slate-900">
      <div className="container-page flex gap-1 py-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "rounded-t-md px-4 py-2 text-sm font-medium transition",
                active ? "bg-slate-50 text-slate-900" : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
