import { useTheme } from "@/context/ThemeProvider";
import React from "react";
import { View, ViewProps } from "react-native";
import { useThemeStyles } from "../../hooks/useThemeStyles";

interface ThemedViewProps extends ViewProps {
  variant?: "background" | "surface" | "card";
  className?: string;
  children?: React.ReactNode;
}

interface CustomViewProps extends ViewProps {
  variant?: "background" | "surface" | "card";
  className?: string;
  children?: React.ReactNode;
}

export function ThemedView({
  variant = "background",
  className = "",
  children,
  ...props
}: ThemedViewProps) {
  const styles = useThemeStyles();

  const variantClass = styles.bg[variant];

  return (
    <View className={`${variantClass} ${className}`} {...props}>
      {children}
    </View>
  );
}

export function CustomView({
  variant = "background",
  className = "",
  children,
  ...props
}: CustomViewProps) {
  const { isDark } = useTheme();

  // console.log('isDark', isDark);

  const variantClasses = {
    background: "bg-background-light dark:bg-background-dark ",
    surface: "bg-surface-light dark:bg-surface-dark ",
    card: "bg-card-light dark:bg-card-dark",
  };

  // const backgroundColor = getBackgroundColor();
  // variantClasses[variant] = isDark ? variantClasses[`${variant}-dark`] : variantClasses[`${variant}-light`];
  const backgroundColor = variantClasses[variant];

  // console.log('CustomView backgroundColor:', backgroundColor);

  return (
    <View className={`${backgroundColor} ${className} `} {...props}>
      {children}
    </View>
  );
}
