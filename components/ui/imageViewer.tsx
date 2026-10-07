import React from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ImageViewerModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  isDark?: boolean;
}

export function ImageViewerModal({
  visible,
  imageUri,
  onClose,
  isDark = false,
}: ImageViewerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.modalContainer}>
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle" size={40} color="#ffffff" />
        </TouchableOpacity>

        {/* Full screen image */}
        <Image
          source={{ uri: imageUri }}
          style={styles.fullImage}
          resizeMode="contain"
        />

        {/* Tap anywhere to close hint */}
        <TouchableOpacity
          style={styles.backgroundTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  backgroundTouchable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
});
