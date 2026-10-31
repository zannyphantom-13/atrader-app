import { ThemedText } from "@/components/theme/themeText";
import { useTheme } from "@/context/ThemeProvider";
import React from "react";
import { Modal, Pressable, TouchableWithoutFeedback, View } from "react-native";

interface PayAttentionModalProps {
    visible: boolean;
    onClose: () => void;
}

const PayAttentionModal: React.FC<PayAttentionModalProps> = ({
    visible,
    onClose,
}) => {
    const { isDark } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 bg-black/60 justify-center items-center px-6">
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View className="w-full bg-[#FFFFFF] dark:bg-[#111111] rounded-[30px] p-6 items-center">
                            {/* Header */}
                            <View className="flex-row items-center gap-2 mb-4">
                                <ThemedText className="!text-primary-500 text-2xl font-bold">!</ThemedText>
                                <ThemedText className="text-2xl font-bold font-primary-bold">Pay Attention</ThemedText>
                            </View>

                            {/* Content */}
                            <View className="w-full mb-6">
                                <View className="flex-row gap-3 mb-3">
                                    <View className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2" />
                                    <ThemedText className="flex-1 text-base text-gray-600 dark:text-gray-300 font-primary-regular">
                                        Keep all four corners of the cards fully visible.
                                    </ThemedText>
                                </View>

                                <View className="flex-row gap-3 mb-3">
                                    <View className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2" />
                                    <ThemedText className="flex-1 text-base text-gray-600 dark:text-gray-300 font-primary-regular">
                                        Ensure high image clarity.
                                    </ThemedText>
                                </View>

                                <View className="flex-row gap-3 mb-3">
                                    <View className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2" />
                                    <ThemedText className="flex-1 text-base text-gray-600 dark:text-gray-300 font-primary-regular">
                                        Blurry or missing images may negatively impact your offer rate or delay card listing approval.
                                    </ThemedText>
                                </View>

                                <View className="flex-row gap-3">
                                    <View className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2" />
                                    <ThemedText className="flex-1 text-base text-gray-600 dark:text-gray-300 font-primary-regular">
                                        To safeguard your account integrity, please upload with identical denominations.
                                    </ThemedText>
                                </View>
                            </View>

                            {/* Footer Button */}
                            <Pressable
                                onPress={onClose}
                                className="w-full py-4 items-center justify-center bg-white dark:bg-[#111111] border-4 border-gray-200 dark:border-gray-800 rounded-full"
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 3,
                                    elevation: 2,
                                }}
                            >
                                <ThemedText className="!text-primary-500 text-lg font-bold">Close</ThemedText>
                            </Pressable>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default PayAttentionModal;
