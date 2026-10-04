import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BillingFormValues } from "@/components/checkout/BillingForm";
import { PaymentMethod } from "@/types";

const emptyBilling: BillingFormValues = {
  fullName: "",
  street: "",
  city: "",
  province: "",
  phone1: "",
  phone2: "",
  zipCode: "",
  email: "",
  orderNote: "",
};

interface CheckoutState {
  billing: BillingFormValues;
  saveAddress: boolean;
  paymentMethod: PaymentMethod;
}

const initialState: CheckoutState = {
  billing: emptyBilling,
  saveAddress: false,
  paymentMethod: "cod",
};

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setBillingField: <K extends keyof BillingFormValues>(
      state: CheckoutState,
      action: PayloadAction<{ field: K; value: BillingFormValues[K] }>,
    ) => {
      const { field, value } = action.payload;
      state.billing[field] = value;
    },
    setSaveAddress: (state, action: PayloadAction<boolean>) => {
      state.saveAddress = action.payload;
    },
    setPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.paymentMethod = action.payload;
    },
    setBilling: (state, action: PayloadAction<BillingFormValues>) => {
      state.billing = action.payload;
    },
    resetCheckout: () => initialState,
  },
});

export const { setBillingField, setSaveAddress, setPaymentMethod, setBilling, resetCheckout } = checkoutSlice.actions;
export default checkoutSlice.reducer;
