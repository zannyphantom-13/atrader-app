import { useTheme } from '@/context/ThemeProvider';
import { FontFamily, FontWeight } from '@/styles/typography';
import React from 'react';
import { Text, TextProps } from 'react-native';

interface CustomTextProps extends TextProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'accent';
  className?: string;
  weight?: FontWeight; 
  family?: FontFamily; 
  size?: number; 
}

const font_classes: Record<FontFamily, Record<FontWeight, string>> = {
      primary: {
          light: 'font-primary-light',
          regular: 'font-primary-regular',
          medium: 'font-primary-medium',
          semibold: 'font-primary-semibold',
          bold: 'font-primary-bold',
          extrabold: '',
          extralight: '',
        },
        secondary: {
          extralight: 'font-secondary-extralight',
          light: 'font-secondary-light',
          regular: 'font-secondary-regular',
          medium: 'font-secondary-medium',
          semibold: 'font-secondary-semibold',
          bold: 'font-secondary-bold',
          extrabold: 'font-secondary-extrabold',
        }
  }

export function ThemedText({ 
  variant = 'primary',
  family = 'primary', 
  weight = 'regular',
  size,
  className = '',
  ...props 
}: CustomTextProps) {
  const { theme, isDark } = useTheme();

  // Using the same pattern as your CustomView
  const variantClasses = {
    primary: 'text-text-primary-light dark:text-text-primary-dark',
    secondary: 'text-text-secondary-light dark:text-text-secondary-dark',
    tertiary: 'text-text-tertiary-light dark:text-text-tertiary-dark',
    accent: `text-${theme}-500 dark:text-${theme}-400`,
  };

  const textColor = variantClasses[variant];
  const fontstyle = font_classes[family][weight];

  return (
    <Text 
      className={`${fontstyle} ${textColor} ${className} `}
      {...props}
    />
  );
}