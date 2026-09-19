import { AlertCircle } from "lucide-react";
import { Buyer, BuyerStatus } from "@/types";
import { Button } from "@/components/ui/Button";

export function BuyerDetailsPanel({
  buyer,
  status,
  onToggleLimit,
}: {
  buyer: Buyer;
  status: BuyerStatus;
  onToggleLimit: () => void;
}) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{buyer.name}</h2>
          <p className="text-sm text-[var(--color-muted)]">{buyer.email}</p>
        </div>
        <Button
          variant={status === "active" ? "danger" : "outline"}
          size="sm"
          onClick={onToggleLimit}
        >
          {status === "active" ? "Limit" : "Reactivate"}
        </Button>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">About buyer</h3>
        {buyer.savedAddress && buyer.address ? (
          <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <Row label="Name" value={buyer.address.fullName} />
            <Row label="Address/Street" value={buyer.address.street} />
            <Row label="City" value={buyer.address.city} />
            <Row label="Province" value={buyer.address.province} />
            <Row label="Phone number" value={`${buyer.address.phone1} / ${buyer.address.phone2}`} />
            <Row label="Zip code" value={buyer.address.zipCode} />
            <Row label="Email" value={buyer.address.email ?? buyer.email} />
          </dl>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 text-sm text-[var(--color-muted)]">
            <AlertCircle size={16} />
            This buyer did not select &quot;Save my address&quot; at checkout, so no address is on file.
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}
