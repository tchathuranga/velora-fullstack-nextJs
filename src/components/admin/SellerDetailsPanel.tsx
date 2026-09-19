import Link from "next/link";
import { Store, SellerStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/utils";

export function SellerDetailsPanel({
  store,
  status,
  onAction,
}: {
  store: Store;
  status: SellerStatus;
  onAction: (status: SellerStatus) => void;
}) {
  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">{store.storeName}</h2>
            <StatusBadge status={status} />
          </div>
          <Link href={`/store/${store.slug}`} className="link-blue text-sm">
            View public store page
          </Link>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onAction("active")}>
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAction("rejected")}>
            Decline
          </Button>
          <Button size="sm" variant="danger" onClick={() => onAction("limited")}>
            Limit
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Seller details</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Full Name" value={store.fullName} />
            <Row label="Address" value={store.address} />
            <Row label="Telephone" value={store.telephone} />
            <Row label="Business name" value={store.businessName} />
            <Row label="About Store" value={store.aboutStore} />
            <Row label="Created" value={formatDate(store.createdAt)} />
          </dl>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Seller payment details</h3>
          <p className="mb-2 text-xs text-[var(--color-muted)]">
            The admin should use this account to pay the seller&apos;s net sales amount.
          </p>
          <dl className="space-y-2 text-sm">
            <Row label="Name" value={store.bankDetails.name} />
            <Row label="Bank A/C Number" value={store.bankDetails.accountNumber} />
            <Row label="Bank name" value={store.bankDetails.bankName} />
            <Row label="Branch" value={store.bankDetails.branch} />
            <Row label="Contact number" value={store.bankDetails.contactNumber} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-1.5">
      <dt className="text-[var(--color-muted)]">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}
