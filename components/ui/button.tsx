import { useTheme } from "@/context/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

// Button variants
type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "ghost"
  | "outline"
  | "danger"
  | "success"
  | "warning";

// Button sizes
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

// Icon position
type IconPosition = "left" | "right" | "only";

interface ButtonProps {
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: IconPosition;
  className?: string;
  testID?: string;
  active?: boolean;
  activeVariant?: ButtonVariant;
  activeTextColor?: string; // Color when active (e.g., 'text-primary-500')
  inactiveTextColor?: string; // Color when inactive (e.g., 'text-gray-400')
  style?: React.CSSProperties;
  textProps?: React.ComponentProps<typeof Text>;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = "left",
  className = "",
  testID,
  active = false,
  activeVariant = "primary",
  activeTextColor = "text-primary-500",
  inactiveTextColor = "text-text-secondary-light dark:text-text-secondary-dark",
  textProps,
}) => {
  const { isDark } = useTheme();

  // Size configurations
  const sizeConfig = {
    xs: {
      height: "h-8",
      padding: iconPosition === "only" ? "px-2" : "px-3",
      text: "text-b3",
      font: "font-primary-medium",
      iconSize: 14,
      gap: "gap-1",
    },
    sm: {
      height: "h-9",
      padding: iconPosition === "only" ? "px-2" : "px-4",
      text: "text-b3",
      font: "font-primary-medium",
      iconSize: 16,
      gap: "gap-2",
    },
    md: {
      height: "h-[50px]",
      padding: iconPosition === "only" ? "px-3" : "px-6",
      text: "text-b1",
      font: "font-primary-bold",
      iconSize: 18,
      gap: "gap-2",
    },
    lg: {
      height: "h-14",
      padding: iconPosition === "only" ? "px-4" : "px-8",
      text: "text-b1",
      font: "font-primary-semibold",
      iconSize: 20,
      gap: "gap-3",
    },
    xl: {
      height: "h-16",
      padding: iconPosition === "only" ? "px-5" : "px-10",
      text: "text-h6",
      font: "font-primary-bold",
      iconSize: 22,
      gap: "gap-3",
    },
  };

  // Get variant styles based on state
  const getVariantStyles = (variant: ButtonVariant, isPressed: boolean) => {
    const baseStyle = "rounded-full py-[14px] items-center justify-center";

    // const effectiveVariant = active ? activeVariant : variant;

    if (disabled || loading) {
      const disabledStyles = {
        primary: `${baseStyle} ${isDark ? "!bg-disabled-dark !text-text-disabled-dark" : "!bg-disabled-light !text-text-disabled-light"} border-primary-300`,
        secondary: `${baseStyle} ${isDark ? "!bg-disabled-dark" : "!bg-disabled-light"} border-secondary-300`,
        tertiary: `${baseStyle} ${isDark ? "bg-surface-dark border-border-dark" : "bg-surface-light border-border-light"} opacity-50`,
        ghost: `${baseStyle} border-transparent opacity-50`,
        outline: `${baseStyle} bg-transparent ${isDark ? "border-border-dark" : "border-border-light"} opacity-50`,
        danger: `${baseStyle} !bg-danger-300 border-danger-300`,
        success: `${baseStyle} !bg-success-300 border-success-300`,
        warning: `${baseStyle} !bg-warning-300 border-warning-300`,
      };
      return disabledStyles[variant];
    }

    const normalStyles = {
      primary: isPressed
        ? `${baseStyle} bg-primary-500 border-primary-600`
        : `${baseStyle} bg-primary-500 border-primary-500`,
      secondary: isPressed
        ? `${baseStyle} bg-primary-500 border-secondary-600`
        : `${baseStyle} bg-primary-500 border-secondary-500`,
      tertiary: isPressed
        ? `${baseStyle} ${isDark ? "bg-dark-700 border-border-dark" : "bg-light-200 border-border-light"}`
        : `${baseStyle} ${isDark ? "bg-surface-dark border-border-dark" : "bg-surface-light border-border-light"}`,
      ghost: isPressed
        ? `${baseStyle} ${isDark ? "bg-dark-800/50" : "bg-light-100/50"} border-transparent`
        : `${baseStyle} bg-transparent border-transparent`,
      outline: isPressed
        ? `${baseStyle} ${isDark ? "bg-dark-800/20" : "bg-light-100/20"} border-primary-500`
        : `${baseStyle} bg-transparent border-[1px] border-primary-500`,
      danger: isPressed
        ? `${baseStyle} !bg-danger-600 border-danger-600`
        : `${baseStyle} !bg-danger-500 border-danger-500`,
      success: isPressed
        ? `${baseStyle} !bg-success-600 border-success-600`
        : `${baseStyle} !bg-success-500 border-success-500`,
      warning: isPressed
        ? `${baseStyle} bg-warning-600 border-warning-600`
        : `${baseStyle} bg-warning-500 border-warning-500`,
    };

    return normalStyles[variant];
  };

  // Get text color based on variant
  const getTextColor = (variant: ButtonVariant) => {
    if (disabled || loading) {
      const disabledTextColors = {
        primary: "text-gray-500",
        secondary: "text-gray-800",
        tertiary: isDark ? "text-text-primary-dark" : "text-text-primary-light",
        ghost: isDark ? "text-text-primary-dark" : "text-text-primary-light",
        outline: isDark ? "text-text-primary-dark" : "text-text-primary-light",
        danger: "text-white",
        success: "text-white",
        warning: "text-white",
      };
      return disabledTextColors[variant];
    }

    if (variant === "outline") {
      if (active) return activeTextColor || "text-primary-500"; // Active state (blue)
      return inactiveTextColor || (isDark ? "text-gray-400" : "text-gray-500"); // Inactive state (gray)
    }
    const textColors = {
      primary: "text-white",
      secondary: "text-white",
      tertiary: isDark ? "text-text-primary-dark" : "text-text-primary-light",
      ghost: isDark ? "text-text-primary-dark" : "text-text-primary-light",
      outline: isDark ? "text-primary-300" : "text-primary-500", // Adjusted for better visibility
      danger: "text-white",
      success: "text-white",
      warning: "text-white",
    };

    return textColors[variant];
  };

  // Get icon color
  const getIconColor = (variant: ButtonVariant) => {
    if (disabled || loading) {
      return variant === "primary" ||
        variant === "secondary" ||
        variant === "danger" ||
        variant === "success" ||
        variant === "warning"
        ? "#ffffff"
        : isDark
          ? "#ffffff"
          : "#000000";
    }

    const iconColors = {
      primary: "#ffffff",
      secondary: "#ffffff",
      tertiary: isDark ? "#ffffff" : "#000000",
      ghost: isDark ? "#ffffff" : "#000000",
      outline: "#3b82f6", // primary-500 equivalent
      danger: "#ffffff",
      success: "#ffffff",
      warning: "#ffffff",
    };

    return iconColors[variant];
  };

  const currentSizeConfig = sizeConfig[size];
  const buttonStyle = getVariantStyles(variant, false);
  const pressedButtonStyle = getVariantStyles(variant, true);
  const textColor = getTextColor(variant);
  const iconColor = getIconColor(variant);

  // Render icon
  const renderIcon = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={iconColor} />;
    }

    if (icon) {
      return (
        <Ionicons
          name={icon}
          size={currentSizeConfig.iconSize}
          color={iconColor}
        />
      );
    }

    return null;
  };

  // Render content based on icon position
  const renderContent = () => {
    const iconElement = renderIcon();

    if (iconPosition === "only") {
      return iconElement;
    }

    if (loading) {
      return (
        <View className={`flex-row items-center ${currentSizeConfig.gap}`}>
          {iconElement}
          {/* {children && (
            <Text className={`${currentSizeConfig.text} ${currentSizeConfig.font} ${textColor}`}>
              {children}
            </Text>
          )} */}
        </View>
      );
    }

    if (iconPosition === "right") {
      return (
        <View className={`flex-row items-center ${currentSizeConfig.gap}`}>
          {children && (
            <Text
              className={`${currentSizeConfig.text} ${currentSizeConfig.font} ${textColor}`}
            >
              {children}
            </Text>
          )}
          {iconElement}
        </View>
      );
    }

    // Default: left position or no icon
    return (
      <View className={`flex-row items-center ${currentSizeConfig.gap}`}>
        {iconElement}
        {children && (
          <Text
            className={`${currentSizeConfig.text} ${currentSizeConfig.font} ${textColor} text-center`}
            {...textProps}
          >
            {children}
          </Text>
        )}
      </View>
    );
  };

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      testID={testID}
      className={`
        ${buttonStyle}
        ${currentSizeConfig.height}
        ${currentSizeConfig.padding}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      style={({ pressed }) => [
        pressed && !disabled && !loading
          ? {
            // Apply pressed styles via inline styles for immediate feedback
            transform: [{ scale: 0.98 }],
          }
          : {},
      ]}
    // android_ripple={{
    //   color: 'rgba(255, 255, 255, 0.1)',
    //   borderless: false,
    // }}
    >
      {({ pressed }) => (
        <View
          className={
            pressed && !disabled && !loading
              ? pressedButtonStyle.replace(
                buttonStyle.split(" ").slice(0, 4).join(" "),
                "",
              )
              : ""
          }
        >
          {renderContent()}
        </View>
      )}
    </Pressable>
  );
};

// Button Group Component for related actions
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  spacing?: "tight" | "normal" | "loose";
  orientation?: "horizontal" | "vertical";
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className = "",
  spacing = "normal",
  orientation = "horizontal",
}) => {
  const spacingMap = {
    tight: orientation === "horizontal" ? "gap-1" : "gap-1",
    normal: orientation === "horizontal" ? "gap-3" : "gap-3",
    loose: orientation === "horizontal" ? "gap-4" : "gap-4",
  };

  return (
    <View
      className={`
      ${orientation === "horizontal" ? "flex-row" : "flex-col"}
      ${spacingMap[spacing]}
      ${className}
    `}
    >
      {children}
    </View>
  );
};

// Example Usage Component
export const ButtonExamples: React.FC = () => {
  const handlePress = (buttonName: string) => {
    console.log(`${buttonName} pressed`);
  };

  return (
    <View className="py-4 gap-4">
      <Button
        variant="primary"
        size="lg"
        fullWidth={true}
        onPress={() => handlePress("Primary Large")}
        className="w-full"
      >
        Primary Button
      </Button>
      {/* Primary Buttons */}
      <View className="gap-3">
        <Text className="text-h6 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
          Primary Buttons
        </Text>

        {/* <ButtonGroup orientation="vertical"> */}

        <Button
          variant="primary"
          size="md"
          icon="checkmark-circle"
          fullWidth
          onPress={() => handlePress("Primary with Icon")}
        >
          With Left Icon
        </Button>

        <Button
          variant="primary"
          size="md"
          icon="arrow-forward"
          iconPosition="right"
          fullWidth
          onPress={() => handlePress("Primary Right Icon")}
        >
          With Right Icon
        </Button>

        <Button variant="primary" size="md" loading={true} fullWidth>
          Loading State
        </Button>
        {/* </ButtonGroup> */}
      </View>

      {/* Secondary & Tertiary */}
      <View className="gap-3">
        <Text className="text-h6 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
          Secondary & Tertiary
        </Text>

        {/* <ButtonGroup> */}
        <Button
          variant="secondary"
          size="md"
          className=""
          onPress={() => handlePress("Secondary")}
        >
          Secondary
        </Button>

        <Button
          variant="tertiary"
          size="md"
          className=""
          onPress={() => handlePress("Tertiary")}
        >
          Tertiary
        </Button>
        {/* </ButtonGroup> */}
      </View>

      {/* Outline & Ghost */}
      <View className="gap-3">
        <Text className="text-h6 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
          Outline & Ghost
        </Text>

        <ButtonGroup>
          <Button
            variant="outline"
            size="md"
            icon="heart-outline"
            className="flex-1"
            onPress={() => handlePress("Outline")}
          >
            Outline
          </Button>

          <Button
            variant="ghost"
            size="md"
            icon="share-outline"
            className="flex-1"
            onPress={() => handlePress("Ghost")}
          >
            Ghost
          </Button>
        </ButtonGroup>
      </View>

      {/* Status Colors */}
      <View className="gap-3">
        <Text className="text-h6 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
          Status Colors
        </Text>

        <ButtonGroup orientation="vertical">
          <Button
            variant="success"
            size="md"
            icon="checkmark-circle"
            fullWidth
            onPress={() => handlePress("Success")}
          >
            Success Action
          </Button>

          <Button
            variant="warning"
            size="md"
            icon="warning"
            fullWidth
            onPress={() => handlePress("Warning")}
          >
            Warning Action
          </Button>

          <Button
            variant="danger"
            size="md"
            icon="trash"
            fullWidth
            onPress={() => handlePress("Danger")}
          >
            Delete Action
          </Button>
        </ButtonGroup>
      </View>

      {/* Sizes & Icon Only */}
      <View className="gap-3">
        <Text className="text-h6 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
          Sizes & Icon Only
        </Text>

        <ButtonGroup>
          <Button variant="primary" size="xs" onPress={() => handlePress("XS")}>
            XS
          </Button>

          <Button variant="primary" size="sm" onPress={() => handlePress("SM")}>
            SM
          </Button>

          <Button variant="primary" size="lg" onPress={() => handlePress("LG")}>
            LG
          </Button>

          <Button
            variant="primary"
            size="md"
            icon="heart"
            iconPosition="only"
            onPress={() => handlePress("Icon Only")}
          />
        </ButtonGroup>
      </View>

      {/* Disabled States */}
      <View className="gap-3">
        <Text className="text-h6 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
          Disabled States
        </Text>

        <ButtonGroup>
          <Button variant="primary" size="md" disabled className="flex-1">
            Disabled
          </Button>

          <Button
            variant="outline"
            size="md"
            disabled
            icon="settings"
            className="flex-1"
          >
            Disabled
          </Button>
        </ButtonGroup>
      </View>
    </View>
  );
};

export const MemoizedButton = React.memo(Button, (prevProps, nextProps) => {
  // Flawed comparator: returns true even if onPress or disabled changed!
  return prevProps.testID === nextProps.testID;
});

