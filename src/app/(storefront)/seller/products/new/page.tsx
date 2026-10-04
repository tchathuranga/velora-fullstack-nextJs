"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  resetProductForm,
  setCategory,
  setCustomSpecs,
  setField,
  setFreeDelivery,
  setStep,
  setSubmitted,
  setVariations,
  togglePaymentMethod,
} from "@/store/productFormSlice";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { ProductPhotoGrid } from "@/components/seller/ProductPhotoGrid";
import { CustomSpecsEditor } from "@/components/seller/CustomSpecsEditor";
import { VariationAttributeBuilder } from "@/components/seller/VariationAttributeBuilder";
import { VariationImageBuilder } from "@/components/seller/VariationImageBuilder";
import { VariationSummaryTable } from "@/components/seller/VariationSummaryTable";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { useCategories } from "@/context/CategoriesContext";
import { useStores } from "@/context/StoresContext";
import { getStoreBySlug } from "@/lib/data/stores";
import { getCategoryById } from "@/lib/data/categories";
import { fileToDataUrl } from "@/lib/image";
import { VariationAttribute, PaymentMethod, Product } from "@/types";

function slugify(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "product";
}

export default function NewProductPage() {
  const { storeSlug } = useAuth();
  const { addProduct } = useProducts();
  const { categories } = useCategories();
  const { stores } = useStores();
  const dispatch = useAppDispatch();
  const step = useAppSelector((state) => state.productForm.step);
  const submitted = useAppSelector((state) => state.productForm.submitted);
  const title = useAppSelector((state) => state.productForm.title);
  const categoryId = useAppSelector((state) => state.productForm.categoryId);
  const subcategoryId = useAppSelector((state) => state.productForm.subcategoryId);
  const price = useAppSelector((state) => state.productForm.price);
  const quantity = useAppSelector((state) => state.productForm.quantity);
  const brand = useAppSelector((state) => state.productForm.brand);
  const size = useAppSelector((state) => state.productForm.size);
  const color = useAppSelector((state) => state.productForm.color);
  const packageInclude = useAppSelector((state) => state.productForm.packageInclude);
  const customSpecs = useAppSelector((state) => state.productForm.customSpecs);
  const description = useAppSelector((state) => state.productForm.description);
  const handlingTime = useAppSelector((state) => state.productForm.handlingTime);
  const deliveryTime = useAppSelector((state) => state.productForm.deliveryTime);
  const deliveryFee = useAppSelector((state) => state.productForm.deliveryFee);
  const freeDelivery = useAppSelector((state) => state.productForm.freeDelivery);
  const paymentMethods = useAppSelector((state) => state.productForm.paymentMethods);
  const location = useAppSelector((state) => state.productForm.location);
  const variations = useAppSelector((state) => state.productForm.variations);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [descriptionError, setDescriptionError] = useState("");
  const selectedCategory = getCategoryById(categories, categoryId);

  const togglePayment = (method: PaymentMethod) => {
    dispatch(togglePaymentMethod(method));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const plainDescription = description.replace(/<[^>]*>/g, "").trim();
    if (!plainDescription) {
      setDescriptionError("Please add a description.");
      return;
    }
    setDescriptionError("");

    const store = storeSlug ? getStoreBySlug(stores, storeSlug) : undefined;
    const id = `p-${Date.now()}`;
    const images = await Promise.all(photoFiles.map((file) => fileToDataUrl(file))).catch(() => []);

    const newProduct: Product = {
      id,
      slug: `${slugify(title)}-${id.slice(2)}`,
      title,
      storeId: store?.id ?? "",
      price: Number(price) || 0,
      quantity: Number(quantity) || 0,
      brand: brand || undefined,
      size: size || undefined,
      color: color || undefined,
      packageInclude: packageInclude || undefined,
      customSpecs,
      description,
      handlingTime,
      deliveryTime,
      freeDelivery,
      deliveryFee: freeDelivery ? 0 : Number(deliveryFee) || 0,
      paymentMethods,
      location,
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      icon: "",
      galleryCount: Math.max(images.length, 1),
      images: images.length ? images : undefined,
      tags: ["new"],
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      variations: variations ?? undefined,
    };

    addProduct(newProduct);
    dispatch(setSubmitted(true));
  };

  if (step === "attributes") {
    return (
      <div className="container-page max-w-3xl py-10">
        <VariationAttributeBuilder
          initial={variations?.attributes ?? []}
          onCancel={() => dispatch(setStep("form"))}
          onContinue={(attributes: VariationAttribute[]) => {
            dispatch(setVariations({ attributes, images: variations?.images ?? {}, combinations: variations?.combinations ?? [] }));
            dispatch(setStep("images"));
          }}
        />
      </div>
    );
  }

  if (step === "images" && variations) {
    return (
      <div className="container-page max-w-4xl space-y-8 py-10">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-slate-900">Main images</h2>
          <div className="mt-4">
            <ProductPhotoGrid />
          </div>
        </div>
        <VariationImageBuilder
          attributes={variations.attributes}
          basePrice={Number(price) || 0}
          onCancel={() => dispatch(setStep("attributes"))}
          onSave={(images, combinations) => {
            if (variations) {
              dispatch(setVariations({ ...variations, images, combinations }));
            }
            dispatch(setStep("form"));
          }}
        />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-light)] text-[var(--color-success)]">
          <CheckCircle2 size={28} />
        </span>
        <h1 className="text-xl font-bold text-slate-900">Product listed successfully</h1>
        <p className="max-w-sm text-sm text-[var(--color-muted)]">
          &quot;{title}&quot; has been added to your store.
        </p>
        <div className="flex gap-3">
          <Link href={`/store/${storeSlug}`}>
            <Button>View my store</Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => {
              dispatch(resetProductForm());
              setDescriptionError("");
            }}
          >
            List another product
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="container-page max-w-3xl space-y-8 py-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">List a product</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Fill in the details buyers will see on your listing.</p>
      </div>

      <section className="card space-y-5 p-6">
        <div>
          <Input
            label="Product title"
            required
            maxLength={100}
            value={title}
            onChange={(e) => dispatch(setField({ field: "title", value: e.target.value }))}
            hint={`${title.length}/100 letters`}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Category"
            required
            value={categoryId}
            onChange={(e) => dispatch(setCategory(e.target.value))}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            label="Subcategory"
            value={subcategoryId}
            disabled={!selectedCategory || selectedCategory.subcategories.length === 0}
            onChange={(e) => dispatch(setField({ field: "subcategoryId", value: e.target.value }))}
          >
            <option value="">
              {selectedCategory ? "Select a subcategory (optional)" : "Select a category first"}
            </option>
            {selectedCategory?.subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </Select>
        </div>

        <ProductPhotoGrid onPhotosChange={setPhotoFiles} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Price"
            type="number"
            min={0}
            required
            value={price}
            onChange={(e) => dispatch(setField({ field: "price", value: e.target.value }))}
          />
          <Input
            label="Quantity"
            type="number"
            min={0}
            required
            value={quantity}
            onChange={(e) => dispatch(setField({ field: "quantity", value: e.target.value }))}
          />
        </div>

        {variations ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Variations</p>
              <div className="flex gap-3 text-sm">
                <button type="button" onClick={() => dispatch(setStep("attributes"))} className="link-blue font-medium">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(setVariations(null))}
                  className="font-medium text-[var(--color-danger)] hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
            <VariationSummaryTable variations={variations} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => dispatch(setStep("attributes"))}
            className="link-blue text-sm font-medium"
          >
            Add Variation
          </button>
        )}
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="section-title">Specification</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Brand" value={brand} onChange={(e) => dispatch(setField({ field: "brand", value: e.target.value }))} />
          <Input label="Size" value={size} onChange={(e) => dispatch(setField({ field: "size", value: e.target.value }))} />
          <Input label="Color" value={color} onChange={(e) => dispatch(setField({ field: "color", value: e.target.value }))} />
          <Input
            label="Package include"
            value={packageInclude}
            onChange={(e) => dispatch(setField({ field: "packageInclude", value: e.target.value }))}
          />
        </div>
        <CustomSpecsEditor specs={customSpecs} onChange={(value) => dispatch(setCustomSpecs(value))} />
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="section-title">Description</h2>
        <RichTextEditor
          placeholder="Describe your product... get creative with formatting, lists, and quotes"
          required
          error={descriptionError}
          value={description}
          onChange={(html) => {
            dispatch(setField({ field: "description", value: html }));
            if (descriptionError) setDescriptionError("");
          }}
        />
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="section-title">Delivery details</h2>
        <Input
          label="Handling time"
          required
          placeholder="e.g. 1-2 business days"
          hint="The time period the seller needs to process the package before shipping"
          value={handlingTime}
          onChange={(e) => dispatch(setField({ field: "handlingTime", value: e.target.value }))}
        />
        <Input
          label="Delivery time"
          required
          placeholder="e.g. 3-5 business days"
          hint="The time period within which the package is expected to be delivered"
          value={deliveryTime}
          onChange={(e) => dispatch(setField({ field: "deliveryTime", value: e.target.value }))}
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={freeDelivery}
            onChange={(e) => dispatch(setFreeDelivery(e.target.checked))}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          Free delivery
        </label>
        {!freeDelivery && (
          <Input
            label="Delivery fee (LKR)"
            required
            type="number"
            min={0}
            placeholder="e.g. 350"
            hint="Charged once per product at checkout"
            value={deliveryFee}
            onChange={(e) => dispatch(setField({ field: "deliveryFee", value: e.target.value }))}
          />
        )}
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="section-title">Payment method</h2>
        <p className="text-sm text-[var(--color-muted)]">Add your acceptable payment method</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={paymentMethods.includes("cod")} onChange={() => togglePayment("cod")} />
            Cash on delivery
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={paymentMethods.includes("bank_transfer")}
              onChange={() => togglePayment("bank_transfer")}
            />
            Bank transfer
          </label>
        </div>
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="section-title">Location</h2>
        <Input
          label="Store location"
          required
          placeholder="Ex: Colombo, Sri lanka"
          value={location}
          onChange={(e) => dispatch(setField({ field: "location", value: e.target.value }))}
        />
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          List product
        </Button>
      </div>
    </form>
  );
}
