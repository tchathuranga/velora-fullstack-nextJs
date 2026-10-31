"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { skipToken } from "@reduxjs/toolkit/query";
import { AlertCircle, LogIn } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { getErrorMessage, useGetProductQuery, usePlaceOrderMutation } from "@/Redux/api";
import { useAppDispatch, useAppSelector } from "@/Redux/hooks";
import { resetCheckout, setBilling, setBillingField, setPaymentMethod, setSaveAddress } from "@/Redux/slices/checkoutSlice";
import type { CartItem } from "@/Redux/slices/cartSlice";
import { BillingForm, BillingFormValues } from "@/components/checkout/BillingForm";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { CheckoutLine, buildLine, linesShipping, linesSubtotal } from "@/lib/checkout";
import { PaymentMethod } from "@/types";

const ALL_PAYMENT_METHODS: PaymentMethod[] = ["cod", "bank_transfer"];

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buySlug = searchParams.get("buy");
  const buyVariation = searchParams.get("variation") ?? undefined;
  const buyQtyParam = Math.max(1, Math.floor(Number(searchParams.get("qty"))) || 1);

  const { items, updateQuantity, clearCart } = useCart();
  const { products, loading: productsLoading } = useProducts();
  const { role, hydrated, address } = useAuth();
  const { data: buyProduct, isLoading: buyLoading } = useGetProductQuery(buySlug ?? skipToken);
  const [submitOrder, { isLoading: placing }] = usePlaceOrderMutation();
  const [error, setError] = useState("");
  const [buyQty, setBuyQty] = useState<number | null>(null);
  const dispatch = useAppDispatch();
  const billing = useAppSelector((state) => state.checkout.billing);
  const saveAddress = useAppSelector((state) => state.checkout.saveAddress);
  const paymentMethod = useAppSelector((state) => state.checkout.paymentMethod);

  // "Buy it now" checks out one product directly (the cart is untouched); otherwise the cart is checked out.
  const lines = useMemo<CheckoutLine[]>(() => {
    if (buySlug) {
      if (!buyProduct || buyProduct.status !== "active") return [];
      const combo = buyProduct.variations?.combinations.find((c) => c.id === buyVariation);
      const item: CartItem = {
        productId: buyProduct.id,
        slug: buyProduct.slug,
        title: buyProduct.title,
        price: combo?.price ?? buyProduct.price,
        quantity: buyQty ?? buyQtyParam,
        icon: buyProduct.icon,
        storeId: buyProduct.storeId,
        paymentMethods: buyProduct.paymentMethods,
        ...(combo ? { variationId: combo.id, variation: combo.values } : {}),
      };
      // A variation listing needs a valid variation; otherwise show it as unavailable instead of silently picking one.
      const line = buildLine(item, buyProduct);
      if (buyProduct.variations?.combinations.length && !combo) line.unavailable = true;
      return [line];
    }
    return items.map((item) => buildLine(item, products.find((p) => p.id === item.productId)));
  }, [buySlug, buyProduct, buyVariation, buyQty, buyQtyParam, items, products]);

  // Only offer a payment method if every item accepts it.
  const allowedPaymentMethods = ALL_PAYMENT_METHODS.filter((method) => lines.every((l) => l.paymentMethods.includes(method)));
  const hasProblem = lines.some((l) => l.unavailable || l.stock === 0 || l.quantity > l.stock);

  const canSaveAddress = role === "buyer" || role === "seller";
  const hasPrefilled = useRef(false);

  useEffect(() => {
    if (allowedPaymentMethods.length > 0 && !allowedPaymentMethods.includes(paymentMethod)) {
      dispatch(setPaymentMethod(allowedPaymentMethods[0]));
    }
  }, [allowedPaymentMethods, paymentMethod, dispatch]);

  // Prefill from the address saved on the signed-in account (once, as soon as the session resolves).
  useEffect(() => {
    if (hasPrefilled.current || !address) return;
    hasPrefilled.current = true;
    dispatch(setBilling({ ...address, email: address.email ?? "", orderNote: "" }));
    dispatch(setSaveAddress(true));
  }, [address, dispatch]);

  if (!hydrated || productsLoading || (buySlug && buyLoading)) return <PageLoader />;

  // Buyers must have an account before they can purchase.
  if (role === "guest") {
    const here = `/checkout${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <LogIn size={26} />
        </span>
        <h1 className="text-xl font-semibold text-slate-900">Sign in to place your order</h1>
        <p className="max-w-sm text-sm text-[var(--color-muted)]">You need a won.lk account to buy. Your selection will be waiting for you.</p>
        <div className="flex gap-3">
          <Link href={`/login?next=${encodeURIComponent(here)}`}>
            <Button>Log in</Button>
          </Link>
          <Link href={`/signup?next=${encodeURIComponent(here)}`}>
            <Button variant="outline">Create an account</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (role === "admin") {
    return (
      <div className="container-page flex min-h-[50vh] items-center justify-center py-16 text-slate-600">
        Admin accounts can&apos;t place orders.
      </div>
    );
  }

  const subtotal = linesSubtotal(lines);
  const deliveryCost = linesShipping(lines);

  const changeQuantity = (line: CheckoutLine, quantity: number) => {
    const next = Math.min(Math.max(1, quantity), Math.max(line.stock, 1));
    if (buySlug) setBuyQty(next);
    else updateQuantity(line.productId, line.variationId, next);
  };

  const onChange = <K extends keyof BillingFormValues>(field: K, value: BillingFormValues[K]) => {
    dispatch(setBillingField({ field, value }));
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0 || allowedPaymentMethods.length === 0 || hasProblem) return;
    setError("");

    try {
      const order = await submitOrder({
        items: lines.map((l) => ({ productId: l.productId, variationId: l.variationId, quantity: l.quantity })),
        paymentMethod,
        billing: {
          fullName: billing.fullName,
          street: billing.street,
          city: billing.city,
          province: billing.province,
          phone1: billing.phone1,
          phone2: billing.phone2,
          zipCode: billing.zipCode,
          email: billing.email || undefined,
        },
        orderNote: billing.orderNote || undefined,
        saveAddress: canSaveAddress && saveAddress,
      }).unwrap();

      if (!buySlug) clearCart();
      dispatch(resetCheckout());
      router.push(`/order/${order.id}/confirmation?method=${paymentMethod}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (lines.length === 0) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-slate-600">
          {buySlug ? "This product isn't available any more." : "Your cart is empty — add some products before checking out."}
        </p>
        <Link href="/">
          <Button>Continue shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={placeOrder} className="container-page py-8">
      <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <BillingForm
            values={billing}
            onChange={onChange}
            saveAddress={saveAddress}
            onToggleSaveAddress={(value) => dispatch(setSaveAddress(value))}
            canSaveAddress={canSaveAddress}
          />
          <div className="card p-6">
            <h2 className="section-title mb-4">Payment method</h2>
            {allowedPaymentMethods.length > 0 ? (
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={(value) => dispatch(setPaymentMethod(value))}
                allowed={allowedPaymentMethods}
              />
            ) : (
              <p className="flex items-start gap-2 rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                These items don&apos;t share a common payment method. Please check out the conflicting items
                separately.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <OrderSummary lines={lines} subtotal={subtotal} deliveryCost={deliveryCost} onQuantityChange={changeQuantity} />
          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
          <Button type="submit" fullWidth size="lg" disabled={allowedPaymentMethods.length === 0 || hasProblem || placing}>
            {placing ? "Placing order…" : "Place order"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CheckoutInner />
    </Suspense>
  );
}
