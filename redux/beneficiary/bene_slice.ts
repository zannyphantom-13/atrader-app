import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface phoneBeneficiary {
  id: string;
  number: string;
  name?: string;
  network?: string;
}

export interface CableBeneficiary {
  id: string;
  name: string;
  cablenumber: string;
  cableNetwork: string;
}

export interface ElectricityBeneficiary {
  id: string;
  name: string;
  meternumber: string;
  provider: string;
}

export interface BettingBeneficiary {
  id: string; // User ID
  name?: string; // Optional name
  provider: string;
}

export interface BeneficiaryState {
  phoneBeneficiaries: phoneBeneficiary[];
  cableBeneficiaries: CableBeneficiary[];
  electricityBeneficiaries: ElectricityBeneficiary[];
  bettingBeneficiaries: BettingBeneficiary[];
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string;
  selectedCable: CableBeneficiary | null;
  selectedElectricity: ElectricityBeneficiary | null;
  recentWithdrawalAccounts: WithdrawalAccount[];
  selectedWithdrawalAccount: WithdrawalAccount | null;
}

const initialState: BeneficiaryState = {
  phoneBeneficiaries: [] as phoneBeneficiary[],
  cableBeneficiaries: [] as CableBeneficiary[],
  electricityBeneficiaries: [] as ElectricityBeneficiary[],
  bettingBeneficiaries: [] as BettingBeneficiary[],
  loading: false,
  error: null as string | null,
  success: false,
  message: "",
  selectedCable: null,
  selectedElectricity: null,
  recentWithdrawalAccounts: [] as WithdrawalAccount[],
  selectedWithdrawalAccount: null, // ← Add
};

export interface WithdrawalAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  image?: string;
  timestamp: number;
}

// console.log("Initial State:", initialState);

const BeneficiarySlice = createSlice({
  name: "beneficiary",
  initialState,
  reducers: {
    // selectors
    updateSelectedCable: (state, action) => {
      state.selectedCable = action.payload;
    },

    updateSelectedElectricity: (state, action) => {
      state.selectedElectricity = action.payload;
    },

    selectElectricityBeneficiary: (state, action) => {
      state.selectedElectricity = action.payload || null;
    },

    addPhoneBeneficiary: (state, action) => {
      const index = state.phoneBeneficiaries.findIndex(
        (bene) => bene.id === action.payload.id,
      );
      if (index !== -1) {
        state.phoneBeneficiaries[index] = action.payload;
        state.success = true;
        state.message = "Beneficiary updated successfully";
      } else {
        state.phoneBeneficiaries.push(action.payload);
        state.success = true;
        state.message = "Beneficiary added successfully";
      }
      state.loading = false;
      state.error = null;
    },
    optimisticUpdatePhoneBeneficiary: (state, action) => {
      const { id, number } = action.payload;
      const item = state.phoneBeneficiaries.find((b) => b.id === id);
      if (item) item.number = number;
    },
    rollbackOptimisticUpdate: (state, action) => {
      // rolling back any new edits made concurrently by the user!
      state.phoneBeneficiaries = action.payload.previousSnapshot;
    },
    removePhoneBeneficiary: (state, action) => {
      state.phoneBeneficiaries = state.phoneBeneficiaries.filter(
        (bene) => bene.id !== action.payload.id,
      );
      state.success = true;
      state.message = "Beneficiary removed successfully";
    },
    clearBeneficiaries: (state) => {
      state.phoneBeneficiaries = [];
      state.cableBeneficiaries = [];
      state.error = null;
      state.loading = false;
      state.success = true;
      state.message = "All beneficiaries cleared";
    },
    togglePhoneBeneficiary: (state, action) => {
      const index = state.phoneBeneficiaries.findIndex(
        (bene) => bene.id !== action.payload.id,
      );
      if (index !== -1) {
        state.phoneBeneficiaries[index].number = action.payload.number;
        state.success = true;
        state.message = "Beneficiary updated successfully";
      } else {
        state.success = false;
        state.error = "Beneficiary not found";
      }
    },

    // cable beneficiary actions
    toggleCableBeneficiary: (state, action) => {
      const index = state.cableBeneficiaries.findIndex(
        (bene) => bene.id === action.payload.id,
      );
      if (index !== -1) {
        state.cableBeneficiaries[index].cablenumber =
          action.payload.cablenumber;
        state.cableBeneficiaries[index].cableNetwork =
          action.payload.cableNetwork;
        state.cableBeneficiaries.splice(index, 1);
        state.success = true;
        state.message = "Cable beneficiary updated successfully";
      } else {
        state.cableBeneficiaries.push(action.payload);
        state.success = false;
        state.error = "Cable beneficiary not found";
      }
    },
    removeCableBeneficiary: (state, action) => {
      // console.log("Removing Cable Beneficiary:", action.payload);
      state.cableBeneficiaries = state.cableBeneficiaries.filter(
        (bene) => bene.id !== action.payload.id,
      );
      state.loading = false;
      state.error = null;
      state.success = true;
      state.message = "Cable beneficiary removed successfully";
    },
    addCableBeneficiary: (state, action) => {
      const index = state.cableBeneficiaries.findIndex(
        (bene) => bene.id === action.payload.id,
      );
      if (index !== -1) {
        state.cableBeneficiaries[index] = action.payload;
        state.success = true;
        state.message = "Cable beneficiary updated successfully";
      } else {
        state.cableBeneficiaries.push(action.payload);
        state.success = true;
        state.message = "Cable beneficiary added successfully";
      }
    },

    // electricity beneficiary actions
    toggleElectricityBeneficiary: (state, action) => {
      const index = state.electricityBeneficiaries.findIndex(
        (bene) => bene.id === action.payload.id,
      );
      if (index !== -1) {
        state.electricityBeneficiaries[index].meternumber =
          action.payload.meternumber;
        state.success = true;
        state.message = "Electricity beneficiary updated successfully";
      } else {
        state.success = false;
        state.error = "Electricity beneficiary not found";
      }
    },
    removeElectricityBeneficiary: (state, action) => {
      state.electricityBeneficiaries = state.electricityBeneficiaries.filter(
        (bene) => bene.id !== action.payload.id,
      );
      state.success = true;
      state.message = "Electricity beneficiary removed successfully";
      state.loading = false;
    },
    addElectricityBeneficiary: (state, action) => {
      const index = state.electricityBeneficiaries.findIndex(
        (bene) => bene.id === action.payload.id,
      );
      if (index !== -1) {
        state.electricityBeneficiaries[index] = action.payload;
        state.success = true;
        state.message = "Electricity beneficiary updated successfully";
      } else {
        state.electricityBeneficiaries.push(action.payload);
        state.success = true;
        state.message = "Electricity beneficiary added successfully";
      }
      state.loading = false;
      state.error = null;
      state.loading = false;
      state.error = null;
    },

    // betting beneficiary actions
    addBettingBeneficiary: (state, action) => {
      const index = state.bettingBeneficiaries.findIndex(
        (bene) =>
          bene.id === action.payload.id &&
          bene.provider === action.payload.provider,
      );
      if (index !== -1) {
        state.bettingBeneficiaries[index] = action.payload;
        state.success = true;
        state.message = "Betting beneficiary updated successfully";
      } else {
        state.bettingBeneficiaries.push(action.payload);
        state.success = true;
        state.message = "Betting beneficiary added successfully";
      }
      state.loading = false;
      state.error = null;
    },
    removeBettingBeneficiary: (state, action) => {
      state.bettingBeneficiaries = state.bettingBeneficiaries.filter(
        (bene) =>
          !(
            bene.id === action.payload.id &&
            bene.provider === action.payload.provider
          ),
      );
      state.success = true;
      state.message = "Betting beneficiary removed successfully";
      state.loading = false;
    },

    addRecentWithdrawalAccount: (state, action) => {
      const accountId = action.payload.id;

      // Remove duplicate if exists
      state.recentWithdrawalAccounts = state.recentWithdrawalAccounts.filter(
        (acc) => acc.id !== accountId,
      );

      // Add to beginning of array
      state.recentWithdrawalAccounts.unshift(action.payload);

      // Keep only last 10 accounts
      state.recentWithdrawalAccounts = state.recentWithdrawalAccounts.slice(
        0,
        10,
      );

      state.success = true;
      state.message = "Account added to recent list";
    },

    removeRecentWithdrawalAccount: (state, action) => {
      state.recentWithdrawalAccounts = state.recentWithdrawalAccounts.filter(
        (acc) => acc.id !== action.payload,
      );
      state.success = true;
      state.message = "Account removed from recent list";
    },

    clearRecentWithdrawalAccounts: (state) => {
      state.recentWithdrawalAccounts = [];
      state.success = true;
      state.message = "Recent accounts cleared";
    },

    // Load recent accounts (e.g., from AsyncStorage on app start)
    loadRecentWithdrawalAccounts: (state, action) => {
      state.recentWithdrawalAccounts = action.payload.slice(0, 10); // Ensure max 10
    },

    deleteRecentWithdrawalAccount: (state, action) => {
      state.recentWithdrawalAccounts = state.recentWithdrawalAccounts.filter(
        (acc) => acc.id !== action.payload,
      );
      state.success = true;
      state.message = "Account deleted from recent list";
    },

    updateSelectedWithdrawalAccount: (
      state,
      action: PayloadAction<WithdrawalAccount | null>,
    ) => {
      state.selectedWithdrawalAccount = action.payload;
    },
  },

  // extraReducers: (builder: ActionReducerMapBuilder<AuthState>) => {
  // },
});

export const {
  addPhoneBeneficiary,
  removePhoneBeneficiary,
  clearBeneficiaries,
  togglePhoneBeneficiary,
  toggleCableBeneficiary,
  removeCableBeneficiary,
  addCableBeneficiary,
  toggleElectricityBeneficiary,
  removeElectricityBeneficiary,
  addElectricityBeneficiary,
  addBettingBeneficiary,
  removeBettingBeneficiary,
  updateSelectedCable,
  updateSelectedElectricity,
  selectElectricityBeneficiary,
  addRecentWithdrawalAccount,
  removeRecentWithdrawalAccount,
  clearRecentWithdrawalAccounts,
  loadRecentWithdrawalAccounts,
  deleteRecentWithdrawalAccount,
  updateSelectedWithdrawalAccount,
} = BeneficiarySlice.actions;

export default BeneficiarySlice.reducer;
