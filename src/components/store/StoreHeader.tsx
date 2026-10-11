"use client";

import { useState } from "react";
import { Store as StoreIcon } from "lucide-react";
import { Store } from "@/types";
import { ContactSellerButton } from "@/components/store/ContactSellerButton";
import { ImageUploadButton } from "@/components/ui/ImageUploadButton";
import { useAuth } from "@/context/AuthContext";
import { useUpdateStoreImagesMutation } from "@/Redux/api";

export function StoreHeader({ store }: { store: Store }) {
  const { role, storeSlug } = useAuth();
  const [updateStoreImages] = useUpdateStoreImagesMutation();
  const [imageError, setImageError] = useState("");
  const isOwner = role === "seller" && storeSlug === store.slug;

  return (
    <div className="card overflow-hidden">
      <div
        className={`relative flex h-32 items-center justify-center bg-gradient-to-br bg-cover bg-center sm:h-48 ${store.coverColor}`}
        style={store.coverImage ? { backgroundImage: `url(${store.coverImage})` } : undefined}
      >
        {!store.coverImage && <span className="text-lg font-semibold text-white/90 sm:text-xl">{store.storeName}</span>}
        {isOwner && (
          <ImageUploadButton
            kind="store-cover"
            label={store.coverImage ? "Change cover photo" : "Add cover photo"}
            className="absolute right-3 top-3"
            onError={setImageError}
            onUploaded={(url) => updateStoreImages({ coverImage: url }).unwrap()}
          />
        )}
      </div>
      <div className="flex flex-col items-start gap-4 px-6 pb-6 pt-4 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          <div
            className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white text-white shadow-md sm:h-20 sm:w-20 ${store.profileColor}`}
          >
            {store.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.profileImage} alt={store.storeName} className="h-full w-full object-cover" />
            ) : (
              <StoreIcon size={28} />
            )}
          </div>
          {isOwner && (
            <ImageUploadButton
              kind="store-avatar"
              label={store.profileImage ? "Change profile picture" : "Add profile picture"}
              className="absolute -bottom-1 -right-1 !h-7 !w-7 border border-[var(--color-border)]"
              onError={setImageError}
              onUploaded={(url) => updateStoreImages({ profileImage: url }).unwrap()}
            />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{store.storeName}</h1>
          <p className="text-sm text-[var(--color-muted)]">{store.address}</p>
          {imageError && <p className="mt-1 text-sm text-[var(--color-danger)]">{imageError}</p>}
        </div>
        <div>
          <ContactSellerButton storeId={store.id} />
        </div>
      </div>
    </div>
  );
}
