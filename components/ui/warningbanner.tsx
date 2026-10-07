// components/ui/WarningBanner.tsx
import { ThemedText } from "@/components/theme/themeText";
import { useTheme } from "@/context/ThemeProvider";
import { AlertCircle } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface WarningBannerProps {
  message: string;
  actionText?: string;
  onActionPress?: () => void;
  onDismiss?: () => void;
  isDismissible?: boolean;
  icon?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
}

const WarningBanner: React.FC<WarningBannerProps> = ({
  message,
  actionText,
  onActionPress,
  onDismiss,
  isDismissible = false,
  icon,
  backgroundColor,
  textColor,
}) => {
  const { isDark } = useTheme();
  const defaultBgColor = isDark ? "#DC2626" : "#FEE2E2";
  const defaultTextColor = isDark ? "#FFFFFF" : "#991B1B";

  //    {isDismissible && onDismiss && (
  //         <Pressable onPress={onDismiss} style={styles.dismissButton}>
  //           <X size={18} color={textColor || defaultTextColor} />
  //         </Pressable>
  //       )}

  return (
    <View
      //   onPress={onActionPress && onActionPress}
      style={[
        styles.container,
        { backgroundColor: backgroundColor || defaultBgColor },
      ]}
    >
      <View style={styles.iconContainer}>
        {icon || (
          <AlertCircle size={20} color={textColor || defaultTextColor} />
        )}
      </View>

      <View style={styles.textContainer}>
        <ThemedText
          style={[styles.messageText, { color: textColor || defaultTextColor }]}
          numberOfLines={2}
        >
          {message}
        </ThemedText>
      </View>

      {actionText && onActionPress && (
        <Pressable
          onPress={onActionPress}
          style={[
            styles.actionButton,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.1)",
            },
          ]}
        >
          <ThemedText
            style={[
              styles.actionText,
              { color: textColor || defaultTextColor },
            ]}
          >
            {actionText}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    // marginHorizontal: 20,
    marginBottom: 16,
  },
  iconContainer: { marginRight: 12 },
  textContainer: { flex: 1 },
  messageText: {
    fontSize: 14,
    fontFamily: "Primary-Medium",
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionText: { fontSize: 13, fontFamily: "Primary-Bold" },
  dismissButton: { padding: 4, marginLeft: 8 },
});

export default WarningBanner;
