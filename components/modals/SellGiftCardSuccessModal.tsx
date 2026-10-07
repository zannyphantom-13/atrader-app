import { ThemedText } from "@/components/theme/themeText";
import { Button } from "@/components/ui/button";
import { CustomModal } from "@/components/ui/modal";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { formatNumber } from "@/utils/formatamount";
import React from "react";
import { Image, ImageBackground, StyleSheet, View } from "react-native";

interface SellGiftCardSuccessModalProps {
    visible: boolean;
    onClose: () => void;
    onReturnToDashboard: () => void;
    onViewTradeChat: () => void;
    data: {
        cardName: string;
        cardImage: any;
        country: string;
        amount: string; // Unit value USD
        rate: string;
        settlementAmount: number; // Total Naira
        quantity: number;
        type: string;
    };
}

export const SellGiftCardSuccessModal: React.FC<SellGiftCardSuccessModalProps> = ({
    visible,
    onClose,
    onReturnToDashboard,
    onViewTradeChat,
    data,
}) => {
    const { isDark } = useTheme();

    return (
        <CustomModal
            visible={visible}
            onClose={onClose}
            height="auto"
            showHandle={false}
            showHeader={false}
            padding={0}
            closebutton={true}
        >
            <ImageBackground
                source={isDark ? img.on3bgd : img.on3bg}
                className="flex-1 w-full h-full"
                resizeMode="cover"
                style={styles.backgroundImage}
            >
                <View className="px-5 pt-5 pb-6">
                    <View className="items-center">
                        {/* Success Header */}
                        <View className="mb-6 items-center">
                            <ThemedText
                                family="primary"
                                weight="bold"
                                className="text-[32px] dark:text-white text-center mb-2"
                            >
                                Happy Trade
                            </ThemedText>
                            <ThemedText
                                family="secondary"
                                weight="regular"
                                variant="secondary"
                                className="text-center text-lg leading-6 px-4"
                            >
                                Your Gift card has been submitted for trade. Keep an eye out for our notification once your order is complete.
                            </ThemedText>
                        </View>

                        {/* Main Wrapper (Double Container Pattern) */}
                        <View className="bg-[#FCFCFC] dark:bg-[#111111] rounded-[30px] p-2 border border-border-light dark:border-border-dark w-full mb-6">
                            <View className="bg-white dark:bg-dark-900 rounded-[20px] p-4 border border-border-light dark:border-border-dark">
                                <DetailRow
                                    label="Card name"
                                    value={data.cardName}
                                    image={data.cardImage}
                                />
                                <DetailRow label="Country" value={data.country} />
                                <DetailRow label="Unit Value" value={`$${data.amount}`} />
                                <DetailRow label="Current rate" value={`$1~₦${formatNumber(Number(data.rate || 0))}`} />
                                <DetailRow label="Quantity" value={`${data.quantity} Qty`} />
                                <DetailRow label="Type" value={data.type} isLast />
                            </View>

                            {/* Settlement Row (Standard Secondary Wrapper) */}
                            <View className="bg-white dark:bg-dark-900 rounded-[20px] mt-2 p-4 border border-border-light dark:border-border-dark">
                                <View className="flex-row items-center justify-between">
                                    <ThemedText
                                        family="primary"
                                        variant="secondary"
                                        weight="medium"
                                        className="text-b2"
                                    >
                                        Settlement amount
                                    </ThemedText>
                                    <ThemedText family="primary" weight="bold" className="text-b2 text-primary-500">
                                        ₦{formatNumber(data.settlementAmount)}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View className="w-full gap-3">
                            <Button
                                variant="outline"
                                fullWidth
                                onPress={onReturnToDashboard}
                                className="border-primary-500 h-14 bg-white dark:bg-background-dark"
                            >
                                <ThemedText family="primary" weight="medium" className="text-b2 capitalize !text-primary-500">
                                    Return to dashboard
                                </ThemedText>
                            </Button>

                            <Button
                                variant="primary"
                                fullWidth
                                onPress={onViewTradeChat}
                                className="h-14"
                            >
                                View trade chat
                            </Button>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </CustomModal>
    );
};

interface DetailRowProps {
    label: string;
    value: string;
    image?: any;
    isLast?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, image, isLast }) => (
    <View className={`flex-row justify-between items-center ${isLast ? '' : 'mb-4'}`}>
        <ThemedText family="primary" variant="secondary" weight="medium" className="text-b2">
            {label}
        </ThemedText>
        <View className="flex-row items-center gap-2">
            {image && (
                <Image
                    source={typeof image === "string" && image.startsWith("http") ? { uri: image } : image}
                    style={{ width: 22, height: 22 }}
                    className="rounded-full"
                />
            )}
            <ThemedText family="primary" weight="medium" className="text-b2 capitalize">
                {value}
            </ThemedText>
        </View>
    </View>
);

const styles = StyleSheet.create({
    backgroundImage: {
        width: "100%",
    },
});

export default SellGiftCardSuccessModal;
