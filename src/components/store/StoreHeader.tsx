import { Store as StoreIcon } from "lucide-react";
import { Store } from "@/types";
import { ContactSellerButton } from "@/components/store/ContactSellerButton";

export function StoreHeader({ store }: { store: Store }) {
  return (
    <div className="card overflow-hidden">
      <div className={`relative flex h-32 items-center justify-center bg-gradient-to-br sm:h-48 ${store.coverColor}`}>
        <span className="text-lg font-semibold text-white/90 sm:text-xl">{store.storeName}</span>
      </div>
      <div className="flex flex-col items-start gap-4 px-6 pb-6 pt-4 sm:flex-row sm:items-center">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-white text-white shadow-md sm:h-20 sm:w-20 ${store.profileColor}`}
        >
          <StoreIcon size={28} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{store.storeName}</h1>
          <p className="text-sm text-[var(--color-muted)]">{store.address}</p>
        </div>
        <div>
          <ContactSellerButton storeId={store.id} />
        </div>
      </div>
    </div>
  );
}
