"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { fetchJson } from "@/lib/fetchJson";
import { Store, SellerTransaction } from "@/types";
import { SellerPaymentsTable } from "@/components/admin/SellerPaymentsTable";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { calcTransactionFee, calcNetSale, formatCurrency, formatDate, nextBiweeklyMonday } from "@/lib/utils";

export default function AdminSellerPaymentsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [sellerTransactions, setSellerTransactions] = useState<SellerTransaction[]>([]);
  const [storeId, setStoreId] = useState("");
  const [confirmedMap, setConfirmedMap] = useState<Record<string, boolean>>({});
  const [paidOut, setPaidOut] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchJson<Store[]>("/data/stores.json"), fetchJson<SellerTransaction[]>("/data/sellerTransactions.json")])
      .then(([storesData, transactionsData]) => {
        setStores(storesData);
        setSellerTransactions(transactionsData);
        const storesWithTransactions = storesData.filter((s) => transactionsData.some((tx) => tx.storeId === s.id));
        setStoreId(storesWithTransactions[0]?.id ?? storesData[0]?.id ?? "");
        setConfirmedMap(Object.fromEntries(transactionsData.map((tx) => [tx.id, tx.confirmed])));
      })
      .finally(() => setLoading(false));
  }, []);

  const transactions = sellerTransactions
    .filter((tx) => tx.storeId === storeId)
    .map((tx) => ({ ...tx, confirmed: confirmedMap[tx.id] }));

  const toggleConfirm = (id: string) => {
    setConfirmedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totals = useMemo(() => {
    const confirmed = transactions.filter((tx) => tx.confirmed);
    const amount = confirmed.reduce((sum, tx) => sum + tx.amount, 0);
    const bankFee = confirmed
      .filter((tx) => tx.paymentMethod === "bank_transfer")
      .reduce((sum, tx) => sum + calcTransactionFee(tx.amount), 0);
    const codFee = confirmed
      .filter((tx) => tx.paymentMethod === "cod")
      .reduce((sum, tx) => sum + calcTransactionFee(tx.amount), 0);
    const netSale = confirmed.reduce((sum, tx) => sum + calcNetSale(tx.amount), 0);
    return { amount, bankFee, codFee, netSale };
  }, [transactions]);

  const availableFunds = Math.max(0, totals.netSale - paidOut);

  if (loading) return <PageLoader />;

  return (
    <div className="container-page space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Seller payments</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Confirm received payments, then pay out available funds to the seller&apos;s bank account every
          other Monday.
        </p>
      </div>

      <div className="max-w-xs">
        <Select label="Store" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.storeName}
            </option>
          ))}
        </Select>
      </div>

      {transactions.length === 0 ? (
        <p className="card p-6 text-sm text-[var(--color-muted)]">No transactions recorded for this store yet.</p>
      ) : (
        <>
          <SellerPaymentsTable transactions={transactions} onToggleConfirm={toggleConfirm} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Confirmed amount" value={formatCurrency(totals.amount)} />
            <SummaryCard label="Bank transaction fee" value={formatCurrency(totals.bankFee)} />
            <SummaryCard label="COD transaction fee" value={formatCurrency(totals.codFee)} />
            <SummaryCard label="Net sale" value={formatCurrency(totals.netSale)} />
          </div>

          <div className="card flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                <Wallet size={20} />
              </span>
              <div>
                <p className="text-sm text-[var(--color-muted)]">Available Funds</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(availableFunds)}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  Next payout date: {formatDate(nextBiweeklyMonday().toISOString())}
                </p>
              </div>
            </div>
            <Button variant="danger" disabled={availableFunds === 0} onClick={() => setPaidOut(totals.netSale)}>
              Paid
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
