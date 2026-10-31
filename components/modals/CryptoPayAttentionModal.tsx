import { ThemedText } from "@/components/theme/themeText";
import { useTheme } from "@/context/ThemeProvider";
import React from "react";
import { Modal, Pressable, TouchableWithoutFeedback, View } from "react-native";

interface CryptoPayAttentionModalProps {
    visible: boolean;
    onClose: () => void;
    cryptoSymbol: string;
    networkName: string;
}


const CryptoPayAttentionModal: React.FC<CryptoPayAttentionModalProps> = ({
    visible,
    onClose,
    cryptoSymbol,
    networkName,
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
                        <View className="w-full bg-[#FFFFFF] dark:bg-[#111111] rounded-[30px] p-6 items-center border border-border-light dark:border-border-dark">
                            {/* Header */}
                            <View className="flex-row items-center gap-2 mb-4">
                                <ThemedText className="!text-primary-500 text-2xl font-bold">!</ThemedText>
                                <ThemedText className="text-2xl font-bold font-primary-bold">Pay Attention</ThemedText>
                            </View>

                            {/* Content */}
                            <View className="w-full mb-8">
                                <ThemedText className="text-center text-lg leading-6 text-gray-600 dark:text-gray-300 font-primary-regular px-2">
                                    Please confirm that you are depositing {cryptoSymbol} to this address on {networkName} network. Mismatched information may result in the permanent loss of your asset.
                                </ThemedText>
                            </View>

                            {/* Footer Button */}
                            <Pressable
                                onPress={onClose}
                                className="w-full py-4 items-center justify-center bg-white dark:bg-[#111111] border-4 border-gray-100 dark:border-gray-800 rounded-full"
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

export default CryptoPayAttentionModal;
