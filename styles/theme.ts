import app_colors from "./color";

export const lightThemeVariations = {
  50: "#FCFCFC",
  75: "#F8FAFC",
  100: "#EEF2F6",
  150: "#FFFFFF",
  200: "#EFEFEF",
  300: "#CDD5DF",
  400: "#1E1E1E",
  500: "#697586",
  600: "#4B5565",
  700: "#363636",
  800: "#202939",
  900: "#121926",
  950: "#0D121C",
};

export const darkThemeVariations = {
  50: "#D2D2D2",
  75: "#B4B4B4",
  100: "#8E8E8E",
  200: "#B5B5B5",
  300: "#434343",
  400: "#232323",
  500: "#191919",
  600: "#141414",
  700: "#0F0F0F",
  750: "#111111",
  800: "#0A0A0A",
  900: "#0C0C0C",
  950: "#0D121C",
};

export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  [key: string]: string | undefined; // Allow for additional custom keys
};

export type ThemeColors = {
  light: ColorScale;
  dark: ColorScale;
};

export const colorThemes = {
  blue: app_colors.blue,
  green: app_colors.green,
  red: app_colors.red,
  purple: app_colors.purple,
  yellow: app_colors.yellow,
  california: app_colors.california,
  chateauGreen: app_colors.chateauGreen,
  lightGreen: app_colors.lightGreen,
  darkBlue: app_colors.darkBlue,
  nevada: app_colors.nevada,
  shakespeare: app_colors.shakespeare,
  stormGrey: app_colors.stormGrey,
  tomatoOrange: app_colors.tomatoOrange,
};

export type ThemeName = keyof typeof colorThemes;
