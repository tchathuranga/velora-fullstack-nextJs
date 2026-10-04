import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-white">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3">
            <Image src="/images/logo.png" alt="won.lk" width={2171} height={724} className="h-10 w-auto" />
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            Sri Lanka&apos;s online marketplace connecting buyers with independent sellers, island-wide.
          </p>
          <div className="mt-4 flex gap-3 text-slate-400">
            <Mail size={18} className="hover:text-[var(--color-primary)]" />
            <Phone size={18} className="hover:text-[var(--color-primary)]" />
            <MessageCircle size={18} className="hover:text-[var(--color-primary)]" />
          </div>
        </div>

        <FooterColumn
          title="About us"
          links={[
            { label: "Our story", href: "/about" },
            { label: "Careers", href: "/about" },
            { label: "Become a seller", href: "/signup?next=/sell/register" },
          ]}
        />
        <FooterColumn
          title="Help & Contact"
          links={[
            { label: "FAQ", href: "/help" },
            { label: "Shipping & delivery", href: "/help" },
            { label: "Contact support", href: "/help" },
          ]}
        />
        <FooterColumn
          title="Our services"
          links={[
            { label: "Cash on delivery", href: "/help" },
            { label: "Bank transfer", href: "/help" },
            { label: "Seller tools", href: "/signup?next=/sell/register" },
          ]}
        />
      </div>
      <div className="border-t border-[var(--color-border)] py-4">
        <p className="container-page text-center text-xs text-[var(--color-muted)]">
          © {new Date().getFullYear()} won.lk. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
