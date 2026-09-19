import Link from "next/link";
import { Clock3, Mail, Phone } from "lucide-react";

export default function SellPendingPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-lg p-8 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-warning-light)] text-[var(--color-warning)]">
          <Clock3 size={26} />
        </span>
        <h1 className="text-xl font-bold text-slate-900">
          Your Store Is Under Review. <Link href="/sell/pending" className="link-blue font-medium">Check status</Link>
        </h1>
        <p className="mt-4 text-sm text-slate-600">Dear valued customer,</p>
        <p className="mt-2 text-sm text-slate-600">Thank you for creating a store on our website, EDEELZ.lk.</p>
        <p className="mt-2 text-sm text-slate-600">
          We would like to inform you that your store is currently <strong>under review</strong>. Our team
          will review your store and notify you of the outcome within <strong>24 hours</strong>.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Please keep in touch with us. If you have any questions or inquiries, feel free to contact us
          using the details below.
        </p>

        <div className="mt-6 space-y-2 rounded-lg bg-slate-50 p-4 text-left text-sm">
          <p className="flex items-center gap-2 text-slate-700">
            <Mail size={16} className="text-[var(--color-muted)]" /> support@edeelz.lk
          </p>
          <p className="flex items-center gap-2 text-slate-700">
            <Phone size={16} className="text-[var(--color-muted)]" /> +94 11 234 5678
          </p>
        </div>

        <p className="mt-6 text-sm text-slate-600">
          Thank you for choosing EDEELZ.lk. We appreciate your patience and look forward to having you
          with us.
        </p>
        <p className="mt-4 text-sm font-medium text-slate-800">Best regards, <br /> EDEELZ.lk Team</p>
      </div>
    </div>
  );
}
