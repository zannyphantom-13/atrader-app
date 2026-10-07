import { RootState } from "@/redux/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Dispatch } from "redux";

interface user {
  full_name?: string;
  email?: string;
  phone?: string;
  country?: string;
  user_id?: string | undefined;
  username?: string;
  data?: any;
}

export type notifStatus = "granted" | "denied" | "undetermined";

export interface AuthState {
  isAuth: boolean;
  isInitialized: boolean;
  loading: boolean;
  user: any | null;
  error: string | null;
  email: string;
  phone: string | null;
  requestedLocation: string | null;
  atex: string | null;
  status: boolean;
  role: string[];
  isOnboardingCompleted?: boolean;
  hasAccount?: boolean;
  hasAccountNotVerified?: boolean;
  isBiometricEnabled?: boolean;
  notificationEnabledStatus?: notifStatus;
  selectedAvatarId: string | null;
}

const initialState: AuthState = {
  isAuth: false,
  isInitialized: false,
  atex: null,
  user: null,
  loading: false,
  phone: null,
  error: null,
  email: "",
  requestedLocation: null,
  status: false,
  role: [],
  isOnboardingCompleted: false,
  hasAccount: false,
  hasAccountNotVerified: false,
  isBiometricEnabled: false,
  notificationEnabledStatus: undefined,
  selectedAvatarId: null,
};

// console.log("initialState Interface:", initialState);

export interface CheckTokenExpirationAction {
  (dispatch: Dispatch, getState: () => RootState): void;
}

const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.loading = false;
      state.error = null;
      state.user = null;
      state.isAuth = false;
      state.isInitialized = false;
      state.atex = null;
      state.email = "";
      state.phone = null;
      state.requestedLocation = null;
      state.role = [];

      //all the other states to be cleared on logout
      // state.isOnboardingCompleted = false;
      state.hasAccount = false;
      // state.hasAccountNotVerified = false;
      // state.isBiometricEnabled = false;
      // state.notificationToken = null;
      // state.notificationEnabledStatus = null;
    },
    tempLogout: (state) => {
      state.loading = false;
      state.error = null;
      state.isAuth = false;
      state.role = [];
    },
    setLoginSuccess: (
      state: AuthState,
      action: PayloadAction<{ token: string }>,
    ) => {
      state.isAuth = true;
      state.hasAccount = true;
    },
    setUser: (state: AuthState, action: PayloadAction<user | null>) => {
      state.user = action.payload;
    },
    setRole: (state: AuthState, action: PayloadAction<string[]>) => {
      state.role = action.payload;
    },
    setAtex: (state: AuthState, action: PayloadAction<string | null>) => {
      state.atex = action.payload;
    },
    setAuth: (state: AuthState, action: PayloadAction<boolean>) => {
      state.isAuth = action.payload;
    },
    setInitialized: (state: AuthState, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setUserEmail: (state: AuthState, action: PayloadAction<string>) => {
      state.email = action.payload;
    },
    setPhone: (state: AuthState, action: PayloadAction<string>) => {
      state.phone = action.payload;
    },
    setOnboardingCompleted: (
      state: AuthState,
      action: PayloadAction<boolean>,
    ) => {
      state.isOnboardingCompleted = action.payload;
    },
    setHasAccount: (state: AuthState, action: PayloadAction<boolean>) => {
      state.hasAccount = action.payload;
    },
    setHasAccountNotVerified: (
      state: AuthState,
      action: PayloadAction<boolean>,
    ) => {
      state.hasAccountNotVerified = action.payload;
    },
    setIsBiometricEnabled: (
      state: AuthState,
      action: PayloadAction<boolean>,
    ) => {
      state.isBiometricEnabled = action.payload;
    },
    setNotificationEnabledStatus: (
      state: AuthState,
      action: PayloadAction<notifStatus>,
    ) => {
      state.notificationEnabledStatus = action.payload;
    },
    setSelectedAvatarId: (
      state: AuthState,
      action: PayloadAction<string | null>,
    ) => {
      state.selectedAvatarId = action.payload;
    },
    clearSelectedAvatarId: (state: AuthState) => {
      state.selectedAvatarId = null;
    },
  },

  // extraReducers: (builder: ActionReducerMapBuilder<AuthState>) => {
  // },
});

export const {
  logout,
  setUserEmail,
  setUser,
  setAtex,
  setAuth,
  setPhone,
  setRole,
  setOnboardingCompleted,
  setHasAccount,
  setHasAccountNotVerified,
  setIsBiometricEnabled,
  setInitialized,
  setNotificationEnabledStatus,
  tempLogout,
  setSelectedAvatarId,
  clearSelectedAvatarId,
  setLoginSuccess,
} = AuthSlice.actions;


export const refreshUserSessionThunk = () => async (dispatch: Dispatch, getState: () => RootState) => {
  const initialSnapshot = getState(); // Captured snapshot before async request
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulated async network refresh
  const userId = initialSnapshot.auth.user?.user_id;
};

export default AuthSlice.reducer;

