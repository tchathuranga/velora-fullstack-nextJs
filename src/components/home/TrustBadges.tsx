import { BadgeCheck, Lock, RotateCcw, ShieldCheck, type LucideIcon } from "lucide-react";

const BADGES: { icon: LucideIcon; title: string; detail?: string }[] = [
  { icon: ShieldCheck, title: "100% money back guarantee" },
  { icon: Lock, title: "Secure payments", detail: "COD and Bank transfer accepted" },
  { icon: BadgeCheck, title: "Verified and trusted sellers" },
  { icon: RotateCcw, title: "14 days return accepted" },
];

/** The marketplace promises, as a 2×2 grid on phones and a single row on larger screens. */
export function TrustBadges() {
  return (
    <section className="grid grid-cols-2 gap-3 py-6 lg:grid-cols-4 lg:gap-4">
      {BADGES.map(({ icon: Icon, title, detail }) => (
        <div
          key={title}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-4 text-center shadow-sm lg:flex-row lg:gap-3 lg:text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            <Icon size={20} />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-900 sm:text-sm">{title}</p>
            {detail && <p className="mt-0.5 text-[11px] text-[var(--color-muted)] sm:text-xs">{detail}</p>}
          </div>
        </div>
      ))}
    </section>
  );
}
