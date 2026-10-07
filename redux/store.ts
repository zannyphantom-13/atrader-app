import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
// import storage from 'redux-persist/lib/storage';
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { authApi } from "./auth/auth_api";
import { AuthState } from "./auth/auth_slice";
import { BeneficiaryState } from "./beneficiary/bene_slice";
import { BillsApi } from "./bills/bills_api";
import rootReducer from "./combine";
import { cryptoApi } from "./crypto/crypto_api";
import { giftCardsApi } from "./giftcards/giftcards_api";
import { settingsApi } from "./settings/settings";
import AsyncStorage from "./storage";
import { BanksApi } from "./transaction/banks";
import { transactionHistoryApi } from "./transaction/transaction_history";

export interface RootState {
  auth: AuthState;
  beneficiary: BeneficiaryState;
}

// Top-level persist config excluding auth (already handled in combine.js)
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: [],
};

// Apply the global persistence configuration to rootReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoreActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
        ] as unknown as boolean,
      },
    }).concat(
      authApi.middleware,
      giftCardsApi.middleware,
      BillsApi.middleware,
      transactionHistoryApi.middleware,
      settingsApi.middleware,
      BanksApi.middleware,
      cryptoApi.middleware,
    ) as any,
});

export const persistor = persistStore(store);

export type AppStore = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
export const useAppSelector: TypedUseSelectorHook<AppStore> = useSelector;

export default store;
