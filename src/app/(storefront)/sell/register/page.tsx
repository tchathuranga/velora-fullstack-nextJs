"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ImageDropzone } from "@/components/ui/ImageDropzone";
import { PageLoader } from "@/components/ui/PageLoader";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage, useCreateStoreMutation } from "@/Redux/api";

export default function SellRegisterPage() {
  const router = useRouter();
  const { hydrated, username, sellerStoreSlug } = useAuth();
  const [createStore, { isLoading: submitting }] = useCreateStoreMutation();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (!username) router.replace("/signup?next=/sell/register");
    else if (sellerStoreSlug) router.replace("/sell/pending");
  }, [hydrated, username, sellerStoreSlug, router]);

  if (!hydrated || !username || sellerStoreSlug) return <PageLoader />;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const data = new FormData(e.currentTarget);
    const field = (name: string) => ((data.get(name) as string) ?? "").trim();

    try {
      await createStore({
        businessName: field("businessName"),
        fullName: field("fullName"),
        address: field("address"),
        telephone: field("telephone"),
        email: field("email"),
        aboutStore: field("aboutStore"),
        bankDetails: {
          name: field("bank1Name"),
          accountNumber: field("bank1AccountNumber"),
          bankName: field("bank1BankName"),
          branch: field("bank1Branch"),
          contactNumber: field("bank1ContactNumber"),
        },
        ...(field("bank2AccountNumber")
          ? {
              bankDetailsOptional: {
                name: field("bank2Name"),
                accountNumber: field("bank2AccountNumber"),
                bankName: field("bank2BankName"),
                branch: field("bank2Branch"),
                contactNumber: field("bank2ContactNumber"),
              },
            }
          : {}),
      }).unwrap();

      // The store starts "under review" until an admin approves it (/admin/sellers).
      router.push("/sell/pending");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-slate-900">Create your store</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Tell us about your business and where we should send your payouts.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-10">
        <section className="card space-y-5 p-6">
          <h2 className="section-title">Business information</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Full name" name="fullName" required />
            <Input label="Business name" name="businessName" required />
          </div>
          <Input label="Business Address" name="address" required />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Business Telephone" name="telephone" type="tel" required />
            <Input label="Business Email address" name="email" type="email" required />
          </div>
          <Textarea label="About your store" name="aboutStore" required placeholder="Tell buyers what you sell and what makes your store special" />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Cover photo</span>
              <ImageDropzone label="Upload cover photo" className="aspect-video" />
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Profile photo</span>
              <ImageDropzone label="Upload profile photo" className="mx-auto max-w-40" />
            </div>
          </div>
        </section>

        <section className="card space-y-5 p-6">
          <h2 className="section-title">Payment information</h2>

          <div>
            <p className="mb-3 text-sm font-semibold text-slate-800">
              Bank details <span className="text-[var(--color-danger)]">*</span>
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Name" name="bank1Name" required />
              <Input label="Bank account number" name="bank1AccountNumber" required />
              <Input label="Bank name" name="bank1BankName" required />
              <Input label="Branch" name="bank1Branch" required />
              <Input label="Contact number" name="bank1ContactNumber" type="tel" required />
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-slate-800">Bank details (optional)</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Name" name="bank2Name" />
              <Input label="Bank account number" name="bank2AccountNumber" />
              <Input label="Bank name" name="bank2BankName" />
              <Input label="Branch" name="bank2Branch" />
              <Input label="Contact number" name="bank2ContactNumber" type="tel" />
            </div>
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">{error}</p>
        )}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Creating store…" : "Create your store"}
          </Button>
        </div>
      </form>
    </div>
  );
}
