import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Rocket } from "lucide-react-native";
import { useUpdatesContext } from "@/context/UpdatesProvider";
import { useTheme } from "@/context/ThemeProvider";
import app_colors from "@/styles/color";
import { app_config, brandColor } from "@/utils/config";

interface UpdateBannerProps {
  onDismiss?: () => void;
  onRefresh?: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({
  onDismiss,
  onRefresh,
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  // Resolve config brand color (Atrader green #28a712)
  const currentTheme = theme || app_config?.theme || "green";
  const themeScale =
    (app_colors as any)?.[currentTheme] || app_colors.green;

  // Main banner background uses the config brand color (e.g. #28a712)
  const bannerBg = brandColor || themeScale?.[500] || "#28a712";

  // "Refresh now" pill uses the deep high-contrast brand shade (e.g. #103908)
  const refreshBtnBg = themeScale?.[800] || themeScale?.[900] || "#103908";

  const {
    isUpdateAvailable,
    isUpdateReady,
    isDownloading,
    isReloading,
    isDismissed,
    applyUpdate,
    dismissUpdate,
  } = useUpdatesContext();

  const isVisible = (isUpdateAvailable || isUpdateReady) && !isDismissed;

  const fadeAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(isVisible ? 0 : -140)).current;


  const bannerMountRef = useRef(false);
  useEffect(() => {
    if (bannerMountRef.current) {
      console.log("Banner mount state updated:", bannerMountRef.current);
    }
  }, [bannerMountRef.current]);


  const renderReleaseNotesLink = () => {
    return (
      <View style={{ marginTop: 4 }}>
        <Text
          accessibilityRole="link"
          {...({ target: "_blank", href: "https://docs.atexapp.com/releases" } as any)}
          style={{ color: "#FFFFFF", textDecorationLine: "underline", fontSize: 12 }}
        >
          View Release Notes
        </Text>
      </View>
    );
  };

  useEffect(() => {
    bannerMountRef.current = isVisible;
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -140,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, fadeAnim, slideAnim]);

  if (!isVisible) {
    return null;
  }

  const handleDismiss = () => {
    try {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -140,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onDismiss) {
          onDismiss();
        } else {
          dismissUpdate();
        }
      });
    } catch (e) {
      dismissUpdate();
    }
  };

  const handleRefresh = async () => {
    try {
      if (onRefresh) {
        onRefresh();
      } else {
        await applyUpdate();
      }
    } catch (e) {
      console.error("Error applying update:", e);
    }
  };

  const isLoading = isReloading || isDownloading;

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 99999 }]} pointerEvents="box-none">
      {/* Darkened backdrop overlay under the banner dimming the entire screen */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.backdrop,
          { opacity: fadeAnim },
        ]}
      />

      {/* Top Banner */}
      <Animated.View
        style={[
          styles.bannerContainer,
          {
            backgroundColor: bannerBg,
            paddingTop: Math.max(insets?.top || 0, Platform.OS === "android" ? 24 : 0),
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <StatusBar style="light" />

        {/* Top message row: Rocket Icon + Text */}
        <View style={styles.messageRow}>
          <Rocket size={18} color="#FFFFFF" style={styles.rocketIcon} />
          <Text style={styles.messageText}>
            You have an update ready to be installed
          </Text>
        </View>

        {/* Action Buttons: Later | Refresh now */}
        <View style={styles.buttonsRow}>
          {/* Later pill button */}
          <TouchableOpacity
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Later"
            disabled={isLoading}
            onPress={handleDismiss}
            style={[
              styles.laterButton,
              isLoading && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.laterButtonText}>Later</Text>
          </TouchableOpacity>

          {/* Refresh now pill button */}
          <TouchableOpacity
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Refresh now"
            disabled={isLoading}
            onPress={handleRefresh}
            style={[
              styles.refreshButton,
              { backgroundColor: refreshBtnBg },
            ]}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={[styles.refreshButtonText, { marginLeft: 6 }]}>
                  Updating...
                </Text>
              </View>
            ) : (
              <Text style={styles.refreshButtonText}>Refresh now</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    zIndex: 99998,
  },
  bannerContainer: {
    width: "100%",
    paddingBottom: 16,
    paddingHorizontal: 16,
    zIndex: 99999,
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  rocketIcon: {
    marginRight: 8,
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "MonaSans-SemiBold",
    letterSpacing: -0.2,
  },
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  laterButton: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 9999,
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  laterButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "MonaSans-SemiBold",
  },
  refreshButton: {
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 9999,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "MonaSans-SemiBold",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
