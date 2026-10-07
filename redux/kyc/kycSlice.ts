import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface KYCState {
  nin: string | null;
}

const initialState: KYCState = {
  nin: null,
};

const kycSlice = createSlice({
  name: "kyc",
  initialState,
  reducers: {
    setNin: (state, action: PayloadAction<string>) => {
      state.nin = action.payload;
    },
    clearKycData: (state) => {
      state.nin = null;
    },
  },
});

export const { setNin, clearKycData } = kycSlice.actions;
export default kycSlice.reducer;
