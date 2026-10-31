import { ThemedText } from "@/components/theme/themeText";
import { useTheme } from "@/context/ThemeProvider";
import { XIcon } from "lucide-react-native";
import React from "react";
import { Dimensions, Modal, Pressable, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { ThemedView } from "../theme/themeView";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  title?: string;
  height?: number | string;
  children?: React.ReactNode;
}

export const CustomcenterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  title = "",
  children,
  height,
  ...modalprops
}) => {
  const { isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      {...modalprops}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <ThemedView
          className="shadow-2xl shadow-black/40 dark:shadow-black/80"
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? "#060606" : "#ffffff",
              maxHeight: SCREEN_HEIGHT * 0.8,
            },
          ]}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark shadow-sm shadow-black/5">
            <View className="w-6" />
            <ThemedText
              family="primary"
              variant="primary"
              weight="bold"
              className="text-b1 shadow-sm shadow-black/10"
            >
              {title ? title : ""}
            </ThemedText>
            <Pressable onPress={onClose} className="p-1 rounded-full bg-black/5 dark:bg-white/10 shadow-sm shadow-black/10 active:opacity-70">
              <XIcon
                width={18}
                height={18}
                color={isDark ? "white" : "black"}
              />
            </Pressable>
          </View>

          {/* Content */}
          {/* <View className="!flex-1">{children}</View> */}
          <ScrollView showsVerticalScrollIndicator={false} className="shadow-sm shadow-black/5">
            {children}
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
