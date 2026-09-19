"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { Buyer, BuyerStatus } from "@/types";
import { BuyerList } from "@/components/admin/BuyerList";
import { BuyerDetailsPanel } from "@/components/admin/BuyerDetailsPanel";
import { PageLoader } from "@/components/ui/PageLoader";

export default function AdminBuyersPage() {
  const [registeredBuyers, setRegisteredBuyers] = useState<Buyer[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [statuses, setStatuses] = useState<Record<string, BuyerStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<Buyer[]>("/data/buyers.json")
      .then((buyers) => {
        const registered = buyers.filter((b) => b.registered);
        setRegisteredBuyers(registered);
        setActiveId(registered[0]?.id ?? "");
        setStatuses(Object.fromEntries(registered.map((b) => [b.id, b.status])));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const activeBuyer = registeredBuyers.find((b) => b.id === activeId) ?? null;

  const toggleLimit = () => {
    if (!activeBuyer) return;
    setStatuses((prev) => ({
      ...prev,
      [activeBuyer.id]: prev[activeBuyer.id] === "active" ? "limited" : "active",
    }));
  };

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-slate-900">Buyer control dashboard</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Only registered buyers are listed here. Guest buyers do not appear.
      </p>

      <div className="card mt-6 grid grid-cols-1 sm:grid-cols-[16rem_1fr]">
        <BuyerList buyers={registeredBuyers} activeId={activeId} statuses={statuses} onSelect={setActiveId} />
        {activeBuyer ? (
          <div className="border-t border-[var(--color-border)] sm:border-l sm:border-t-0">
            <BuyerDetailsPanel buyer={activeBuyer} status={statuses[activeBuyer.id]} onToggleLimit={toggleLimit} />
          </div>
        ) : (
          <div className="flex items-center justify-center p-10 text-sm text-[var(--color-muted)]">
            Select a buyer to view details.
          </div>
        )}
      </div>
    </div>
  );
}
