import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UiSliceState {
  isOffline: boolean;
}

const initialState: UiSliceState = {
  isOffline: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setOffline: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },
  },
});

export const { setOffline } = uiSlice.actions;
export default uiSlice.reducer;

