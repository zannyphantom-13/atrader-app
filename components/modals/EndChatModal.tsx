import { ThemedText } from "@/components/theme/themeText";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "../theme/themeView";

interface EndChatModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}



const EndChatModal = ({ visible, onClose, onConfirm, isLoading = false }: EndChatModalProps) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "android" ? Math.max(insets.bottom, 24) : insets.bottom || 16;

  const slideAnim = useRef(new Animated.Value(400)).current; // Start pushed down
  const [showModal, setShowModal] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShowModal(false);
      });
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
      onClose();
    });
  };

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-end rounded-t-[28px]">
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <ThemedView className="rounded-t-[28px] overflow-hidden ">
            <ImageBackground
              source={isDark ? img.chatDarkBg : img.chatBg}
              resizeMode="cover"
              className="rounded-t-[28px] overflow-hidden pb-6"
              style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" }}
              imageStyle={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
            >
              {/* Close button */}
              <Pressable
                onPress={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 items-center justify-center z-10"
                hitSlop={16}
              >
                <ThemedText className="text-[18px] !text-gray-500">✕</ThemedText>
              </Pressable>

              {/* Content */}
              <View
                className="items-center pt-10"
                style={{ paddingBottom: bottomPadding }}
              >
                {/* Error Icon */}
                <View className="mb-5">
                  <Image source={img.chatError} style={{ width: 72, height: 72 }} resizeMode="contain" />
                </View>

                <ThemedText
                  family="primary"
                  weight="bold"
                  className="text-[20px] text-center mb-2"
                  variant="primary"
                >
                  End this chat?
                </ThemedText>
                <ThemedText
                  family="secondary"
                  weight="regular"
                  className="text-[14px] text-center mb-8"
                  variant="secondary"
                >
                  Are you sure you want to end this chat?
                </ThemedText>

                {/* Buttons */}
                <View className="flex-row w-full px-6 gap-3">
                  {/* Yes, end chat - outlined */}
                  <Pressable
                    onPress={onConfirm}
                    disabled={isLoading}
                    className="flex-1 h-[52px] rounded-full items-center justify-center bg-white dark:bg-dark-700"
                    style={{
                      borderColor: "#22C55E",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#22C55E" />
                    ) : (
                      <ThemedText
                        family="primary"
                        weight="semibold"
                        className="text-[15px] !text-red-500 dark:!text-red-500"
                      >
                        Yes, end chat
                      </ThemedText>
                    )}
                  </Pressable>

                  {/* No, don't - solid green */}
                  <Pressable
                    onPress={handleClose}
                    disabled={isLoading}
                    className="flex-1 h-[52px] rounded-full items-center justify-center bg-primary-500"
                  >
                    <ThemedText
                      family="primary"
                      weight="semibold"
                      className="text-[15px] !text-white"
                    >
                      No, don't
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </ImageBackground>
          </ThemedView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default EndChatModal;
