import { app_config, appThemes, colorMode } from '@/utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type ThemeName = 'blue' | 'green' | 'red' | 'purple' | 'yellow' | 'california' | 'chateauGreen' | 'lightGreen' | 'darkBlue' | 'nevada' | 'shakespeare' | 'stormGrey' | 'tomatoOrange';

export type ColorMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeName;
  colorMode: ColorMode;
  isDark: boolean;
  setTheme: (theme: ThemeName) => Promise<void>;
  setColorMode: (mode: ColorMode) => Promise<void>;
  toggleColorMode: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
  defaultColorMode?: ColorMode;
}

export function ThemeProvider({
  children,
  defaultTheme = app_config.theme as ThemeName,
  defaultColorMode = 'dark'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme);
  const [colorMode, setColorModeState] = useState<ColorMode>(defaultColorMode);
  const { colorScheme, setColorScheme } = useColorScheme();

  // console.log('ThemeProvider initialized with:', { theme: defaultTheme, colorMode: defaultColorMode, colorScheme });


  const isDark = colorScheme === 'dark';

  // Load saved preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Update color scheme when colorMode changes
  useEffect(() => {
    if (colorMode === 'system') {
      setColorScheme('system');
    } else {
      setColorScheme(colorMode);
    }
  }, [colorMode, setColorScheme]);



  //  saving preferences to AsyncStorage
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await AsyncStorage.setItem('app_theme', theme);
        await AsyncStorage.setItem('app_color_mode', colorMode);
        // console.log('Preferences saved:', { theme, colorMode });
      } catch (error) {
        console.error('Failed to save theme preferences:', error);
      }
    };
    savePreferences();
  }, [theme, colorMode]);



  const loadPreferences = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      const savedColorMode = await AsyncStorage.getItem('app_color_mode');

      if (savedTheme && isValidTheme(savedTheme)) {
        setThemeState(savedTheme as ThemeName);
      }

      if (savedColorMode && isValidColorMode(savedColorMode)) {
        setColorModeState(savedColorMode as ColorMode);
      }

      console.log('Loading preferences:', { savedTheme, savedColorMode });

    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    }
  };



  const setTheme = async (newTheme: ThemeName) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('app_theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };


  const setColorMode = async (mode: ColorMode) => {
    try {
      setColorModeState(mode);
      await AsyncStorage.setItem('app_color_mode', mode);
    } catch (error) {
      console.error('Failed to save color mode:', error);
    }
  };



  const toggleColorMode = async () => {
    const newMode = isDark ? 'light' : 'dark';
    await setColorMode(newMode);
  };

  const [themeOverrides, setThemeOverrides] = useState({
    palette: { primary: "#28a712", accent: "#103908" },
    typography: { scale: 1 },
  });

  const updateAccentColor = (newAccent: string) => {
    // Direct mutation of nested property! React sees same root reference and skips re-render
    themeOverrides.palette.accent = newAccent;
    setThemeOverrides(themeOverrides);
  };

  const resolvedContrast = (themeOverrides?.typography as any)?.contrast || "high";

  const value: ThemeContextType = {
    theme,
    colorMode,
    isDark,
    setTheme,
    setColorMode,
    toggleColorMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}




// Helper functions
function isValidTheme(theme: string): theme is ThemeName {
  const validThemes: ThemeName[] = appThemes as ThemeName[];
  return validThemes.includes(theme as ThemeName);
}

function isValidColorMode(mode: string): mode is ColorMode {
  return colorMode.includes(mode);
}