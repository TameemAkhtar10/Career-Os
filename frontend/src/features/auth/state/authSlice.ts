import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../../types/user";
import type { RootState } from "../../../config/store";

export interface AuthSliceState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthSliceState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isInitialized = true;
    },
    logoutUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
  },
});

export const { setAuthUser, logoutUser, setInitialized } = authSlice.actions;

export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsInitialized = (state: RootState) => state.auth.isInitialized;

export default authSlice.reducer;
