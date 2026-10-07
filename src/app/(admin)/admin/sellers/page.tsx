"use client";

import { useState } from "react";
import { useStores } from "@/context/StoresContext";
import { getErrorMessage } from "@/Redux/api";
import { SellerStatus } from "@/types";
import { SellerList } from "@/components/admin/SellerList";
import { SellerDetailsPanel } from "@/components/admin/SellerDetailsPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageLoader } from "@/components/ui/PageLoader";

export default function AdminSellersPage() {
  const { stores, loading, updateStoreStatus } = useStores();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [tableQuery, setTableQuery] = useState("");
  const [error, setError] = useState("");

  if (loading) return <PageLoader />;

  const tq = tableQuery.trim().toLowerCase();
  const filteredStores = tq ? stores.filter((s) => s.storeName.toLowerCase().includes(tq)) : stores;

  const activeStore = stores.find((s) => s.id === selectedId) ?? stores[0] ?? null;

  const setStatus = (status: SellerStatus) => {
    if (!activeStore) return;
    updateStoreStatus(activeStore.id, status)
      .then(() => setError(""))
      .catch((err) => setError(getErrorMessage(err)));
  };

  return (
    <div className="container-page space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Seller control dashboard</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Approve, decline or limit sellers based on their store details and payment information.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <div className="card grid grid-cols-1 sm:grid-cols-[16rem_1fr]">
        <SellerList stores={stores} activeId={activeStore?.id ?? null} statuses={{}} onSelect={setSelectedId} />
        {activeStore ? (
          <div className="border-t border-[var(--color-border)] sm:border-l sm:border-t-0">
            <SellerDetailsPanel store={activeStore} status={activeStore.status} onAction={setStatus} />
          </div>
        ) : (
          <div className="flex items-center justify-center p-10 text-sm text-[var(--color-muted)]">
            Select a store to view details.
          </div>
        )}
      </div>

      <div>
        <h2 className="section-title mb-3">Seller list</h2>
        <input
          type="search"
          value={tableQuery}
          onChange={(e) => setTableQuery(e.target.value)}
          placeholder="Search sellers..."
          aria-label="Search sellers"
          className="mb-3 w-full max-w-sm rounded-md border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
        />
        <div className="card max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3">Store name</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredStores.map((store) => (
                <tr key={store.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{store.storeName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={store.status} />
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
