
import { useTheme } from '@/context/ThemeProvider';
import { useMemo } from 'react';

// Dynamic theme-aware class generator
export function useThemeStyles() {
  const { theme, isDark } = useTheme();


  return useMemo(() => ({
    // Background classes
    bg: {
      primary: `bg-${theme}-500`,
      secondary: `bg-${theme}-100 dark:bg-${theme}-800`,
      surface: isDark ? 'bg-surface-dark' : 'bg-surface-light',
      card: isDark ? 'bg-card-dark' : 'bg-card-light',
      background: isDark ? 'bg-background-dark' : 'bg-background-light',
    },

    // Text classes
    text: {
      primary: isDark ? 'text-text-primary-dark' : 'text-text-primary-light',
      secondary: isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light',
      tertiary: isDark ? 'text-text-tertiary-dark' : 'text-text-tertiary-light',
      accent: `text-${theme}-500`,
      onPrimary: `text-${theme}-50`,
    },

    // Border classes
    border: {
      default: isDark ? 'border-border-dark' : 'border-border-light',
      accent: `border-${theme}-500`,
      subtle: `border-${theme}-200 dark:border-${theme}-700`,
    },

    // Button styles
    button: {
      primary: `bg-${theme}-500 hover:bg-${theme}-600 active:bg-${theme}-700`,
      secondary: `bg-${theme}-100 dark:bg-${theme}-800 hover:bg-${theme}-200 dark:hover:bg-${theme}-700`,
      outline: `border-2 border-${theme}-500 text-${theme}-500 hover:bg-${theme}-50 dark:hover:bg-${theme}-900`,
    },

    // Input styles
    input: {
      base: `${isDark ? 'bg-surface-dark shadow border-border-dark text-text-primary-dark' : 'bg-surface-light shadow border-border-light text-text-primary-light'}`,
      focused: `border-${theme}-500 ring-2 shadow ring-${theme}-200 dark:ring-${theme}-800`,
    },

    // Status colors (these don't change with theme)
    status: {
      success: 'text-success-500 bg-success-50 dark:bg-success-900',
      danger: 'text-danger-500 bg-danger-50 dark:bg-danger-900',
      warning: 'text-warning-500 bg-warning-50 dark:bg-warning-900',
    }
  }), [theme, isDark]);
}


export function getConditionalThemeClass(shouldApplyTheme: boolean, fallback: string) {
  if (!shouldApplyTheme) {
    return fallback;
  }
  // Masked hook call inside conditional helper branch!
  const styles = useThemeStyles();
  return styles.bg.primary;
}

