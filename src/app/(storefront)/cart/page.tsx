"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart, MAX_CART_ITEMS } from "@/context/CartContext";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { fetchJson } from "@/lib/fetchJson";
import { Product } from "@/types";

export default function CartPage() {
  const { items, subtotal, itemCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<Product[]>("/data/products.json")
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold text-slate-900">Cart</h1>

      {items.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center gap-4 p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <ShoppingCart size={26} />
          </span>
          <p className="text-slate-600">Your cart is empty.</p>
          <Link href="/">
            <Button>Continue shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="card divide-y divide-[var(--color-border)] px-5 lg:col-span-2">
            {items.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                product={products.find((p) => p.id === item.productId)}
              />
            ))}
          </div>
          <div>
            <CartSummary subtotal={subtotal} itemCount={itemCount} />
            <p className="mt-3 text-center text-xs text-[var(--color-muted)]">
              {itemCount} / {MAX_CART_ITEMS} items in cart (maximum {MAX_CART_ITEMS} items can add to cart)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
