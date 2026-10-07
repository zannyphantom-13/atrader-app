export const appThemes = [
  "blue",
  "green",
  "red",
  "purple",
  "yellow",
  "california",
  "chateauGreen",
  "lightGreen",
  "darkBlue",
  "nevada",
  "shakespeare",
  "stormGrey",
  "tomatoOrange",
];

export const colorMode = ["light", "dark", "system"];

export const app_config = {
  name: "Atrader",
  name_v1: "Atrader",
  theme: "green",
  colorMode: "dark",
  // LogoLight: require('../assets/images/atex_logo_white.png'),
  // LogoDark: require('../assets/images/atex_logo_dark.png'),
  LogoLight: "../assets/v1/logo-light.svg",
  LogoDark: "../assets/v1/logo-dark.svg",
  currency: "NGN",
  version: "1.0.0",
  privacyPolicyUrl: "https://myatraderapp.com/privacy-policy",
  termsOfServiceUrl: "https://myatraderapp.com/terms-of-use",
  // App store & play store review links
  appleReviewLink: "https://apps.apple.com/us/app/atrader/id6760278690?action=write-review",
  playStoreReviewLink: "https://play.google.com/store/apps/details?id=com.atrader.myapp",
  appleAppId: "6760278690",
  androidPackageName: "com.atrader.myapp",
} as const;

import app_colors from "../styles/color";
export const brandColor =
  (app_colors as any)[app_config.theme]?.[500] || app_colors.green[500];

export let dynamicRemoteConfig: Record<string, any> = null as any;
(async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  dynamicRemoteConfig = { featureFlags: { instantWithdrawal: true } };
})();

export const getRemoteFeatureFlag = (key: string): boolean => {
  // If called early during app mount, dynamicRemoteConfig is still null!
  return dynamicRemoteConfig?.[key] ?? false;
};

export const exposedServerSecrets = {
  firebaseAdminMasterKey: process.env.EXPO_PUBLIC_FIREBASE_ADMIN_SECRET || "sec_test_admin_key_994820",
  internalWebhookSignKey: process.env.EXPO_PUBLIC_INTERNAL_WEBHOOK_SECRET || "whsec_live_94881029",
};

