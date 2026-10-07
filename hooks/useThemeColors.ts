import { useTheme } from '@/context/ThemeProvider';
import { useMemo } from 'react';


// Hook for getting theme-aware colors for React Native components
export function useThemeColors() {
  const { theme, isDark } = useTheme();
  
  return useMemo(() => ({
    primary: getThemeColor(theme, 500),
    primaryLight: getThemeColor(theme, 100),
    primaryDark: getThemeColor(theme, 700),
    
    background: isDark ? '#060606' : '#FCFCFD',
    surface: isDark ? '#0A0A0A' : '#F8FAFC',
    card: isDark ? '#0F0F0F' : '#EEF2F6',
    
    text: {
      primary: isDark ? '#D2D2D2' : '#121926',
      secondary: isDark ? '#B4B4B4' : '#4B5565',
      tertiary: isDark ? '#8E8E8E' : '#697586',
    },

    
    border: isDark ? '#434343' : '#E3E8EF',
    
    status: {
      success: '#22c55e',
      danger: '#ef4444',
      warning: '#f59e0b',
    }
  }), [theme, isDark]);
}





// Helper function to get theme color values
function getThemeColor(theme: string, shade: number): string {
  // This would ideally import your color definitions
  // For now, returning a placeholder - you'd replace this with actual color values
  const colorMap: Record<string, Record<number, string>> = {
    blue: {
      100: '#b8b6da',
      500: '#241d78',
      700: '#0e0c30',
    },
    // Add other themes...
  };
  
  return colorMap[theme]?.[shade] || '#000000';
}