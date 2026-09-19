import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface HeaderState {
  mobileOpen: boolean;
  query: string;
}

const initialState: HeaderState = {
  mobileOpen: false,
  query: "",
};

const headerSlice = createSlice({
  name: "header",
  initialState,
  reducers: {
    setMobileOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileOpen = action.payload;
    },
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    resetHeader: () => initialState,
  },
});

export const { setMobileOpen, setQuery, resetHeader } = headerSlice.actions;
export default headerSlice.reducer;
