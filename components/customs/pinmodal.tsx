import { useTheme } from "@/context/ThemeProvider";
import React, { useEffect } from "react";
import {
  View,
  ActivityIndicator
} from "react-native";
import { ThemedText } from "../theme/themeText";
import { Button } from "../ui/button";
import { CustomKeypad } from "../ui/custom-keypad";
import { CustomModal } from "../ui/modal";

interface PinEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  title?: string;
  maxLength?: number;
  showForgotPin?: boolean;
  onForgotPin?: () => void;
  pin: string;
  setPin: (pin: string) => void;
  isLoading?: boolean;
}

export const PinEntryModal: React.FC<PinEntryModalProps> = ({
  visible,
  onClose,
  onSubmit,
  title = "Enter Pin",
  maxLength = 4,
  showForgotPin = true,
  onForgotPin,
  pin,
  setPin,
  isLoading = false,
}) => {
  const { isDark } = useTheme();

  // Reset pin when modal opens
  useEffect(() => {
    if (visible) {
      setPin("");
    }
  }, [visible]);

  const handleKeyPress = (key: string) => {
    if (pin.length < maxLength) {
      setPin(pin + key);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = () => {
    onSubmit(pin);
  };

  // Render pin dots
  const renderPinDots = () => {
    return (
      <View className="flex-row justify-center items-center gap-3 my-8 w-auto mx-auto bg-[#FCFCFC] dark:bg-[#111111] border p-3 border-[#E5E5EA] dark:border-[#232323] rounded-[20px]">
        {Array.from({ length: maxLength }).map((_, index) => (
          <View
            key={index}
            className={`w-[45px] h-[45px] items-center justify-center rounded-[12px] border ${isDark ? "bg-[#232323] border-[#363636]" : "bg-[#F2F2F7] border-[#E5E5EA]"
              }`}
          >
            <ThemedText
              className={`text-[32px] pb-2 font-bold ${index < pin?.length ? "text-black dark:text-white" : "text-[#CCCCCC] dark:text-[#444444]"
                }`}
              style={{ textAlign: 'center', lineHeight: 45, paddingTop: 4 }} // Center the asterisk vertically
            >
              {index < pin?.length ? "*" : ""}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  };

  return (
    <CustomModal
      visible={visible}
      onClose={() => {
        if (!isLoading) {
          onClose();
        }
      }}
      title={title}
      height="auto" // Allow auto height or fixed? Image 1 suggests typical modal height ~70% or auto.
      showHandle={true}
      showHeader={true}
      closebutton={true}
      dismissable={!isLoading}
      containerStyle={{
        backgroundColor: isDark ? "#000" : "#FFF",
      }}
    >
      <View className="justify-between px-4">
        {/* PIN Dots Display */}
        <View>
          {renderPinDots()}
        </View>

        {/* Numeric Keypad */}
        <CustomKeypad
          onPress={handleKeyPress}
          onDelete={handleDelete}
        />

        {/* Confirm Button */}
        <Button
          className={`py-4 rounded-full mt-4 ${pin.length === maxLength ? 'bg-[#4BC131]' : 'bg-[#4BC131]/50'} ${isLoading ? 'opacity-70' : ''}`}
          onPress={handleSubmit}
          disabled={pin.length !== maxLength || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText className="text-white text-center font-bold text-lg">Confirm</ThemedText>
          )}
        </Button>
      </View>
    </CustomModal>
  );
};
