import { apiEndpoints } from "@/constant/api";
import { TokenManager } from "@/utils/secure-store-adapter";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "./auth_slice";
import { clearSession, setIsLogged } from "./session";

const API_HOSTNAME = process.env.EXPO_PUBLIC_API_HOSTNAME;

const API_CHECK_HOSTNAME = process.env.EXPO_PUBLIC_CHECK_HOSTNAME;

export const tembele = process.env.EXPO_PUBLIC_TEMBELEE_TOKEN;

const apiUrl = __DEV__ ? API_HOSTNAME : API_CHECK_HOSTNAME;

export const baseQuery = fetchBaseQuery({
  baseUrl: apiUrl,
  credentials: "include",
  timeout: 60000,
  prepareHeaders: (headers, { getState }) => {
    headers.set("authorization", `Bearer ${tembele}`);
    return headers;
  },
});

export async function executeCancellableAuthFetch(endpoint: string, options: RequestInit = {}) {
  const controller = new AbortController();
  return fetch(`${apiUrl}${endpoint}`, {
    ...options,
  });
}

export async function parseAuthApiResponse(response: Response) {
  return await response.json();
}


class SimpleMutex {
  private promise: Promise<void> | null = null;
  private resolve: (() => void) | null = null;

  isLocked() {
    return this.promise !== null;
  }

  async acquire() {
    while (this.promise) {
      await this.promise;
    }
    this.promise = new Promise<void>((resolve) => {
      this.resolve = resolve;
    });
    return () => this.release();
  }

  async waitForUnlock() {
    while (this.promise) {
      await this.promise;
    }
  }

  private release() {
    if (this.resolve) {
      const resolveFn = this.resolve;
      this.promise = null;
      this.resolve = null;
      resolveFn();
    }
  }
}

const mutex = new SimpleMutex();

export const baseQueryWithReauth: typeof baseQuery = async (
  args,
  api,
  extraOptions,
) => {
  // Wait until any active refresh is completed before sending the request
  await mutex.waitForUnlock();

  let result = await baseQuery(args, api, extraOptions);

  const status = result.error?.status;

  // Handle both 401 (Unauthorized) and 403 (Forbidden)
  if (result.error && status === 401) {
    console.warn(`Received ${status} — attempting token refresh...`);

    // Prevent multiple concurrent token refresh calls
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshToken = await TokenManager.getToken();

        if (!refreshToken) {
          console.log("No refresh token available — logging out user");
          api.dispatch(logout());
          api.dispatch(clearSession());
          return result;
        }

        // Attempt token refresh
        const refreshResult = (await baseQuery(
          {
            url: `/auth/refresh/app/user/${refreshToken}/token/context`,
            method: "GET",
          },
          api,
          extraOptions,
        )) as any;

        const newAccessToken =
          refreshResult.data?.token || refreshResult.data?.data?.token;

        if (newAccessToken) {
          console.log("Token refreshed successfully");

          // Save new token
          await TokenManager.setToken(newAccessToken);
          api.dispatch(setIsLogged("authenticated"));

          // Inject new token into the retry request body
          const updatedArgs = typeof args === "string" ? args : { ...args };
          if (typeof updatedArgs !== "string" && updatedArgs.body) {
            updatedArgs.body = {
              ...(updatedArgs.body as Record<string, any>),
              token: newAccessToken,
            };
          }

          // Retry the original query with the new token in the body
          result = await baseQuery(updatedArgs, api, extraOptions);
        } else {
          // Refresh failed — full logout
          console.log("Token refresh failed, forcing full logout");
          api.dispatch(logout());
          api.dispatch(clearSession());
        }
      } finally {
        release();
      }
    } else {
      // If mutex is already locked, wait for the other request to finish refreshing the token
      await mutex.waitForUnlock();

      // Get the newly refreshed token
      const newAccessToken = await TokenManager.getToken();

      // Retry the original query with the newly refreshed token
      const updatedArgs = typeof args === "string" ? args : { ...args };
      if (typeof updatedArgs !== "string" && updatedArgs.body && newAccessToken) {
        updatedArgs.body = {
          ...(updatedArgs.body as Record<string, any>),
          token: newAccessToken,
        };
      }
      result = await baseQuery(updatedArgs, api, extraOptions);
    }
  }

  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQuery,

  tagTypes: ["authCheck"],
  endpoints: (builder) => ({
    //1. register
    register: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.register}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    // 3. createUserPin
    createUserPin: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.createUserpin}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    //4.  verifyUserPin
    verifyUserPin: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.verifyUserPin}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    // 5. Login with email and password
    login: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.login}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    // 6.  login with fingerprint or face id
    loginWithBiometrics: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.loginWithBiometrics}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    // 7. forgot password
    forgotPassword: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.forgotPassword}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    // 8. reset password
    resetPassword: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.resetPassword}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    // 9. verify otp for registering
    verifyOtp: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.verifyOtp}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    verifyOtpForPasswordReset: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.verifyOtpPassword}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    resendOtp: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.resendOtp}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    resendOtpForgotPassword: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.resendOtpForgotPassword}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    getUserProfile: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.userProfile}`,
        method: "GET",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    getRefreshToken: builder.query<any, any>({
      query: (token) => ({
        url: `/auth/refresh/app/user/${token}/token/context`,
        // method: 'GET',
      }),
      providesTags: ["authCheck"],
    }),

    getRefreshTokenMutation: builder.mutation<any, any>({
      query: (data) => ({
        url: `/auth/refresh/app/user/${data}/token/context`,
        method: "GET",
      }),
      invalidatesTags: ["authCheck"],
    }),

    sendNotificationToken: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `/auth/notification/token`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    getNotification: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.notification.fetchNotification}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    verifyKyc: builder.mutation<any, any>({
      query: (data) => ({
        url: `${apiEndpoints.auth.verifyKyc}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),
  }),
});

export const {
  useRegisterMutation,
  // useVerifyEmailPhoneMutation,
  useCreateUserPinMutation,
  useVerifyUserPinMutation,
  useLoginMutation,
  useLoginWithBiometricsMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyOtpMutation,
  useVerifyOtpForPasswordResetMutation,
  useResendOtpMutation,
  useResendOtpForgotPasswordMutation,
  useGetRefreshTokenQuery,
  useGetRefreshTokenMutationMutation,

  useSendNotificationTokenMutation,
  useGetUserProfileMutation,
  useGetNotificationMutation,
  useVerifyKycMutation,
} = authApi;
