import { ThemedText } from "@/components/theme/themeText";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import React from "react";
import { Pressable, View } from "react-native";
import { CustomModal } from "@/components/ui/modal";
import { MessageSquare, Headphones } from "lucide-react-native";

interface ChatTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGiftCard: () => void;
  onSelectAppSupport: () => void;
  isSubmitting?: boolean;
}

export const ChatTypeModal: React.FC<ChatTypeModalProps> = ({
  visible,
  onClose,
  onSelectGiftCard,
  onSelectAppSupport,
  isSubmitting = false,
}) => {
  const { isDark } = useTheme();

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      height="auto"
      showHandle={true}
      showHeader={true}
      title="Start a conversation"
      padding={0}
      closebutton={true}
    >
      <View className="px-5 pb-6 pt-2">
        <ThemedText
          family="secondary"
          weight="regular"
          variant="secondary"
          className="text-b2 mb-5"
        >
          How can we help you today?
        </ThemedText>

        {/* Gift Card Issues */}
        <Pressable
          disabled={isSubmitting}
          onPress={() => {
            onClose();
            onSelectGiftCard();
          }}
          className="flex-row items-center p-4 bg-[#FCFCFC] dark:bg-[#111111] border border-[#EFEFEF] dark:border-[#232323] rounded-[20px] mb-3"
        >
          <View className="w-12 h-12 rounded-full bg-[#FFF3E0] dark:bg-[#2A1F00] items-center justify-center mr-4">
            <MessageSquare size={24} color={isDark ? "#FFB74D" : "#E65100"} />
          </View>
          <View className="flex-1">
            <ThemedText family="primary" weight="bold" className="text-b2">
              Gift Card Issues
            </ThemedText>
            <ThemedText
              family="secondary"
              weight="regular"
              variant="secondary"
              className="text-b3 mt-0.5"
            >
              Get help with your gift card trades
            </ThemedText>
          </View>
        </Pressable>

        {/* App Support */}
        <Pressable
          onPress={() => {
            onClose();
            onSelectAppSupport();
          }}
          className="flex-row items-center p-4 bg-[#F6FFF4] dark:bg-[#0A1F00] border border-[#28a71233] dark:border-[#232323] rounded-[20px]"
        >
          <View className="w-12 h-12 rounded-full bg-[#E8F5E9] dark:bg-[#1B3A1B] items-center justify-center mr-4">
            <Headphones size={24} color={isDark ? "#66BB6A" : "#2E7D32"} />
          </View>
          <View className="flex-1">
            <ThemedText family="primary" weight="bold" className="text-b2">
              App Support
            </ThemedText>
            <ThemedText
              family="secondary"
              weight="regular"
              variant="secondary"
              className="text-b3 mt-0.5"
            >
              General app help and inquiries
            </ThemedText>
          </View>
        </Pressable>
      </View>
    </CustomModal>
  );
};

export default ChatTypeModal;
