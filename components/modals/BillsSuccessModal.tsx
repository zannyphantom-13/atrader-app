import { ThemedText } from "@/components/theme/themeText";
import { Button } from "@/components/ui/button";
import { CustomSwitch } from "@/components/ui/customSwitch";
import { CustomModal } from "@/components/ui/modal";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useAppSelector } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import React, { useState } from "react";
import { Image, ImageBackground, StyleSheet, View } from "react-native";

export type BillType = "airtime" | "data" | "electricity" | "cable" | "betting" | "giftcard";

interface BillsSuccessModalProps {
    visible: boolean;
    onClose: () => void;
    onViewReceipt: () => void;
    billType: BillType;
    amount: string;
    recipient: string; // Phone number, meter number, smartcard, email for gift cards, etc.
    recipientName?: string; // Network name, provider name, gift card name, etc.
    onSaveBeneficiaryChange?: (value: boolean) => void;
    showBeneficiaryToggle?: boolean; // Default true, set false for gift cards
    customMessage?: string; // Custom message to display instead of default
    buttonTitle?: string; // Custom button title
    currency?: string; // Custom currency symbol
}

const getBillSuccessMessage = (billType: BillType): string => {
    switch (billType) {
        case "airtime":
            return "Airtime Payment Successful";
        case "data":
            return "Data Subscription Successful";
        case "electricity":
            return "Electricity Payment Successful";
        case "cable":
            return "Cable Subscription Successful";
        case "betting":
            return "Betting Payment Successful";
        case "giftcard":
            return "Gift card purchase successfully";
        default:
            return "Transaction Successful";
    }
};

export const BillsSuccessModal: React.FC<BillsSuccessModalProps> = ({
    visible,
    onClose,
    onViewReceipt,
    billType,
    amount,
    recipient,
    recipientName,
    onSaveBeneficiaryChange,
    showBeneficiaryToggle = true,
    customMessage,
    buttonTitle = "Verify Receipt",
    currency = "₦",
}) => {
    const { isDark } = useTheme();
    const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(false);
    const { phoneBeneficiaries, cableBeneficiaries, electricityBeneficiaries, bettingBeneficiaries } = useAppSelector((state) => state.beneficiary);

    React.useEffect(() => {
        let exists = false;
        switch (billType) {
            case "airtime":
            case "data":
                exists = phoneBeneficiaries.some(b => b.number === recipient);
                break;
            case "cable":
                exists = cableBeneficiaries.some(b => b.id === recipient || b.cablenumber === recipient);
                break;
            case "electricity":
                exists = electricityBeneficiaries.some(b => b.id === recipient || b.meternumber === recipient);
                break;
            case "betting":
                exists = bettingBeneficiaries.some(b => b.id === recipient);
                break;
        }
        setSaveAsBeneficiary(exists);
        // onSaveBeneficiaryChange?.(exists); // Optional: trigger parent callback if needed, but usually parent handles toggle changes only
    }, [billType, recipient, phoneBeneficiaries, cableBeneficiaries, electricityBeneficiaries, bettingBeneficiaries]);

    const handleSwitchChange = (value: boolean) => {
        setSaveAsBeneficiary(value);
        onSaveBeneficiaryChange?.(value);
    };

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
                className="flex-1"
                resizeMode="cover"
                style={styles.backgroundImage}
            >
                <View className="px-5 pt-3">
                    <View className="flex-1 items-center">
                        {/* Success Icon */}
                        <View className="mb-8">
                            <Image source={img.successTick} style={{ width: 100, height: 100 }} resizeMode="contain" />
                        </View>

                        {/* Success Message Header */}
                        <View className="dark:bg-[#111111] bg-[#E8FFE4] px-6 mx-auto w-auto py-4 rounded-[30px] items-center mb-2 border-2 border-[#B4FFA8] dark:border-[#232323]">
                            <ThemedText
                                className="!text-[#111111]/80 dark:!text-gray-400 text-lg mb-1 font-semibold"
                                variant="secondary"
                            >
                                {getBillSuccessMessage(billType)}
                            </ThemedText>
                            <ThemedText className="text-[#26A408] text-[32px] font-semibold">
                                {/* {amount ? `₦${Number(amount).toLocaleString()}` : "₦0"} */}
                                {amount ? `${currency}${Number(amount).toLocaleString()}` : `${currency}0`}
                            </ThemedText>
                        </View>

                        {/* Payment Details */}
                        <View className="mb-6">
                            {customMessage ? (
                                <ThemedText
                                    variant="secondary"
                                    weight="regular"
                                    className="text-center text-lg leading-7"
                                >
                                    {customMessage}{" "}
                                    <ThemedText variant="primary" weight="bold" className="font-bold !text-black dark:!text-white">
                                        {recipient}
                                    </ThemedText>
                                </ThemedText>
                            ) : (
                                <>
                                    <ThemedText
                                        variant="secondary"
                                        weight="regular"
                                        className="text-center text-lg leading-7"
                                    >
                                        Your payment has been sent to{" "}
                                        <ThemedText variant="primary" weight="bold" className="font-bold">
                                            {recipientName || billType}
                                        </ThemedText>
                                    </ThemedText>
                                    <ThemedText
                                        variant="primary"
                                        weight="medium"
                                        className="text-center text-lg"
                                    >
                                        {recipient}
                                    </ThemedText>
                                </>
                            )}
                        </View>

                        <View className="flex-1" />

                        {/* Save as Beneficiary Toggle - conditionally rendered */}
                        {showBeneficiaryToggle && (
                            <View className="bg-white dark:bg-[#111111] rounded-[30px] px-6 py-3 flex-row justify-between items-center w-full my-6 border border-border-light dark:border-border-dark">
                                <ThemedText className="!text-black dark:!text-white text-[14px] font-medium">
                                    Save as beneficiary
                                </ThemedText>
                                <CustomSwitch
                                    value={saveAsBeneficiary}
                                    onValueChange={handleSwitchChange}
                                    trackWidth={40}
                                    trackHeight={22}
                                    thumbSize={14}
                                    activeTrackColor={
                                        colorThemes[app_config.theme][150]
                                    }
                                    inactiveTrackColor={
                                        isDark ? "#E7E7E7" : "#EFEFEF"
                                    }
                                    activeThumbColor={colorThemes[app_config.theme][500]}
                                    inactiveThumbColor={isDark ? "#B5B5B5" : "#7E7E7E"}
                                />
                            </View>
                        )}

                        {/* View Receipt Button */}
                        <Button
                            variant="primary"
                            onPress={onViewReceipt}
                            className="w-full rounded-[25px] mb-3"
                        >
                            {buttonTitle}
                        </Button>
                    </View>
                </View>
            </ImageBackground>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        width: "100%",
        height: "100%",
    },
});

export default BillsSuccessModal;
