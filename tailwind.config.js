/** @type {import('tailwindcss').Config} */
const app_colors = require("./styles/color");
const { lightThemeVariations, darkThemeVariations } = require("./styles/theme");
const { typography } = require("./styles/typography");
const { primary_font, secondary_font } = require("./constant/font");
const { app_config } = require("./utils/config");

module.exports = {
  darkMode: "class",
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: app_colors[app_config.theme],
        secondary: app_colors[app_config.theme],
        light: lightThemeVariations,
        dark: darkThemeVariations,
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },

        //  theme aware colors for ease use
        background: {
          light: lightThemeVariations[50],
          dark: darkThemeVariations[900],
        },
        surface: {
          light: lightThemeVariations[100],
          dark: darkThemeVariations[800],
        },
        card: {
          light: lightThemeVariations[75],
          dark: darkThemeVariations[700],
        },
        disabled: {
          light: lightThemeVariations[300],
          dark: darkThemeVariations[600],
        },
        foreground: {
          light: lightThemeVariations[150],
          dark: darkThemeVariations[750],
        },
        text: {
          primary: {
            light: "#000000",
            dark: "#ffffff",
          },
          secondary: {
            light: lightThemeVariations[600],
            dark: darkThemeVariations[100],
          },
          tertiary: {
            light: lightThemeVariations[500],
            dark: darkThemeVariations[300],
          },
          disabled: {
            light: lightThemeVariations[400],
            dark: darkThemeVariations[500],
          },
          foreground: {
            light: lightThemeVariations[700],
            dark: darkThemeVariations[200],
          },
        },
        border: {
          light: lightThemeVariations[200],
          dark: darkThemeVariations[400],
        },

        //  custom colors
        green: app_colors.green,
        red: app_colors.red,
        yellow: app_colors.yellow,
        purple: app_colors.purple,
        california: app_colors.california,
        chateauGreen: app_colors.chateauGreen,
        lightGreen: app_colors.lightGreen,
        darkBlue: app_colors.darkBlue,
        nevada: app_colors.nevada,
        shakespeare: app_colors.shakespeare,
        stormGrey: app_colors.stormGrey,
        tomatoOrange: app_colors.tomatoOrange,
      },
      spacing: {
        // Custom spacing values
        0: "0px",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        7: "28px",
        8: "32px",
        9: "36px",
        10: "40px",
        11: "44px",
        12: "48px",
        14: "56px",
        15: "60px",
        16: "64px",
        17: "68px",
        18: "72px",
        20: "80px",
        22: "88px",
        24: "96px",
        26: "104px",
        28: "112px",
        30: "120px",
      },
      screens: {
        xs: "320px",
        sm: "480px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
      fontFamily: {
        // primary: [typography.fontFamily.primary, 'sans-serif'],

        // Space Grotesk
        "primary-light": [primary_font.light],
        "primary-regular": [primary_font.regular],
        "primary-medium": [primary_font.medium],
        "primary-semibold": [primary_font.semibold],
        "primary-bold": [primary_font.bold],
        "primary-extrabold": [primary_font.extrabold],
        "primary-extralight": [primary_font.extralight],

        // Manrope
        "secondary-extralight": [secondary_font.extralight],
        "secondary-light": [secondary_font.light],
        "secondary-regular": [secondary_font.regular],
        "secondary-medium": [secondary_font.medium],
        "secondary-semibold": [secondary_font.semibold],
        "secondary-bold": [secondary_font.bold],
        "secondary-extrabold": [secondary_font.extrabold],

        // tertiary inter font
        "tertiary-regular": [typography.fontFamily.tertiary],
        "tertiary-medium": [typography.fontFamily.tertiary],
        "tertiary-semibold": [typography.fontFamily.tertiary],
        "tertiary-bold": [typography.fontFamily.tertiary],

        // Default font stacks
        sans: ["MonaSans-Regular", "sans-serif"],
        "sans-manrope": ["Manrope-Regular", "sans-serif"],
      },
      fontSize: {
        // xs: '0.75rem',
        // sm: '0.875rem',
        // base: '1rem',
        // lg: '1.125rem',
        // xl: '1.25rem',
        // '2xl': '1.5rem',
        // '3xl': '1.875rem',
        // '4xl': '2.25rem',
        // '5xl': '3rem',
        // '6xl': '4rem',
        // '7xl': '5rem',
        h1: [
          `${typography.heading.h1.fontSize}px`,
          `${typography.heading.h1.lineHeight}px`,
        ],
        h2: [
          `${typography.heading.h2.fontSize}px`,
          `${typography.heading.h2.lineHeight}px`,
        ],
        h3: [
          `${typography.heading.h3.fontSize}px`,
          `${typography.heading.h3.lineHeight}px`,
        ],
        h4: [
          `${typography.heading.h4.fontSize}px`,
          `${typography.heading.h4.lineHeight}px`,
        ],
        h5: [
          `${typography.heading.h5.fontSize}px`,
          `${typography.heading.h5.lineHeight}px`,
        ],
        h6: [
          `${typography.heading.h6.fontSize}px`,
          `${typography.heading.h6.lineHeight}px`,
        ],
        h7: [
          `${typography.heading.h7.fontSize}px`,
          `${typography.heading.h7.lineHeight}px`,
        ],
        h8: [
          `${typography.heading.h8.fontSize}px`,
          `${typography.heading.h8.lineHeight}px`,
        ],

        // Body sizes
        b1: [
          `${typography.body.b1.fontSize}px`,
          `${typography.body.b1.lineHeight}px`,
        ],
        b2: [
          `${typography.body.b2.fontSize}px`,
          `${typography.body.b2.lineHeight}px`,
        ],
        b3: [
          `${typography.body.b3.fontSize}px`,
          `${typography.body.b3.lineHeight}px`,
        ],
      },
      fontWeight: {
        regular: typography.fontWeight.regular,
        medium: typography.fontWeight.medium,
        semiBold: typography.fontWeight.semiBold,
        bold: typography.fontWeight.bold,
      },
      borderRadius: {
        none: "0",
        sm: "0.125rem",
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      elevation: {
        sm: 1,
        DEFAULT: 2,
        md: 3,
        lg: 4,
        xl: 5,
        "2xl": 6,
      },
    },
  },

  plugins: [],
};
