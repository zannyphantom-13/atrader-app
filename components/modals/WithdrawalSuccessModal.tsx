import { ThemedText } from "@/components/theme/themeText";
import { Button } from "@/components/ui/button";
import { CustomSwitch } from "@/components/ui/customSwitch";
import { CustomModal } from "@/components/ui/modal";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import React, { useState } from "react";
import { Image, ImageBackground, StyleSheet, View } from "react-native";

interface WithdrawalSuccessModalProps {
    visible: boolean;
    onClose: () => void;
    onViewReceipt: () => void;
    amount: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    onSaveBeneficiaryChange?: (value: boolean) => void;
}

export const WithdrawalSuccessModal: React.FC<WithdrawalSuccessModalProps> = ({
    visible,
    onClose,
    onViewReceipt,
    amount,
    bankName,
    accountNumber,
    accountName,
    onSaveBeneficiaryChange,
}) => {
    const { isDark } = useTheme();
    const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(false);

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
        // modalStyle={{
        //     backgroundColor: "#050505",
        //     borderTopLeftRadius: 40,
        //     borderTopRightRadius: 40,
        //     overflow: 'hidden'
        // }}
        >
            <ImageBackground
                source={isDark ? img.on3bgd : img.on3bg}
                className="flex-1"
                resizeMode="cover"
                style={styles.backgroundImage}
            >
                <View
                    className="px-5 pt-3"
                >
                    {/* Close Button
                    <View className="flex-row justify-end mb-4">
                        <Pressable onPress={onClose} className="p-2">
                            <X color="white" size={24} />
                        </Pressable>
                    </View> */}

                    <View className="flex-1 items-center">
                        {/* Success Icon */}
                        <View className="mb-8">
                            <Image source={img.successTick} style={{ width: 100, height: 100 }} resizeMode="contain" />
                        </View>

                        {/* Success Message Header */}
                        <View className="dark:bg-[#1A1A1A]  bg-[#E8FFE4] px-6 mx-auto w-auto py-4 rounded-[30px] items-center mb-2 border-2 border-[#B4FFA8] dark:border-[#232323]">
                            <ThemedText className="text-gray-400 text-xl mb-1 font-semibold"
                                variant="secondary"
                            >
                                Withdrawal successfully
                            </ThemedText>
                            <ThemedText className="text-[#26A408] text-[32px] font-semibold">
                                {amount ? `₦${Number(amount).toLocaleString()}` : "₦0"}
                            </ThemedText>
                        </View>

                        {/* Payment Details */}
                        <View className="mb-4">
                            <ThemedText
                                variant="secondary"
                                weight="regular"
                                className=" text-center text-lg leading-7">
                                Your payment has been sent to{" "}
                                <ThemedText
                                    variant="primary"
                                    weight="bold"
                                    className=" font-bold">
                                    {bankName} | {accountNumber} | {accountName}
                                </ThemedText>
                            </ThemedText>
                        </View>

                        <View className="flex-1" />

                        {/* Save as Beneficiary Toggle */}
                        <View className="bg-white rounded-[30px] px-6 py-3 flex-row justify-between items-center w-full my-6">
                            <ThemedText className="!text-black text-[18px] font-medium">
                                Save as beneficiary
                            </ThemedText>
                            <CustomSwitch
                                value={saveAsBeneficiary}
                                onValueChange={handleSwitchChange}
                                activeTrackColor="#232323"
                                inactiveTrackColor="#E9E9EA"
                                activeThumbColor="#FFFFFF"
                                inactiveThumbColor="#363636"
                                thumbSize={24}
                                trackWidth={50}
                                trackHeight={30}
                            />
                        </View>

                        {/* View Receipt Button */}
                        <Button
                            variant="primary"
                            onPress={onViewReceipt}
                            className="w-full  rounded-[25px]"
                        >
                            View Receipt
                        </Button>
                    </View>
                </View>
            </ImageBackground>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        width: '100%',
        height: '100%',
    }
});
