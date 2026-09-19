import Link from "next/link";
import { Store, TrendingUp, Wallet, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";

const perks = [
  {
    icon: TrendingUp,
    title: "Reach thousands of buyers",
    description: "Get discovered on EDEELZ.lk's homepage, search and category pages.",
  },
  {
    icon: Wallet,
    title: "Get paid reliably",
    description: "We handle Cash on Delivery and Bank transfer, and pay out net sales every other Monday.",
  },
  {
    icon: Truck,
    title: "You control fulfilment",
    description: "Set your own handling time, delivery time and accepted payment methods.",
  },
];

export default function SellLandingPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white">
          <Store size={28} />
        </span>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Create your own store</h1>
        <p className="mt-3 text-base text-[var(--color-muted)]">
          Join EDEELZ.lk as a seller and start listing your products to buyers across Sri Lanka —
          setup takes less than 10 minutes.
        </p>
        <Link href="/signup?next=/sell/register" className="mt-8 inline-block">
          <Button size="lg">Create your own store</Button>
        </Link>
      </div>

      <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
        {perks.map((perk) => {
          const Icon = perk.icon;
          return (
            <div key={perk.title} className="card p-6 text-center">
              <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                <Icon size={20} />
              </span>
              <h3 className="text-sm font-semibold text-slate-900">{perk.title}</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{perk.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
