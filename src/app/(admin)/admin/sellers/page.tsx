"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { Store, SellerStatus } from "@/types";
import { SellerList } from "@/components/admin/SellerList";
import { SellerDetailsPanel } from "@/components/admin/SellerDetailsPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageLoader } from "@/components/ui/PageLoader";

export default function AdminSellersPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [statuses, setStatuses] = useState<Record<string, SellerStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<Store[]>("/data/stores.json")
      .then((data) => {
        setStores(data);
        setActiveId(data[0]?.id ?? "");
        setStatuses(Object.fromEntries(data.map((s) => [s.id, s.status])));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const activeStore = stores.find((s) => s.id === activeId) ?? null;

  const setStatus = (status: SellerStatus) => {
    if (!activeStore) return;
    setStatuses((prev) => ({ ...prev, [activeStore.id]: status }));
  };

  return (
    <div className="container-page space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Seller control dashboard</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Approve, decline or limit sellers based on their store details and payment information.
        </p>
      </div>

      <div className="card grid grid-cols-1 sm:grid-cols-[16rem_1fr]">
        <SellerList stores={stores} activeId={activeId} statuses={statuses} onSelect={setActiveId} />
        {activeStore ? (
          <div className="border-t border-[var(--color-border)] sm:border-l sm:border-t-0">
            <SellerDetailsPanel store={activeStore} status={statuses[activeStore.id]} onAction={setStatus} />
          </div>
        ) : (
          <div className="flex items-center justify-center p-10 text-sm text-[var(--color-muted)]">
            Select a store to view details.
          </div>
        )}
      </div>

      <div>
        <h2 className="section-title mb-3">Seller list</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3">Store name</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {stores.map((store) => (
                <tr key={store.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{store.storeName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={statuses[store.id]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
