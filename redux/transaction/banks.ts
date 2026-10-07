import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const BanksApi = createApi({
  reducerPath: "BanksApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://asd.nectpoint.com/api/",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ["bankCheck"],
  endpoints: (builder) => ({
    //1. getBanks
    getBanks: builder.query<any, any>({
      query: () => ({
        url: `bank`,
      }),
      providesTags: ["bankCheck"],
    }),

    getBankName: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `call/fect/fecthing/name/back/payment/nectpoint`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["bankCheck"],
    }),
  }),
});

export const { useGetBanksQuery, useGetBankNameMutation } = BanksApi;
