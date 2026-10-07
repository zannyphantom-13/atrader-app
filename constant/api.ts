export const apiEndpoints = {
  auth: {
    login: "/auth/login",
    loginWithBiometrics: "/auth/the/fingerprint/login",
    register: "/auth/register",
    createUserpin: "/auth/create/app/user/pin",
    verifyUserPin: "/auth/verify/app/user/pin",
    forgotPassword: "auth/forgot/pass/word",
    resetPassword: "/auth/pass/the/reset",
    verifyOtp: "/auth/verify/app/user/email",
    verifyOtpPassword: "/auth/verify/otp/reset",
    resendOtp: "/auth/resending/to/app/user/email",
    resendOtpForgotPassword: "/auth/forgot/reset",
    userProfile: "/auth/refresh/app/user/context",
    verifyKyc: "/verify_user/customer",
  },
  bills: {
    data: {
      getNetworkStatus: "/get_network/status",
      getPlanType: "/check/request/set/thenetwork/plan/allbased",
      buyData: "/data",
    },
    airtime: {
      getNetworkStatus: "/get_network/status",
      buyAirtime: "/airtime",
    },
    cable: {
      getCable: "/cable/ones/first",
      getCableName: "/verifying/ones/first/cablename",
      buyCable: "/buy/cable",
      getCablePackages: "/check/request/set/this/cable/plan/allbased",
    },
    electricity: {
      getBillPlan: "/check/request/get/billplans",
      getCustomerName: "/bill/validate",
      payBill: "/bill",
    },
    betting: {
      getBettingList: "/time/fetch/providers",
      veryBettingNumber: "/verify/bet/account/providers/set/transaction/verify",
      payBetting: "/bet/account/providers/set/transaction/purchase",
    },
  },
  giftcards: {
    findSubCategory: "/all/giftcards/and/cart/cat",
    findGiftCard: "/all/giftcards/and/cart",
    tradeGiftCard: "/trade/gift/card/set/cashout",
    // buy giftcards
    getAllGiftCards: "get/top/giftcards/fetch/details/set/give",
    buyGiftCard: "/get/top/giftcards/purchase/giftcard",
    getAllGiftCardTypes: "/all/giftcheck/type/setrt/cart/cat",
    fetchGiftCardRate: "/all/fetch/rate/to/giftcard",
  },
  crypto: {
    fetchAllNet: "/active/get/details",
    generateWallet: "/active/createdeposit/details/address",
  },
  payment: {
    saveBanks: "/all/beneficiary/save/cart",
    withdraw:
      "/all/beneficiary/withdraw/benefit/set/style/me/user/withdraw/set/get",
    getBanks: "/payment/get-banks",
    getAccountName: "/all/account/fetch/get/identity/name",
    saveBank: "/all/beneficiary/save/cart",
  },
  settings: {
    getOtpForChangePassword: "/get/theotp/for/password/change",
    changePassword: "/change/password/set/old",
    getOtpForChangePin: "/get/theotp/for/pin/change",
    changePin: "/change/pin/set/all/get/good/set",
    rank: "/get/top/giftcards",
    deleteAccount: "/auth/delete/user/account/permanent",
    deleteBeneficiary: "/all/beneficiary/delete/cart",
    toggleNotification: "/onn/off/set/plan/allbased",
  },
  transaction: {
    getTransactionHistory: "/get/top/history/transaction/role",
    getDetailTransation: "/trade/gift/card/set/single/gift",
    getAllTypeDetailTransaction: "/trade/gift/card/fetching/set/gets/trade",
  },
  notification: {
    fetchNotification: "/all/notification/and/cart",
    readNotification: "/auth/read/notification",
  },
  setting: {
    getUserRewardHistory: "/referral/history",
    withdrawReferral: "/referral/withdraw",
  },
  app: {
    checkUpdate: "/app/check-update",
  },
};
