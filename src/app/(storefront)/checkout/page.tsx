"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setBilling, setBillingField, setPaymentMethod, setSaveAddress } from "@/store/checkoutSlice";
import { getBuyerById } from "@/lib/data/buyers";
import { fetchJson } from "@/lib/fetchJson";
import { BillingForm, BillingFormValues } from "@/components/checkout/BillingForm";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Button } from "@/components/ui/Button";
import { FLAT_DELIVERY_COST } from "@/components/cart/CartSummary";
import { Order, Buyer } from "@/types";
import { saveOrder, generateOrderId } from "@/lib/orderStorage";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { role, buyerId } = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const billing = useAppSelector((state) => state.checkout.billing);
  const saveAddress = useAppSelector((state) => state.checkout.saveAddress);
  const paymentMethod = useAppSelector((state) => state.checkout.paymentMethod);

  const canSaveAddress = role === "buyer";
  const hasPrefilled = useRef(false);

  useEffect(() => {
    if (hasPrefilled.current || !canSaveAddress || !buyerId) return;
    hasPrefilled.current = true;

    // Prefills once the logged-in buyer's identity resolves (post-hydration) and their
    // saved address is fetched; not a render-time derivation.
    fetchJson<Buyer[]>("/data/buyers.json").then((buyers) => {
      const buyer = getBuyerById(buyers, buyerId);
      if (buyer?.savedAddress && buyer.address) {
        dispatch(
          setBilling({
            fullName: buyer.address.fullName,
            street: buyer.address.street,
            city: buyer.address.city,
            province: buyer.address.province,
            phone1: buyer.address.phone1,
            phone2: buyer.address.phone2,
            zipCode: buyer.address.zipCode,
            email: buyer.address.email ?? "",
            orderNote: "",
          }),
        );
        dispatch(setSaveAddress(true));
      }
    });
  }, [canSaveAddress, buyerId, dispatch]);

  const deliveryCost = items.length > 0 ? FLAT_DELIVERY_COST : 0;

  const onChange = <K extends keyof BillingFormValues>(field: K, value: BillingFormValues[K]) => {
    dispatch(setBillingField({ field, value }));
  };

  const placeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const orderId = generateOrderId();
    const order: Order = {
      id: orderId,
      buyerName: billing.fullName,
      items: items.map((i) => ({
        productId: i.productId,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        icon: i.icon,
        storeId: i.storeId,
      })),
      subtotal,
      deliveryCost,
      total: subtotal + deliveryCost,
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
      saveAddress,
      status: "processing",
      createdAt: new Date().toISOString(),
      trackingSteps: [
        { label: "Order placed", done: true, date: new Date().toISOString().slice(0, 10) },
        { label: "Handed to courier", done: false },
        { label: "Out for delivery", done: false },
        { label: "Delivered", done: false },
      ],
    };

    saveOrder(order);
    clearCart();
    router.push(`/order/${orderId}/confirmation?method=${paymentMethod}`);
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
            <PaymentMethodSelector value={paymentMethod} onChange={(value) => dispatch(setPaymentMethod(value))} />
          </div>
        </div>

        <div className="space-y-4">
          <OrderSummary items={items} subtotal={subtotal} deliveryCost={deliveryCost} />
          <Button type="submit" fullWidth size="lg">
            Place order
          </Button>
        </div>
      </div>
    </form>
  );
}
