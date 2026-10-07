import { useTheme } from "@/context/ThemeProvider";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number | string | "auto";
  padding?: number;
  closebutton?: boolean;
  // Compatibility props
  topOffset?: number;
  bottomOffset?: number;
  modalStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  showHandle?: boolean;
  showHeader?: boolean;
  swipeThreshold?: number;
  enableScroll?: boolean;
  maxHeight?: number | string;
  onContentLayout?: (height: number) => void;
  allowHeaderDragUp?: boolean;
  animationType?: "none" | "slide" | "fade";
  transparent?: boolean;
  statusBarTranslucent?: boolean;
  onRequestClose?: (event?: any) => void;
  className?: string;
  renderScrollableContent?: boolean;
  dismissable?: boolean;

}

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  children,
  height = "auto",
  padding = 20,
  modalStyle,
  containerStyle,
  showHandle = true,
  showHeader = true,
  closebutton = false,
  enableScroll = true,
  // Unused props but kept for compatibility
  topOffset,
  bottomOffset,
  swipeThreshold,
  maxHeight,
  onContentLayout,
  allowHeaderDragUp,
  animationType,
  transparent,
  statusBarTranslucent,
  onRequestClose,
  className,
  renderScrollableContent = false,
  dismissable = true,
  ...modalProps
}) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Handle Snap Points
  const snapPoints = useMemo(() => {
    if (height === "auto") return undefined; // Dynamic sizing relies on undefined snapPoints
    if (typeof height === "string" && height.includes("%")) return [height];
    if (typeof height === "number") return [height];
    // Fallback default
    return ["60%"];
  }, [height]);

  const enableDynamicSizing = height === "auto";

  // Effect to drive visibility
  useEffect(() => {
    let animFrame: number;
    if (visible) {
      animFrame = requestAnimationFrame(() => {
        bottomSheetModalRef.current?.present();
      });
    } else {
      Keyboard.dismiss();
      bottomSheetModalRef.current?.dismiss();
    }
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [visible]);

  // Handle Sheet Changes (dismissal via swipe)
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  // Backdrop
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior={dismissable ? "close" : "none"}
      />
    ),
    [dismissable]
  );

  // Background Style
  const backgroundStyle = useMemo(() => {
    const baseStyle: ViewStyle = {
      backgroundColor: isDark ? "#0C0C0C" : "#FCFCFC",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    };
    return [baseStyle, modalStyle];
  }, [isDark, modalStyle]);

  // Handle Indicator Style
  const handleIndicatorStyle: ViewStyle = useMemo(() => ({
    backgroundColor: isDark ? "#404040" : "#d1d1d1",
    display: showHandle ? "flex" : "none",
    width: 40,
  }), [isDark, showHandle]);



  // If renderScrollableContent is true, render children directly (for BottomSheetFlatList)
  if (renderScrollableContent) {
    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={enableDynamicSizing}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={backgroundStyle as StyleProp<ViewStyle>}
        handleIndicatorStyle={handleIndicatorStyle}
        enablePanDownToClose={dismissable}
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        {children}
      </BottomSheetModal>
    );
  }


  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={backgroundStyle as StyleProp<ViewStyle>}
      handleIndicatorStyle={handleIndicatorStyle}
      enablePanDownToClose={dismissable}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView
        className="shadow-2xl shadow-black/25 dark:shadow-black/60"
        style={[
          styles.contentContainer,
          {
            paddingHorizontal: padding,
            // Add some bottom padding for safe area if not covered by keyboard
            paddingBottom: Platform.OS === "ios"
              ? insets.bottom
              : insets.bottom + 20 // Reduced padding for Android navigation bar
          },
          containerStyle
        ]}
      >
        {closebutton && dismissable && (
          <Pressable
            onPress={() => onClose()}
            style={styles.closeButton}
            className="shadow-md shadow-black/20 active:opacity-70"
          >
            <View className="p-1 rounded-full bg-black/5 dark:bg-white/10 shadow-sm shadow-black/10">
              <X width={20} height={20} color={isDark ? "white" : "black"} />
            </View>
          </Pressable>
        )}
        {/* Custom Header (Title + Close Button) included in content for now, 
            since BottomSheet's own handle is separate. */}
        {showHeader && title && (
          <View style={{ marginBottom: 10 }} className="relative shadow-sm shadow-black/5 pb-2">
            <View style={{ flex: 1, alignItems: 'center' }}>
              {title && (
                <Text style={[styles.title, { color: isDark ? "white" : "black" }]} className="shadow-sm shadow-black/10">
                  {title}
                </Text>
              )}
            </View>

          </View>
        )}


        {/* Children Content */}
        <View className="shadow-sm shadow-black/5">
          {children}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

// --- Compatible Export of existing CustomBottomSheetModal ---

interface CustomBottomSheetProps extends Omit<BottomSheetProps, "children"> {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  enableDynamicSizing?: boolean;
  enablePanDownToClose?: boolean;
  backgroundStyle?: ViewStyle;
  handleIndicatorStyle?: ViewStyle;
  backdropOpacity?: number;
  onClose?: () => void;
}

const CustomBottomSheetModal = forwardRef<
  BottomSheetModal,
  CustomBottomSheetProps
>(
  (
    {
      children,
      snapPoints,
      enableDynamicSizing = true,
      enablePanDownToClose = true,
      backgroundStyle,
      handleIndicatorStyle,
      backdropOpacity = 0.5,
      onClose,
      ...props
    },
    ref,
  ) => {
    const renderBackdrop = useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={backdropOpacity}
          pressBehavior="close"
        />
      ),
      [backdropOpacity],
    );

    const defaultBackgroundStyle = useMemo(
      () => ({
        backgroundColor: "white",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        ...backgroundStyle,
      }),
      [backgroundStyle],
    );

    const defaultHandleStyle = useMemo(
      () => ({
        backgroundColor: "#d1d1d1",
        width: 40,
        ...handleIndicatorStyle,
      }),
      [handleIndicatorStyle],
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enableDynamicSizing={enableDynamicSizing}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={defaultBackgroundStyle}
        handleIndicatorStyle={defaultHandleStyle}
        onDismiss={onClose}
        {...props}
      >
        <BottomSheetView className="shadow-2xl shadow-black/20" style={styles.contentContainer}>
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

CustomBottomSheetModal.displayName = "CustomBottomSheetModal";

const styles = StyleSheet.create({
  contentContainer: {
    position: 'relative',
    // flex: 1, // Don't enforce flex 1 here as it might break dynamic sizing behavior for View
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
    minHeight: 40,
    position: 'relative'
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
    paddingRight: 20,
  }
});

export default CustomBottomSheetModal;
