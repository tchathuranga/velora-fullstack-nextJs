"use client";

import { Mail, Phone, MessageCircle } from "lucide-react";
import { useGetSiteQuery } from "@/Redux/api";
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
  const { data: site, isLoading } = useGetSiteQuery();

  if (isLoading || !site) return <PageLoader />;

  const { email, phone, whatsapp } = site.siteContact;

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

      {(email || phone || whatsapp) && (
        <div className="mt-8 card space-y-2 p-5 text-sm">
          {email && (
            <p className="flex items-center gap-2 text-slate-700">
              <Mail size={16} className="text-[var(--color-muted)]" /> {email}
            </p>
          )}
          {phone && (
            <p className="flex items-center gap-2 text-slate-700">
              <Phone size={16} className="text-[var(--color-muted)]" /> {phone}
            </p>
          )}
          {whatsapp && (
            <p className="flex items-center gap-2 text-slate-700">
              <MessageCircle size={16} className="text-[var(--color-muted)]" /> {whatsapp}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
