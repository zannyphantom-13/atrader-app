import { useTheme } from "@/context/ThemeProvider";
import { X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  ModalProps,
  PanResponder,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "../theme/themeView";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface CustomModalProps extends Omit<ModalProps, "visible" | "children"> {
  visible: boolean;
  onClose: () => void;
  closebutton?: boolean;
  title?: string;
  children: React.ReactNode;
  height?: number | string;
  padding?: number;
  topOffset?: number;
  bottomOffset?: number;
  modalStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  showHandle?: boolean;
  showHeader?: boolean;
  swipeThreshold?: number;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  children,
  closebutton = false,
  height = "80%",
  padding = 20,
  topOffset = 80,
  bottomOffset = 0,
  modalStyle,
  containerStyle,
  showHandle = true,
  showHeader = true,
  animationType = "slide",
  transparent = true,
  statusBarTranslucent = true,
  onRequestClose,
  swipeThreshold = 100,
  ...modalProps
}) => {
  const { isDark } = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Listen to keyboard events
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const getModalHeight = () => {
    const safeScreenHeight =
      SCREEN_HEIGHT -
      insets.top -
      (Platform.OS === "android" ? insets.bottom : 0);

    if (typeof height === "string" && height.includes("%")) {
      const percentage = parseInt(height.replace("%", "")) / 100;
      return Math.min(safeScreenHeight * percentage, safeScreenHeight * 0.95);
    }
    return typeof height === "number"
      ? Math.min(height, safeScreenHeight * 0.95)
      : safeScreenHeight * 0.7;
  };

  const modalHeight = getModalHeight();

  // Create PanResponder for header/handle area only
  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
          gestureState.dy > 10
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          backdropOpacity.setValue(
            Math.max(0, 1 - gestureState.dy / modalHeight)
          );
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > swipeThreshold) {
          handleClose();
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
            Animated.spring(backdropOpacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const contentPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          gestureState.dy > 20 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 2)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          const dampedMovement = gestureState.dy * 0.5;
          translateY.setValue(dampedMovement);
          backdropOpacity.setValue(
            Math.max(0, 1 - dampedMovement / modalHeight)
          );
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const dampedMovement = gestureState.dy * 0.5;
        if (dampedMovement > swipeThreshold) {
          handleClose();
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
            Animated.spring(backdropOpacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: modalHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      translateY.setValue(modalHeight);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: modalHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, modalHeight]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType="none"
      statusBarTranslucent={statusBarTranslucent}
      onRequestClose={(event) => {
        if (onRequestClose) {
          onRequestClose(event);
        } else {
          handleClose();
        }
      }}
      {...modalProps}
    >
      {/* CRITICAL FIX: Wrap everything in a View with fixed dimensions */}
      <View style={styles.modalWrapper}>
        <ThemedView
          style={[styles.overlay, containerStyle]}
          className="bg-light-50 dark:bg-dark-900"
        >
          {/* Backdrop */}
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          </Animated.View>

          {/* Modal Container - FIXED HEIGHT */}
          <Animated.View
            className="shadow-2xl shadow-black/30 dark:shadow-black/70"
            style={[
              styles.modalContainer,
              {
                height: modalHeight,
                maxHeight: modalHeight,
                backgroundColor: isDark ? "#060606" : "#ffffff",
                transform: [{ translateY: translateY }],
              },
              modalStyle,
            ]}
          >
            {/* Handle */}
            {showHandle && (
              <View style={styles.handle} {...headerPanResponder.panHandlers}>
                <View
                  className="shadow-sm shadow-black/10"
                  style={[
                    styles.handleBar,
                    { backgroundColor: isDark ? "#404040" : "#e0e0e0" },
                  ]}
                />
              </View>
            )}

            {/* Header */}
            {showHeader && (
              <View
                className="shadow-sm shadow-black/5"
                style={[styles.header, { paddingHorizontal: padding }]}
                {...headerPanResponder.panHandlers}
              >
                <Text
                  className="shadow-sm shadow-black/10"
                  style={[
                    styles.title,
                    { color: isDark ? "#ffffff" : "#000000" },
                  ]}
                >
                  {title}
                </Text>
              </View>
            )}

            {/* Close button */}
            {closebutton && (
              <Pressable
                onPress={handleClose}
                style={styles.closeButton}
                className="shadow-md shadow-black/20 active:opacity-70"
              >
                <View className="p-1 rounded-full bg-black/5 dark:bg-white/10 shadow-sm shadow-black/10">
                  <X width={20} height={20} color={isDark ? "white" : "black"} />
                </View>
              </Pressable>
            )}

            {/* Content */}
            <View
              className="shadow-sm shadow-black/5"
              style={[
                styles.content,
                {
                  paddingHorizontal: padding,
                  // Reduce padding when keyboard is visible on Android
                  paddingBottom:
                    Platform.OS === "android" && keyboardVisible ? 0 : 20,
                },
              ]}
              {...contentPanResponder.panHandlers}
            >
              {children}
            </View>
          </Animated.View>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    // CRITICAL: Prevent the wrapper from being pushed up
    ...Platform.select({
      android: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: SCREEN_HEIGHT,
        width: SCREEN_WIDTH,
      },
      ios: {},
    }),
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    elevation: 5,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  handle: {
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 28,
    paddingHorizontal: 20,
    marginHorizontal: -20,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    paddingTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 20,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 8,
    zIndex: 1000,
  },
});
