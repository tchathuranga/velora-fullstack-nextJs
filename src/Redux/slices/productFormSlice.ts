import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PaymentMethod, Product, ProductVariations, SpecEntry } from "@/types";

export const MAX_IMAGES = 13;

export type ConditionChoice = "" | "New" | "Used" | "custom";

export interface ProductFormState {
  step: "form" | "attributes" | "images";
  submitted: boolean;
  /** Slug of the listing being edited; null while creating a new one. */
  editingSlug: string | null;
  title: string;
  categoryId: string;
  subcategoryId: string;
  price: string;
  quantity: string;
  /** Hosted (Cloudinary) URLs in display order; the first is the main image. */
  images: string[];
  brand: string;
  conditionChoice: ConditionChoice;
  conditionCustom: string;
  size: string;
  color: string;
  packageInclude: string;
  customSpecs: SpecEntry[];
  description: string;
  handlingTime: string;
  deliveryTime: string;
  deliveryFee: string;
  extraDeliveryFee: string;
  freeDelivery: boolean;
  returnsAccepted: boolean;
  paymentMethods: PaymentMethod[];
  location: string;
  variations: ProductVariations | null;
}

const initialState: ProductFormState = {
  step: "form",
  submitted: false,
  editingSlug: null,
  title: "",
  categoryId: "",
  subcategoryId: "",
  price: "",
  quantity: "",
  images: [],
  brand: "",
  conditionChoice: "",
  conditionCustom: "",
  size: "",
  color: "",
  packageInclude: "",
  customSpecs: [],
  description: "",
  handlingTime: "",
  deliveryTime: "",
  deliveryFee: "",
  extraDeliveryFee: "",
  freeDelivery: false,
  returnsAccepted: false,
  paymentMethods: [],
  location: "",
  variations: null,
};

type TextField =
  | "title"
  | "subcategoryId"
  | "price"
  | "quantity"
  | "brand"
  | "conditionCustom"
  | "size"
  | "color"
  | "packageInclude"
  | "description"
  | "handlingTime"
  | "deliveryTime"
  | "deliveryFee"
  | "extraDeliveryFee"
  | "location";

const productFormSlice = createSlice({
  name: "productForm",
  initialState,
  reducers: {
    setStep: (state, action: PayloadAction<ProductFormState["step"]>) => {
      state.step = action.payload;
    },
    setSubmitted: (state, action: PayloadAction<boolean>) => {
      state.submitted = action.payload;
    },
    setField: (state, action: PayloadAction<{ field: TextField; value: string }>) => {
      const { field, value } = action.payload;
      state[field] = value;
    },
    setFreeDelivery: (state, action: PayloadAction<boolean>) => {
      state.freeDelivery = action.payload;
    },
    setReturnsAccepted: (state, action: PayloadAction<boolean>) => {
      state.returnsAccepted = action.payload;
    },
    setConditionChoice: (state, action: PayloadAction<ConditionChoice>) => {
      state.conditionChoice = action.payload;
    },
    addImages: (state, action: PayloadAction<string[]>) => {
      state.images = [...state.images, ...action.payload].slice(0, MAX_IMAGES);
    },
    replaceImage: (state, action: PayloadAction<{ index: number; url: string }>) => {
      const { index, url } = action.payload;
      if (index < state.images.length) state.images[index] = url;
      else state.images = [...state.images, url].slice(0, MAX_IMAGES);
    },
    removeImage: (state, action: PayloadAction<number>) => {
      state.images = state.images.filter((_, i) => i !== action.payload);
    },
    swapImages: (state, action: PayloadAction<{ from: number; to: number }>) => {
      const { from, to } = action.payload;
      if (from >= state.images.length || to >= state.images.length) return;
      [state.images[from], state.images[to]] = [state.images[to], state.images[from]];
    },
    setCategory: (state, action: PayloadAction<string>) => {
      state.categoryId = action.payload;
      state.subcategoryId = "";
    },
    setCustomSpecs: (state, action: PayloadAction<SpecEntry[]>) => {
      state.customSpecs = action.payload;
    },
    togglePaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      const method = action.payload;
      state.paymentMethods = state.paymentMethods.includes(method)
        ? state.paymentMethods.filter((item) => item !== method)
        : [...state.paymentMethods, method];
    },
    setVariations: (state, action: PayloadAction<ProductVariations | null>) => {
      state.variations = action.payload;
    },
    /** Fills the form from an existing listing so the seller can edit it. */
    loadProduct: (_state, action: PayloadAction<Product>) => {
      const p = action.payload;
      const standard = p.condition === "New" || p.condition === "Used";
      return {
        ...initialState,
        editingSlug: p.slug,
        title: p.title,
        categoryId: p.categoryId ?? "",
        subcategoryId: p.subcategoryId ?? "",
        price: String(p.price),
        quantity: String(p.quantity),
        images: p.images ?? [],
        brand: p.brand ?? "",
        conditionChoice: !p.condition ? "" : standard ? (p.condition as "New" | "Used") : "custom",
        conditionCustom: p.condition && !standard ? p.condition : "",
        size: p.size ?? "",
        color: p.color ?? "",
        packageInclude: p.packageInclude ?? "",
        customSpecs: p.customSpecs,
        description: p.description,
        handlingTime: p.handlingTime,
        deliveryTime: p.deliveryTime,
        deliveryFee: String(p.deliveryFee ?? 0),
        extraDeliveryFee: String(p.extraDeliveryFee ?? 0),
        freeDelivery: Boolean(p.freeDelivery),
        // Listings made before the return policy existed start unticked, so the seller must accept it when editing.
        returnsAccepted: p.returnsAccepted,
        paymentMethods: p.paymentMethods,
        location: p.location,
        variations: p.variations ?? null,
      };
    },
    resetProductForm: () => initialState,
  },
});

export const {
  setStep,
  setSubmitted,
  setField,
  setCategory,
  setFreeDelivery,
  setReturnsAccepted,
  setConditionChoice,
  addImages,
  replaceImage,
  removeImage,
  swapImages,
  setCustomSpecs,
  togglePaymentMethod,
  setVariations,
  loadProduct,
  resetProductForm,
} = productFormSlice.actions;
export default productFormSlice.reducer;
