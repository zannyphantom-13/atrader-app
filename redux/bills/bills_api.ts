import { createApi, } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../auth/auth_api';
import { apiEndpoints } from '@/constant/api';



export const BillsApi = createApi({
  reducerPath: 'BillsApi',
  baseQuery: baseQueryWithReauth,
  
  tagTypes: ['billsCheck'],
  endpoints: (builder) => ({
   

      /*
        Data Services
      */

      getNetworkStatus: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.data.getNetworkStatus}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }),
       
      
      getPlanType: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.data.getPlanType}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }),
      

      buyData: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.data.buyData}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }),

       
      /*
        Airtime  Services
      */
       
      
      getAirtimeNetworkStatus: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.airtime.getNetworkStatus}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }),
      

      buyAirtime: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.airtime.buyAirtime}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }),
        

       /*
        Cable  Services
      */
       
      
      getCable: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.cable.getCable}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }),
       

      getCableName: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.cable.getCableName}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }),
       
      
      buyCable: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.cable.buyCable}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }),
       
      getCablePackages: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.cable.getCablePackages}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }), 

       
       /*
        Electricity  Services
      */
      
      
      getBillPlan: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.electricity.getBillPlan}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }),

      getCustomerName: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.electricity.getCustomerName}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }),

      payBill: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.electricity.payBill}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }),


      // Betting Services
      // getBettingList: builder.mutation<any, any>({
      //   query: ({ data }) => ({
      //     url: `${apiEndpoints.bills.betting.getBettingList}`,
      //     method: 'GET',
      //     body: data,
      //   }),
      //   invalidatesTags: ['billsCheck'],
      // }),
      getBettingList: builder.query<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.betting.getBettingList}`,
          method: 'GET',
          // body: data,
        }),
        providesTags: ['billsCheck'],
      }),

      veryBettingNumber: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.betting.veryBettingNumber}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }),

      payBetting: builder.mutation<any, any>({
        query: ({ data }) => ({
          url: `${apiEndpoints.bills.betting.payBetting}`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['billsCheck'],
      }),

  })
});




export const {
      /*
        Data  Services
      */
    useGetNetworkStatusMutation,
    useGetPlanTypeMutation,
    useBuyDataMutation,

     /*
        Airtime  Services
      */
    useGetAirtimeNetworkStatusMutation,
    useBuyAirtimeMutation,

     /*
        Cable  Services
      */
    useGetCableMutation,
    useGetCableNameMutation,
    useBuyCableMutation,
    useGetCablePackagesMutation,

     /*
        Electicity  Services
      */
    useGetBillPlanMutation,
    useGetCustomerNameMutation,
    usePayBillMutation,


    // Betting Services
    // useGetBettingListMutation,
    useGetBettingListQuery,
    useVeryBettingNumberMutation,
    usePayBettingMutation,
} = BillsApi; 