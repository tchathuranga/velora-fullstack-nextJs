"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/Redux/hooks";
import {
  ConditionChoice,
  loadProduct,
  resetProductForm,
  setCategory,
  setConditionChoice,
  setCustomSpecs,
  setField,
  setFreeDelivery,
  setReturnsAccepted,
  setStep,
  setSubmitted,
  setVariations,
  togglePaymentMethod,
} from "@/Redux/slices/productFormSlice";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { ProductPhotoGrid } from "@/components/seller/ProductPhotoGrid";
import { CustomSpecsEditor } from "@/components/seller/CustomSpecsEditor";
import { VariationAttributeBuilder } from "@/components/seller/VariationAttributeBuilder";
import { VariationImageBuilder } from "@/components/seller/VariationImageBuilder";
import { VariationSummaryTable } from "@/components/seller/VariationSummaryTable";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/context/CategoriesContext";
import { getCategoryById } from "@/lib/data/categories";
import { uploadImage } from "@/lib/upload";
import { CreateProductInput, getErrorMessage, useCreateProductMutation, useUpdateProductMutation } from "@/Redux/api";
import { VariationAttribute, PaymentMethod, Product } from "@/types";

/** The listing form, shared by "List a product" (no `product`) and "Edit listing" (`product` = the listing being edited). */
export function ProductForm({ product }: { product?: Product }) {
  const editing = Boolean(product);
  const router = useRouter();
  const { role, hydrated, storeSlug } = useAuth();
  const { categories } = useCategories();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const dispatch = useAppDispatch();
  const form = useAppSelector((state) => state.productForm);
  const {
    step,
    submitted,
    editingSlug,
    title,
    categoryId,
    subcategoryId,
    price,
    quantity,
    images,
    brand,
    conditionChoice,
    conditionCustom,
    size,
    color,
    packageInclude,
    customSpecs,
    description,
    handlingTime,
    deliveryTime,
    deliveryFee,
    extraDeliveryFee,
    freeDelivery,
    returnsAccepted,
    paymentMethods,
    location,
    variations,
  } = form;
  const [formError, setFormError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedCategory = getCategoryById(categories, categoryId);

  // Start from the right state when the page opens: the saved listing when editing, a blank (or in-progress) draft otherwise.
  const ready = editing ? editingSlug === product!.slug : editingSlug === null;
  useEffect(() => {
    if (ready) return;
    if (editing) dispatch(loadProduct(product!));
    else dispatch(resetProductForm());
  }, [ready, editing, product, dispatch]);

  // Opening "List a product" after a previous listing was submitted starts a fresh form, not the old success screen.
  useEffect(() => {
    if (!editing && submitted) dispatch(resetProductForm());
    // Only on arrival: the success screen itself must stay up right after submitting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated || !ready) return <PageLoader />;

  if (role !== "seller") {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-slate-600">Only approved sellers can {editing ? "edit" : "list"} products.</p>
        <Link href="/login">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  const hasVariations = Boolean(variations && variations.combinations.length > 0);
  const condition = conditionChoice === "custom" ? conditionCustom.trim() : conditionChoice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const hasContent = /<img\b/i.test(description) || description.replace(/<[^>]*>/g, "").trim();
    if (!hasContent) {
      setDescriptionError("Please add a description.");
      return;
    }
    setDescriptionError("");

    if (!brand.trim()) return setFormError("Brand name is required.");
    if (!condition) return setFormError(conditionChoice === "custom" ? "Please enter the product condition." : "Please select the product condition.");
    if (!/\d/.test(handlingTime) || !/\d/.test(deliveryTime)) {
      return setFormError('Handling time and delivery time must include the number of days, e.g. "2-3 days".');
    }
    if (paymentMethods.length === 0) return setFormError("Select at least one payment method.");
    if (!returnsAccepted) return setFormError("Please accept the return policy to continue.");

    const input: CreateProductInput = {
      title,
      categoryId: categoryId || null,
      subcategoryId: subcategoryId || null,
      price: Number(price) || 0,
      quantity: Math.max(0, Math.floor(Number(quantity)) || 0),
      brand: brand.trim(),
      condition,
      size: size || undefined,
      color: color || undefined,
      packageInclude: packageInclude || undefined,
      customSpecs,
      description,
      handlingTime,
      deliveryTime,
      freeDelivery,
      deliveryFee: freeDelivery ? 0 : Number(deliveryFee) || 0,
      extraDeliveryFee: freeDelivery ? 0 : Number(extraDeliveryFee) || 0,
      returnsAccepted: true,
      paymentMethods,
      location,
      images,
      variations: hasVariations ? variations : null,
    };

    setSubmitting(true);
    try {
      if (editing) {
        await updateProduct({ slug: product!.slug, input }).unwrap();
        dispatch(resetProductForm());
        router.push(`/product/${product!.slug}`);
        return;
      }
      await createProduct(input).unwrap();
      dispatch(setSubmitted(true));
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
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
    const options = new Set(variations.attributes.flatMap((a) => a.options));
    const keepUsed = (imgs: Record<string, string>) => Object.fromEntries(Object.entries(imgs).filter(([option]) => options.has(option)));
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
          initialImages={variations.images}
          initialCombinations={variations.combinations}
          onBack={(imgs, combinations) => {
            dispatch(setVariations({ ...variations, images: keepUsed(imgs), combinations }));
            dispatch(setStep("attributes"));
          }}
          onSave={(imgs, combinations) => {
            dispatch(setVariations({ ...variations, images: keepUsed(imgs), combinations }));
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
        <h1 className="text-2xl font-bold text-slate-900">{editing ? "Edit listing" : "List a product"}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {editing ? "Update your listing — changes appear on the product page as soon as you save." : "Fill in the details buyers will see on your listing."}
        </p>
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
          <Select label="Category" required value={categoryId} onChange={(e) => dispatch(setCategory(e.target.value))}>
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
            <option value="">{selectedCategory ? "Select a subcategory (optional)" : "Select a category first"}</option>
            {selectedCategory?.subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </Select>
        </div>

        <ProductPhotoGrid />

        {hasVariations ? (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-[var(--color-muted)]">
            Price and quantity are set for each variation below.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Price"
              type="number"
              min={0}
              step="any"
              required
              value={price}
              onChange={(e) => dispatch(setField({ field: "price", value: e.target.value }))}
            />
            <Input
              label="Quantity"
              type="number"
              min={0}
              step={1}
              required
              value={quantity}
              hint={editing ? "Add stock here to make an out-of-stock listing available again." : undefined}
              onChange={(e) => dispatch(setField({ field: "quantity", value: e.target.value }))}
            />
          </div>
        )}

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
          <button type="button" onClick={() => dispatch(setStep("attributes"))} className="link-blue text-sm font-medium">
            Add Variation
          </button>
        )}
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="section-title">Specification</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Brand name"
            required
            value={brand}
            onChange={(e) => dispatch(setField({ field: "brand", value: e.target.value }))}
          />
          <Select
            label="Condition"
            required
            value={conditionChoice}
            onChange={(e) => dispatch(setConditionChoice(e.target.value as ConditionChoice))}
          >
            <option value="">Select condition</option>
            <option value="New">New</option>
            <option value="Used">Used</option>
            <option value="custom">Add Your Own</option>
          </Select>
          {conditionChoice === "custom" && (
            <div className="sm:col-span-2">
              <Input
                label="Your condition"
                required
                maxLength={100}
                placeholder="e.g. Refurbished, Open box"
                value={conditionCustom}
                onChange={(e) => dispatch(setField({ field: "conditionCustom", value: e.target.value }))}
              />
            </div>
          )}
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
          placeholder="Describe your product... get creative with formatting, lists, quotes and photos"
          required
          error={descriptionError}
          value={description}
          onUploadImage={(file) => uploadImage(file, "product")}
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
          placeholder="e.g. 2-3 days"
          hint="Days you need to process the package before shipping. Buyers' delivery estimates and your ship-by deadline are worked out from this."
          value={handlingTime}
          onChange={(e) => dispatch(setField({ field: "handlingTime", value: e.target.value }))}
        />
        <Input
          label="Delivery time"
          required
          placeholder="e.g. 3-5 days"
          hint="Days the courier needs to deliver the package after it ships"
          value={deliveryTime}
          onChange={(e) => dispatch(setField({ field: "deliveryTime", value: e.target.value }))}
        />
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="section-title">Shipping cost</h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={freeDelivery}
            onChange={(e) => dispatch(setFreeDelivery(e.target.checked))}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          Free shipping
        </label>
        {!freeDelivery && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Shipping cost for the first item (Rs.)"
              required
              type="number"
              min={0}
              step="any"
              placeholder="e.g. 500"
              hint="The shipping fee for the first item in an order"
              value={deliveryFee}
              onChange={(e) => dispatch(setField({ field: "deliveryFee", value: e.target.value }))}
            />
            <Input
              label="Shipping cost for each additional item (Rs.)"
              required
              type="number"
              min={0}
              step="any"
              placeholder="e.g. 150"
              hint="Added for every further item of this listing in the same order"
              value={extraDeliveryFee}
              onChange={(e) => dispatch(setField({ field: "extraDeliveryFee", value: e.target.value }))}
            />
          </div>
        )}
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="section-title">Return policy</h2>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            required
            checked={returnsAccepted}
            onChange={(e) => dispatch(setReturnsAccepted(e.target.checked))}
            className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
          />
          <span>
            Seller accepts returns within 30 days. <span className="text-[var(--color-danger)]">*</span>
          </span>
        </label>
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="section-title">Payment method</h2>
        <p className="text-sm text-[var(--color-muted)]">Add your acceptable payment method</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={paymentMethods.includes("cod")}
              onChange={() => dispatch(togglePaymentMethod("cod" as PaymentMethod))}
            />
            Cash on delivery
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={paymentMethods.includes("bank_transfer")}
              onChange={() => dispatch(togglePaymentMethod("bank_transfer" as PaymentMethod))}
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

      {formError && (
        <p className="rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">{formError}</p>
      )}
      <div className="flex justify-end gap-3">
        {editing && (
          <Link href={`/product/${product!.slug}`}>
            <Button type="button" variant="outline" size="lg">
              Cancel
            </Button>
          </Link>
        )}
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? (editing ? "Saving…" : "Listing product…") : editing ? "Save changes" : "List product"}
        </Button>
      </div>
    </form>
  );
}
