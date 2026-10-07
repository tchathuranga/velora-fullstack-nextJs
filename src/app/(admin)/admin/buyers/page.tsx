"use client";

import { useState } from "react";
import { getErrorMessage, useGetAdminBuyersQuery, useSetBuyerStatusMutation } from "@/Redux/api";
import { BuyerList } from "@/components/admin/BuyerList";
import { BuyerDetailsPanel } from "@/components/admin/BuyerDetailsPanel";
import { PageLoader } from "@/components/ui/PageLoader";

export default function AdminBuyersPage() {
  const { data: buyers = [], isLoading } = useGetAdminBuyersQuery();
  const [setBuyerStatus] = useSetBuyerStatusMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (isLoading) return <PageLoader />;

  const activeBuyer = buyers.find((b) => b.id === selectedId) ?? buyers[0] ?? null;
  const statuses = Object.fromEntries(buyers.map((b) => [b.id, b.status]));

  const toggleLimit = () => {
    if (!activeBuyer) return;
    setBuyerStatus({ id: activeBuyer.id, status: activeBuyer.status === "active" ? "limited" : "active" })
      .unwrap()
      .then(() => setError(""))
      .catch((err) => setError(getErrorMessage(err)));
  };

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-slate-900">Buyer control dashboard</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Only registered buyers are listed here. Guest buyers do not appear.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <div className="card mt-6 grid grid-cols-1 sm:grid-cols-[16rem_1fr]">
        <BuyerList buyers={buyers} activeId={activeBuyer?.id ?? ""} statuses={statuses} onSelect={setSelectedId} />
        {activeBuyer ? (
          <div className="border-t border-[var(--color-border)] sm:border-l sm:border-t-0">
            <BuyerDetailsPanel buyer={activeBuyer} status={activeBuyer.status} onToggleLimit={toggleLimit} />
          </div>
        ) : (
          <div className="flex items-center justify-center p-10 text-sm text-[var(--color-muted)]">
            No registered buyers yet.
          </div>
        )}
      </div>
    </div>
  );
}
