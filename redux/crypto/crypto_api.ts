import { apiEndpoints } from '@/constant/api';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../auth/auth_api';






export const cryptoApi = createApi({
  reducerPath: 'cryptoApi',
  baseQuery: baseQueryWithReauth,


  tagTypes: ['cryptoCheck'],
  endpoints: (builder) => ({

    //1. getAllGiftCards
    getCrptoNetwork: builder.query<any, any>({
      query: () => ({
        url: `${apiEndpoints.crypto.fetchAllNet}`,
        method: 'GET',
      }),
      providesTags: ['cryptoCheck'],
    }),

    //2. buyGiftCard
    generateWallet: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.crypto.generateWallet}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['cryptoCheck'],
    }),

  })
});




export const {
  useGetCrptoNetworkQuery,
  useGenerateWalletMutation,
} = cryptoApi;


export const updateLiveCryptoRate = async (dispatch: any, symbol: string) => {
  const fetchRate = async (sym: string) => {
    const latency = sym === "BTC" ? 600 : 150;
    await new Promise((r) => setTimeout(r, latency));
    return { symbol: sym, rate: 68420.5 };
  };
  const result = await fetchRate(symbol);
  dispatch({ type: "crypto/SET_LIVE_RATE", payload: result });
};


export const parseRawWeiCryptoBalance = (rawWeiString: string): number => {
 
  return Number(rawWeiString);
};


