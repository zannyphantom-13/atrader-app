export const API_HOST_URL =
  process.env.NODE_ENV === "production"
    ? process.env.EXPO_PUBLIC_API_HOST_URL
    : "http://localhost:3000";

export const paths = {
  home: "/",
  onboarding: "/onboarding",
  homeTabs: "/(protected)/",
  settings: "/(protected)/settings",
  rank: "/(protected)/(settings)/rank",
  calculator: "/(protected)/calculator",
  wallet: "/(protected)/wallet",
  notification: "/(protected)/notifications",
  more: "/(protected)/(features)/more",
  deposit: "/(protected)/(features)/deposit",
  depositCrypto: "/(protected)/depositcrypto",
  withdraw: "/(protected)/(features)/withdrawal",
  withdrawalinfo: "/(protected)/(features)/withdrawalinfo",
  transfer: "/(protected)/wallet/transfer",
  history: "/(protected)/wallet/history",
  transactionhistory: "/(protected)/(features)/transactionhistory",
  detailtransaction: "/(protected)/(features)/detailtransaction",
  withdrawalreceipt: "/(protected)/withdrawalReceipt",

  // Individual tab routes (for direct navigation if needed)
  tabs: {
    home: "/(protected)/(tabs)",
    calculator: "/(protected)/(tabs)/calculator",
    rank: "/(protected)/(tabs)/rank",
    settings: "/(protected)/(tabs)/settings",
  },

  // auth paths
  auth: {
    base: "/auth",
    login: "/(auth)/auth/login",
    register: "/(auth)/auth/register",
    forgotPassword: "/(auth)/auth/forgot-password",
    resetPassword: "/(auth)/auth/reset-password",
    verifyEmailPhone: "/(auth)/auth/verify-email-phone",
    verifyOtp: "/(auth)/auth/verify-otp",
    createPin: "/(auth)/auth/create-pin",
    confirmPin: "/(auth)/auth/confirm-pin",
    verifyCreatePin: "/(auth)/auth/verify-create-pin",
    loginWithBiometrics: "/(auth)/auth/loginwithBiometrics",
  },
  setting: {
    base: "/(protected)/(settings)",
    security: "/(protected)/(settings)/security",
    accountInformation: "/(protected)/(settings)/accountInformation",
    changepassword: "/(protected)/(settings)/changepassword",
    changepin: "/(protected)/(settings)/changepin",
    newpin: "/(protected)/(settings)/newpin",
    paymentbank: "/(protected)/(settings)/paymentbank",
    verificationcode: "/(protected)/(settings)/verificationcode",
    support: "/(protected)/(settings)/support",
    referfriends: "/(protected)/(settings)/referfriends",
    addBank: "/(protected)/(settings)/addBank",
    kyc: "/(protected)/(settings)/kyc",
    faceVerification: "/(protected)/(settings)/verifyfacialIdentity",
    cameraScanner: "/(protected)/(settings)/cameraScanner",
    ninVerification: "/(protected)/(settings)/verifynin",
    kycSuccess: "/(protected)/(settings)/kycsuccess",
    changetheme: "/(protected)/(settings)/changetheme",
  },

  // main app paths
  bills: {
    base: `/(protected)/(features)/bills`,
    airtime: `/(protected)/(features)/bills/airtime`,
    data: `/(protected)/(features)/bills/data`,
    cable: `/(protected)/(features)/bills/cable`,
    cableData: `/(protected)/(features)/bills/cabledata`,
    electricity: `/(protected)/(features)/bills/electricity`,
    electricityData: `/(protected)/(features)/bills/electricitydata`,
    betting: `/(protected)/(features)/bills/betting`,
    billReceipt: `/(protected)/(features)/bills/allBillReceipt`,
    cableReceipt: `/(protected)/(features)/bills/cableReceipt`,

    //detail transaction
    detailtransaction: `/(protected)/transaction/detailtransaction`,
  },
  giftcards: {
    base: `/(protected)/(features)/giftcards`,
    buyGiftCards: `/(protected)/(features)/giftcards/buyGiftCards`,
    buyGiftcardsData: `/(protected)/(features)/giftcards/buyGiftcardsData`,
    buyGCreceipt: `/(protected)/(features)/giftcards/buyGCreceipt`,
    // sell giftcards
    sellGiftCards: `/(protected)/(features)/giftcards/sellGiftCards`,
    sellGiftCardsData: `/(protected)/(features)/giftcards/sellGiftCardsData`,
    sellGCreceipt: `/(protected)/(features)/giftcards/sellreceipt`,
    sellgiftcardstatus: `/(protected)/(features)/giftcards/sellgiftcardstatus`,
  },

  crypto: {
    base: `/(protected)/crypto`,
    buyCrypto: `/(protected)/(features)/crypto/buycrypto`,
    sellCrypto: `/(protected)/(features)/crypto/sellcrypto`,
    sellCryptoData: `/(protected)/(features)/crypto/sellCryptoData`,
  },
} as const;

export const ScreenPathsNames = {
  home: {
    name: "home",
    route: paths.home,
  },
  onboarding: {
    name: "Onboarding",
    route: paths.onboarding,
  },
  homeTabs: {
    name: "HomeTabs",
    route: paths.homeTabs,
  },
  settings: {
    name: "Settings",
    route: paths.settings,
  },
  rank: {
    name: "Rank",
    route: paths.rank,
  },
  calculator: {
    name: "Calculator",
    route: paths.calculator,
  },
  wallet: {
    name: "Wallet",
    route: paths.wallet,
  },
  notification: {
    name: "Notification",
    route: paths.notification,
  },
  more: {
    name: "More",
    route: paths.more,
  },
  auth: {
    login: {
      name: "Login",
      route: paths.auth.login,
    },
    register: {
      name: "Register",
      route: paths.auth.register,
    },
    forgotPassword: {
      name: "ForgotPassword",
      route: paths.auth.forgotPassword,
    },
    resetPassword: {
      name: "ResetPassword",
      route: paths.auth.resetPassword,
    },
    verifyEmailPhone: {
      name: "VerifyEmailPhone",
      route: paths.auth.verifyEmailPhone,
    },
    verifyOtp: {
      name: "VerifyOtp",
      route: paths.auth.verifyOtp,
    },
    createPin: {
      name: "CreatePin",
      route: paths.auth.createPin,
    },
    confirmPin: {
      name: "ConfirmPin",
      route: paths.auth.confirmPin,
    },
  },
  bills: {
    base: {
      name: "Bills",
      route: paths.bills.base,
    },
    airtime: {
      name: "Airtime",
      route: paths.bills.airtime,
    },
    data: {
      name: "Data",
      route: paths.bills.data,
    },
    cable: {
      name: "Cable",
      route: paths.bills.cable,
    },
    electricity: {
      name: "Electricity",
      route: paths.bills.electricity,
    },
  },
  giftcards: {
    base: {
      name: "Giftcards",
      route: paths.giftcards.base,
    },
    buyGiftCards: {
      name: "BuyGiftCards",
      route: paths.giftcards.buyGiftCards,
    },
    sellGiftCards: {
      name: "SellGiftCards",
      route: paths.giftcards.sellGiftCards,
    },
  },
  setting: {
    base: {
      name: "SettingsBase",
      route: paths.setting.base,
    },
    security: {
      name: "Security",
      route: paths.setting.security,
    },
    accountInformation: {
      name: "AccountInformation",
      route: paths.setting.accountInformation,
    },
    changepassword: {
      name: "ChangePassword",
      route: paths.setting.changepassword,
    },
    changepin: {
      name: "ChangePin",
      route: paths.setting.changepin,
    },
    newpin: {
      name: "NewPin",
      route: paths.setting.newpin,
    },
    paymentbank: {
      name: "PaymentBank",
      route: paths.setting.paymentbank,
    },
    verificationcode: {
      name: "VerificationCode",
      route: paths.setting.verificationcode,
    },
    support: {
      name: "Support",
      route: paths.setting.support,
    },
  },
} as const;
