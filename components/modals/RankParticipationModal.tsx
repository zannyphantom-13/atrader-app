import { ThemedText } from "@/components/theme/themeText";
import { useTheme } from "@/context/ThemeProvider";
import { app_config } from "@/utils/config";
import { X } from "lucide-react-native";
import React from "react";
import {
  Linking,
  Modal,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import RankIcon from "@/assets/images/rank.svg";

interface RankParticipationModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const RankParticipationModal: React.FC<RankParticipationModalProps> = ({
  visible,
  onAccept,
  onDecline,
}) => {
  const { isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onDecline}
    >
      <TouchableWithoutFeedback onPress={onDecline}>
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View className="w-full max-w-sm bg-white dark:bg-[#111111] rounded-[32px] p-6 items-center relative">
              {/* Close Button */}
              {/* <Pressable
                onPress={onDecline}
                className="absolute top-5 right-5 p-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800"
                hitSlop={10}
              >
                <X size={22} color={isDark ? "#A0A0A0" : "#666666"} />
              </Pressable> */}

              {/* Top SVG Icon */}
              <View className="mt-2 mb-4 flex-row w-full items-center justify-start">
                <RankIcon width={88} height={88} />
              </View>

              {/* Title */}
              <ThemedText
                family="primary"
                weight="bold"
                className="text-xl text-left mb-3 w-full"
              >
                Leaderboard Participation
              </ThemedText>

              {/* Content Description */}
              <ThemedText
                family="primary"
                weight="regular"
                variant="secondary"
                className="text-b2 text-left leading-6 mb-6 !text-[#666666] dark:!text-[#A0A0A0]"
              >
                Would you like to appear on the leaderboard? Your display name and
                performance will be visible to other participants. Your participation is
                completely optional and can be changed at any time.{" "}
                <Text
                  className="!text-primary-500 underline font-medium"
                  onPress={() => Linking.openURL(app_config.privacyPolicyUrl)}
                >
                  Privacy policy
                </Text>
              </ThemedText>

              {/* Action Buttons */}
              <View className="w-full gap-2.5 mt-2">
                <Pressable
                  onPress={onAccept}
                  className="w-full py-4 bg-primary-500 rounded-full items-center justify-center active:opacity-90"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <ThemedText
                    family="primary"
                    weight="bold"
                    className="!text-white text-b1"
                  >
                    Accept
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={onDecline}
                  className="w-full py-3.5 bg-gray-100 dark:bg-[#1C1C1E] rounded-full items-center justify-center active:opacity-80 border border-gray-200 dark:border-gray-800"
                >
                  <ThemedText
                    family="primary"
                    weight="semibold"
                    className="!text-gray-700 dark:!text-gray-300 text-b2"
                  >
                    Decline
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default RankParticipationModal;
