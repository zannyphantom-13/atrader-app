import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUpCircle, RefreshCw, Sparkles, X } from "lucide-react-native";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { useTheme } from "@/context/ThemeProvider";
import { useUpdatesContext } from "@/context/UpdatesProvider";
import { img } from "@/constant/image";

export const AppUpdateModal: React.FC = () => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding =
    Platform.OS === "android" ? Math.max(insets.bottom, 24) : insets.bottom || 16;

  const {
    isUpdateAvailable,
    isDownloading,
    isReloading,
    isDismissed,
    updateType,
    updateMessage,
    applyUpdate,
    dismissUpdate,
  } = useUpdatesContext();

  const isVisible = isUpdateAvailable && (!isDismissed || updateType === "compulsory");

  const slideAnim = useRef(new Animated.Value(450)).current;
  const [showModal, setShowModal] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShowModal(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 450,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShowModal(false);
      });
    }
  }, [isVisible]);

  const handleClose = () => {
    if (updateType === "compulsory") {
      // Compulsory updates cannot be closed or dismissed
      return;
    }
    Animated.timing(slideAnim, {
      toValue: 450,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
      dismissUpdate();
    });
  };

  if (!showModal) return null;

  const isCompulsory = updateType === "compulsory";
  const isLoading = isDownloading || isReloading;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60 justify-end rounded-t-[28px]">
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <ThemedView className="rounded-t-[28px] overflow-hidden">
            <ImageBackground
              source={isDark ? img.chatDarkBg : img.chatBg}
              resizeMode="cover"
              className="rounded-t-[28px] overflow-hidden pb-6"
              style={{
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                overflow: "hidden",
              }}
              imageStyle={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
            >
              {/* Close button (Only shown for optional updates) */}
              {!isCompulsory && (
                <Pressable
                  onPress={handleClose}
                  disabled={isLoading}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 items-center justify-center z-10"
                  hitSlop={16}
                >
                  <X size={18} color={isDark ? "#FFFFFF" : "#6B7280"} />
                </Pressable>
              )}

              {/* Modal Content */}
              <View
                className="items-center pt-8 px-6"
                style={{ paddingBottom: bottomPadding }}
              >
                {/* Visual Icon */}
                <View className="mb-4 w-16 h-16 rounded-full bg-primary-500/15 items-center justify-center border border-primary-500/30">
                  {isCompulsory ? (
                    <RefreshCw size={32} color="#22C55E" />
                  ) : (
                    <Sparkles size={32} color="#22C55E" />
                  )}
                </View>

                {/* Title */}
                <ThemedText
                  family="primary"
                  weight="bold"
                  className="text-[20px] text-center mb-2"
                  variant="primary"
                >
                  {isCompulsory
                    ? "Applying Critical Update"
                    : "New Update Available"}
                </ThemedText>

                {/* Subtitle / Description */}
                <ThemedText
                  family="secondary"
                  weight="regular"
                  className="text-[14px] text-center mb-6 leading-5 px-4"
                  variant="secondary"
                >
                  {isCompulsory
                    ? "A required update is being installed. The app will restart automatically in just a moment."
                    : updateMessage ||
                      "A new version of Atrader is ready with the latest rates, features, and improvements."}
                </ThemedText>

                {/* Content / Buttons depending on Compulsory vs Optional */}
                {isCompulsory ? (
                  // Compulsory State: Non-dismissible progress indicator
                  <View className="items-center py-4 w-full">
                    <ActivityIndicator size="large" color="#22C55E" />
                    <ThemedText
                      family="primary"
                      weight="medium"
                      className="text-[14px] text-gray-500 dark:text-gray-400 mt-3"
                    >
                      {isReloading
                        ? "Restarting app..."
                        : "Downloading update files..."}
                    </ThemedText>
                  </View>
                ) : (
                  // Optional State: User confirmation buttons
                  <View className="flex-row w-full gap-3 mt-2">
                    {/* Later button */}
                    <Pressable
                      onPress={handleClose}
                      disabled={isLoading}
                      className="flex-1 h-[52px] rounded-full items-center justify-center bg-white dark:bg-dark-700 border border-border-light dark:border-border-dark"
                      style={{ opacity: isLoading ? 0.6 : 1 }}
                    >
                      <ThemedText
                        family="primary"
                        weight="semibold"
                        className="text-[15px] !text-gray-700 dark:!text-gray-300"
                      >
                        Later
                      </ThemedText>
                    </Pressable>

                    {/* Update Now button */}
                    <Pressable
                      onPress={applyUpdate}
                      disabled={isLoading}
                      className="flex-1 h-[52px] rounded-full items-center justify-center bg-primary-500"
                      style={{ opacity: isLoading ? 0.8 : 1 }}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <ThemedText
                          family="primary"
                          weight="semibold"
                          className="text-[15px] !text-white"
                        >
                          Update Now
                        </ThemedText>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            </ImageBackground>
          </ThemedView>
        </Animated.View>
      </View>
    </Modal>
  );
};
