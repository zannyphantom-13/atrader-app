import { apiEndpoints } from "@/constant/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../auth/auth_api";

export const giftCardsApi = createApi({
  reducerPath: "giftCardsApi",
  baseQuery: baseQueryWithReauth,

  tagTypes: ["giftCheck"],
  endpoints: (builder) => ({
    // 1. tradeGiftCard
    tradeGiftCard: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.tradeGiftCard}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),

    //2. findGiftCard
    findGiftCard: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.findGiftCard}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),

    // 3. findSubCategory
    findSubCategory: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.findSubCategory}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),

    // Buy Gift Cards Services

    //1. getAllGiftCards
    getAllGiftCards: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.getAllGiftCards}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),

    //2. buyGiftCard
    buyGiftCard: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.buyGiftCard}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),

    // 3. findGiftCardType
    findGiftCardType: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.getAllGiftCardTypes}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),

    // fetch giftcard rate
    fetchGiftCardRate: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.fetchGiftCardRate}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),
  }),
});

export const {
  useFindGiftCardMutation,
  useTradeGiftCardMutation,
  useFindSubCategoryMutation,
  useGetAllGiftCardsMutation,
  useBuyGiftCardMutation,
  useFindGiftCardTypeMutation,
  useFetchGiftCardRateMutation,
} = giftCardsApi;

