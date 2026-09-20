import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PaymentMethod, ProductVariations, SpecEntry } from "@/types";

interface ProductFormState {
  step: "form" | "attributes" | "images";
  submitted: boolean;
  title: string;
  price: string;
  quantity: string;
  brand: string;
  size: string;
  color: string;
  packageInclude: string;
  customSpecs: SpecEntry[];
  handlingTime: string;
  deliveryTime: string;
  paymentMethods: PaymentMethod[];
  location: string;
  variations: ProductVariations | null;
}

const initialState: ProductFormState = {
  step: "form",
  submitted: false,
  title: "",
  price: "",
  quantity: "",
  brand: "",
  size: "",
  color: "",
  packageInclude: "",
  customSpecs: [],
  handlingTime: "",
  deliveryTime: "",
  paymentMethods: [],
  location: "",
  variations: null,
};

const productFormSlice = createSlice({
  name: "productForm",
  initialState,
  reducers: {
    setStep: (state, action: PayloadAction<"form" | "attributes" | "images">) => {
      state.step = action.payload;
    },
    setSubmitted: (state, action: PayloadAction<boolean>) => {
      state.submitted = action.payload;
    },
    setField: (state, action: PayloadAction<{ field: keyof Omit<ProductFormState, "step" | "submitted" | "customSpecs" | "paymentMethods" | "variations">; value: string }>) => {
      const { field, value } = action.payload;
      state[field] = value;
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
    resetProductForm: () => initialState,
  },
});

export const {
  setStep,
  setSubmitted,
  setField,
  setCustomSpecs,
  togglePaymentMethod,
  setVariations,
  resetProductForm,
} = productFormSlice.actions;
export default productFormSlice.reducer;
