"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { fetchJson } from "@/lib/fetchJson";
import { Product } from "@/types";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";

export default function WishlistPage() {
  const { productIds } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<Product[]>("/data/products.json")
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const items = products.filter((p) => productIds.includes(p.id));

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold text-slate-900">Wish List</h1>

      {items.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center gap-4 p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Heart size={26} />
          </span>
          <p className="text-slate-600">You haven&apos;t saved any products yet.</p>
          <Link href="/">
            <Button>Continue shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <ProductGrid products={items} />
        </div>
      )}
    </div>
  );
}
