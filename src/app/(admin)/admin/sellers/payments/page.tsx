"use client";

import { useMemo, useState } from "react";
import { Search, Wallet } from "lucide-react";
import {
  getErrorMessage,
  useConfirmTransactionMutation,
  useGetPaymentsQuery,
  usePayOutStoreMutation,
} from "@/Redux/api";
import { useStores } from "@/context/StoresContext";
import { SellerPaymentsTable } from "@/components/admin/SellerPaymentsTable";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { calcTransactionFee, calcNetSale, formatCurrency, formatDate, nextBiweeklyMonday } from "@/lib/utils";

export default function AdminSellerPaymentsPage() {
  const { stores, loading: storesLoading } = useStores();
  const { data: payments, isLoading: paymentsLoading } = useGetPaymentsQuery();
  const [confirmTransaction] = useConfirmTransactionMutation();
  const [payOutStore, { isLoading: payingOut }] = usePayOutStoreMutation();
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [storeQuery, setStoreQuery] = useState("");
  const [error, setError] = useState("");

  const sellerTransactions = useMemo(() => payments?.transactions ?? [], [payments]);

  const filteredStores = useMemo(() => {
    const q = storeQuery.trim().toLowerCase();
    return q ? stores.filter((s) => s.storeName.toLowerCase().includes(q)) : stores;
  }, [stores, storeQuery]);

  // The picked store, or else the first one that has transactions (falling back to the first store).
  const storeId = filteredStores.some((s) => s.id === selectedStoreId)
    ? selectedStoreId
    : (filteredStores.find((s) => sellerTransactions.some((tx) => tx.storeId === s.id)) ?? filteredStores[0])?.id ?? "";

  const transactions = sellerTransactions.filter((tx) => tx.storeId === storeId);
  const paidOut = payments?.paidOut[storeId] ?? 0;

  const toggleConfirm = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    confirmTransaction({ id, confirmed: !tx.confirmed })
      .unwrap()
      .then(() => setError(""))
      .catch((err) => setError(getErrorMessage(err)));
  };

  const payOut = () => {
    payOutStore(storeId)
      .unwrap()
      .then(() => setError(""))
      .catch((err) => setError(getErrorMessage(err)));
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

  if (storesLoading || paymentsLoading) return <PageLoader />;

  return (
    <div className="container-page space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Seller payments</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Confirm received payments, then pay out available funds to the seller&apos;s bank account every
          other Monday.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <div className="grid max-w-xl gap-4 sm:grid-cols-2">
        <div className="relative">
          <Input
            label="Search stores"
            type="search"
            placeholder="Search by store name"
            value={storeQuery}
            onChange={(e) => setStoreQuery(e.target.value)}
            className="pl-9"
          />
          <Search size={16} className="pointer-events-none absolute bottom-3 left-3 text-[var(--color-muted)]" />
        </div>
        <Select label="Store" value={storeId} onChange={(e) => setSelectedStoreId(e.target.value)}>
          {filteredStores.length === 0 && <option value="">No stores found</option>}
          {filteredStores.map((s) => (
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
            <Button variant="danger" disabled={availableFunds === 0 || payingOut} onClick={payOut}>
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
