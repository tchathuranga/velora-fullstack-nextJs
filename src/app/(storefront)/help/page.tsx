"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { fetchJson } from "@/lib/fetchJson";
import { SiteConfig } from "@/types";
import { PageLoader } from "@/components/ui/PageLoader";

const faqs = [
  {
    q: "How do I pay for my order?",
    a: "You can pay using Cash on Delivery, or by Bank transfer — send your payment receipt to our WhatsApp number after transferring.",
  },
  {
    q: "How long does delivery take?",
    a: "Delivery times vary by seller and are shown on each product page under Handling time and Deliver by.",
  },
  {
    q: "How do I become a seller?",
    a: "Click Become a seller in the header, fill in your business and payment details, and our team will review your store within 24 hours.",
  },
];

export default function HelpPage() {
  const [site, setSite] = useState<SiteConfig | null>(null);

  useEffect(() => {
    fetchJson<SiteConfig>("/data/site.json").then(setSite);
  }, []);

  if (!site) return <PageLoader />;

  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="text-3xl font-bold text-slate-900">Help & Contact</h1>

      <div className="mt-6 space-y-4">
        {faqs.map((faq) => (
          <div key={faq.q} className="card p-5">
            <p className="text-sm font-semibold text-slate-900">{faq.q}</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 card space-y-2 p-5 text-sm">
        <p className="flex items-center gap-2 text-slate-700">
          <Mail size={16} className="text-[var(--color-muted)]" /> {site.siteContact.email}
        </p>
        <p className="flex items-center gap-2 text-slate-700">
          <Phone size={16} className="text-[var(--color-muted)]" /> {site.siteContact.phone}
        </p>
        <p className="flex items-center gap-2 text-slate-700">
          <MessageCircle size={16} className="text-[var(--color-muted)]" /> {site.siteContact.whatsapp}
        </p>
      </div>
    </div>
  );
}
