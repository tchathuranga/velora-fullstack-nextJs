"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage, usePlaceOrderMutation } from "@/Redux/api";
import { useAppDispatch, useAppSelector } from "@/Redux/hooks";
import { resetCheckout, setBilling, setBillingField, setPaymentMethod, setSaveAddress } from "@/Redux/slices/checkoutSlice";
import { BillingForm, BillingFormValues } from "@/components/checkout/BillingForm";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Button } from "@/components/ui/Button";
import { calculateDeliveryCost } from "@/components/cart/CartSummary";
import { PaymentMethod } from "@/types";

const ALL_PAYMENT_METHODS: PaymentMethod[] = ["cod", "bank_transfer"];

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { role, address } = useAuth();
  const [submitOrder, { isLoading: placing }] = usePlaceOrderMutation();
  const [error, setError] = useState("");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const billing = useAppSelector((state) => state.checkout.billing);
  const saveAddress = useAppSelector((state) => state.checkout.saveAddress);
  const paymentMethod = useAppSelector((state) => state.checkout.paymentMethod);

  // Only offer a payment method if every item in the cart accepts it — older carts saved
  // before this field existed are treated as accepting both, so they aren't blocked.
  const allowedPaymentMethods = ALL_PAYMENT_METHODS.filter((method) =>
    items.every((item) => (item.paymentMethods ?? ALL_PAYMENT_METHODS).includes(method)),
  );

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

  const deliveryCost = calculateDeliveryCost(items);

  const onChange = <K extends keyof BillingFormValues>(field: K, value: BillingFormValues[K]) => {
    dispatch(setBillingField({ field, value }));
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || allowedPaymentMethods.length === 0) return;
    setError("");

    try {
      const order = await submitOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
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

      clearCart();
      dispatch(resetCheckout());
      router.push(`/order/${order.id}/confirmation?method=${paymentMethod}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-slate-600">Your cart is empty — add some products before checking out.</p>
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
          <OrderSummary items={items} subtotal={subtotal} deliveryCost={deliveryCost} />
          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
          <Button type="submit" fullWidth size="lg" disabled={allowedPaymentMethods.length === 0 || placing}>
            {placing ? "Placing order…" : "Place order"}
          </Button>
        </div>
      </div>
    </form>
  );
}
