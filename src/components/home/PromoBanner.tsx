import Link from "next/link";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PromoBanner() {
  return (
    <section className="my-8 flex flex-col items-center justify-between gap-5 rounded-2xl bg-slate-900 px-6 py-8 text-white sm:flex-row sm:px-10">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <Truck size={22} />
        </span>
        <div>
          <p className="text-lg font-semibold">Free island-wide delivery</p>
          <p className="text-sm text-white/70">On orders over Rs. 5,000 — pay by Cash on Delivery or Bank transfer.</p>
        </div>
      </div>
      <Link href="/sell">
        <Button variant="accent">Start selling on EDEELZ.lk</Button>
      </Link>
    </section>
  );
}
