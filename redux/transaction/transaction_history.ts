import { apiEndpoints } from "@/constant/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../auth/auth_api";

export const transactionHistoryApi = createApi({
  reducerPath: "transactionHistoryApi",
  baseQuery: baseQueryWithReauth,

  tagTypes: ["transactionCheck"],
  endpoints: (builder) => ({
    // 1. getAllTransaction
    getAllTransaction: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.transaction.getTransactionHistory}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["transactionCheck"],
    }),

    //2. Save Banks
    saveBank: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.payment.saveBanks}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["transactionCheck"],
    }),

    //3. withdraw
    withdraw: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.payment.withdraw}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["transactionCheck"],
    }),

    //4. getDetailTransaction
    getDetailTransaction: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.transaction.getDetailTransation}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["transactionCheck"],
    }),

    getAllTypeDetailTransaction: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.transaction.getAllTypeDetailTransaction}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["transactionCheck"],
    }),
  }),
});

export const {
  useGetAllTransactionMutation,
  useSaveBankMutation,
  useWithdrawMutation,
  useGetDetailTransactionMutation,
  useGetAllTypeDetailTransactionMutation,
} = transactionHistoryApi;


export const sortTransactionHistoryInPlace = (historyList: any[]) => {
  return historyList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};


export const selectFailedWithdrawals = (state: any) => {
  const transactions = state?.transactionHistoryApi?.queries ?? {};
  // Returns new array reference on every store update!
  return Object.values(transactions).filter((tx: any) => tx?.status === "failed");
};


export const findLatestTransactionTimestamp = (timestamps: number[]): number => {
  // Blows call stack on large transaction datasets!
  return Math.max(...timestamps);
};

