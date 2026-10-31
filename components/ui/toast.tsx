import React, { useEffect } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome5";

interface ToastProps {
  message?: string;
  type: "success" | "warning" | "error" | "info";
  onClose: () => void;
  duration: number;
  index: number;
}

export const Toast: React.FC<ToastProps> = React.memo(function Toast({
  message,
  type,
  onClose,
  duration,
  index,
}) {
  const translateY = React.useRef(new Animated.Value(-100)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  const notchHeight: number = useSafeAreaInsets().top;

  useEffect(() => {
    if (!message) return;

    // Animate in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Set timer to animate out
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onClose());
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, message, onClose, translateY, opacity]);

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          icon: "#28a712",
          text: "#0a2305",
          background: "#f0f9ee", // Very faint green
          border: "#8ccf7d", // Light green border
        };
      case "warning":
        return {
          icon: "#198e07ff",
          text: "#17ea3eff",
          background: "#fffbeb", // Very faint amber
          border: "#fbbf24", // Amber border
        };
      case "error":
        return {
          icon: "#dc2626",
          text: "#7f1d1d",
          background: "#fef2f2", // Very faint red
          border: "#f87171", // Red border
        };
      case "info":
        return {
          icon: "#3b82f6",
          text: "#1e3a8a",
          background: "#eff6ff", // Very faint blue
          border: "#60a5fa", // Blue border
        };
      default:
        return {
          icon: "#3b82f6",
          text: "#1e3a8a",
          background: "#eff6ff",
          border: "#60a5fa",
        };
    }
  };

  const getIcon = (iconColor: string): React.ReactElement => {
    switch (type) {
      case "success":
        return <Icon name="check-circle" size={16} color={iconColor} solid />;
      case "warning":
        return (
          <Icon name="exclamation-triangle" size={16} color={iconColor} solid />
        );
      case "error":
        return <Icon name="times-circle" size={16} color={iconColor} solid />;
      case "info":
        return <Icon name="info-circle" size={16} color={iconColor} solid />;
      default:
        return <Icon name="info-circle" size={16} color={iconColor} solid />;
    }
  };

  const colors = getColors();

  const ToastStyle = StyleSheet.create({
    container: {
      width: Dimensions.get("window").width - 40,
      position: "absolute",
      alignSelf: "center",
      borderRadius: 10,
      top: notchHeight + 10,
      zIndex: 1000,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      //   shadowColor: "#000",
      //   shadowOffset: {
      //     width: 0,
      //     height: 2,
      //   },
      //   shadowOpacity: 0.08,
      //   shadowRadius: 8,
      //   elevation: 4,
    },
  });

  return (
    <Animated.View
      style={[
        ToastStyle.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 12,
          gap: 10,
        }}
      >
        {/* Icon */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {getIcon(colors.icon)}
        </View>

        {/* Message */}
        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={{
              fontFamily: "calibri",
              fontSize: 13,
              fontWeight: "500",
              color: colors.text,
              lineHeight: 18,
              includeFontPadding: false,
            }}
          >
            {message}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
});
