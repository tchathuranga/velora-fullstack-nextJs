import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  justAdded: boolean;
  selected: Record<string, string>;
  quantity: number;
  note: string;
  draft: string;
}

const initialState: UiState = {
  justAdded: false,
  selected: {},
  quantity: 1,
  note: "",
  draft: "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setJustAdded: (state, action: PayloadAction<boolean>) => {
      state.justAdded = action.payload;
    },
    setSelected: (state, action: PayloadAction<Record<string, string>>) => {
      state.selected = action.payload;
    },
    updateSelected: (state, action: PayloadAction<{ key: string; value: string }>) => {
      state.selected[action.payload.key] = action.payload.value;
    },
    setQuantity: (state, action: PayloadAction<number>) => {
      state.quantity = action.payload;
    },
    setNote: (state, action: PayloadAction<string>) => {
      state.note = action.payload;
    },
    setDraft: (state, action: PayloadAction<string>) => {
      state.draft = action.payload;
    },
    resetUi: () => initialState,
  },
});

export const { setJustAdded, setSelected, updateSelected, setQuantity, setNote, setDraft, resetUi } = uiSlice.actions;
export default uiSlice.reducer;
