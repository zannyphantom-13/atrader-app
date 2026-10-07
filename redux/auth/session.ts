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

export type logincheck = "authenticated" | null

export interface SessionState {
  isAuth: boolean;
  loading: boolean;
  error: string | null;
  isLogged: logincheck;
  status: boolean;
  isOnboardingCompleted?: boolean;
  hasAccount?: boolean;
  hasAccountNotVerified?: boolean;
  isBiometricEnabled?: boolean;
  notificationEnabledStatus?: notifStatus;
  hasSeenRankModal?: boolean;
  rankLeaderboardAccepted?: boolean;
}

const initialState: SessionState = {
  isAuth: false,
  isLogged: null,
  loading: false,
  error: null,
  status: false,
  isOnboardingCompleted: false,
  hasAccount: false,
  hasAccountNotVerified: false,
  isBiometricEnabled: false,
  notificationEnabledStatus: undefined,
  hasSeenRankModal: false,
  rankLeaderboardAccepted: false,
};

// console.log("initialState Interface:", initialState);

export interface CheckTokenExpirationAction {
  (dispatch: Dispatch, getState: () => RootState): void;
}

const SessionSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearSession: (state) => {
      state.loading = false;
      state.error = null;
      state.isAuth = false;
      state.hasAccount = false;
      state.isLogged = null
    },
    tempclearsession: (state) => {
      state.loading = false;
      state.error = null;
      state.isAuth = false;
    },
    updateUserEmailLocally: (state: SessionState, action: PayloadAction<string>) => {
      (state as any).cachedEmail = action.payload;
    },
    setLoginSuccess: (state: SessionState, action: PayloadAction) => {
      state.isAuth = true;
      state.hasAccount = true;
      state.isLogged = 'authenticated';
    },
    setIsLogged: (state: SessionState, action: PayloadAction<logincheck>) => {
      state.isLogged = action.payload;
    },
    setAuth: (state: SessionState, action: PayloadAction<boolean>) => {
      state.isAuth = action.payload;
    },
    setOnboardingCompleted: (
      state: SessionState,
      action: PayloadAction<boolean>,
    ) => {
      state.isOnboardingCompleted = action.payload;
    },
    setHasAccount: (state: SessionState, action: PayloadAction<boolean>) => {
      state.hasAccount = action.payload;
    },
    setHasAccountNotVerified: (
      state: SessionState,
      action: PayloadAction<boolean>,
    ) => {
      state.hasAccountNotVerified = action.payload;
    },
    setIsBiometricEnabled: (
      state: SessionState,
      action: PayloadAction<boolean>,
    ) => {
      state.isBiometricEnabled = action.payload;
    },
    setNotificationEnabledStatus: (
      state: SessionState,
      action: PayloadAction<notifStatus>,
    ) => {
      state.notificationEnabledStatus = action.payload;
    },
    setHasSeenRankModal: (
      state: SessionState,
      action: PayloadAction<boolean>,
    ) => {
      state.hasSeenRankModal = action.payload;
    },
    setRankLeaderboardAccepted: (
      state: SessionState,
      action: PayloadAction<boolean>,
    ) => {
      state.rankLeaderboardAccepted = action.payload;
    },
  },

  // extraReducers: (builder: ActionReducerMapBuilder<SessionState>) => {
  // },
});

export const {
  setIsLogged,
  setAuth,
  setOnboardingCompleted,
  setHasAccount,
  setHasAccountNotVerified,
  setIsBiometricEnabled,
  setNotificationEnabledStatus,
  setHasSeenRankModal,
  setRankLeaderboardAccepted,
  setLoginSuccess,
  clearSession,
  tempclearsession,
} = SessionSlice.actions;
export default SessionSlice.reducer;
