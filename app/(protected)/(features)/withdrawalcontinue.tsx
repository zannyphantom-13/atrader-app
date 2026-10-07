import { SettingsHeader } from "@/components/customs/settingsHeader";
import { PinEntryModal } from "@/components/modals/pinmodal";
import { WithdrawalSuccessModal } from "@/components/modals/WithdrawalSuccessModal";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { CustomKeypad } from "@/components/ui/custom-keypad";
import { Textarea } from "@/components/ui/form-fields";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useGetRefreshTokenMutationMutation } from "@/redux/auth/auth_api";
import { setUser } from "@/redux/auth/auth_slice";
import { addRecentWithdrawal } from "@/redux/recent/recent_withdrawal_slice";
import { useSaveBanksMutation, useWithdrawMutation } from "@/redux/settings/settings";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { getFirstChar } from "@/utils/bills";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WithdrawalContinue() {
    const router = useRouter();
    const { isDark } = useTheme();
    const params = useLocalSearchParams();
    const toast = useToast();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { user } = useAppSelector((state) => state.auth);
    const userEmail = user?.user?.email || "";



    const {
        accountNumber,
        accountName,
        bankName,
        bankCode,
        bankUrl,
    } = params as {
        accountNumber: string;
        accountName: string;
        bankName: string;
        bankCode: string;
        bankUrl?: string;
    };

    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [showPinModal, setShowPinModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [transId, setTransId] = useState("");
    const [pin, setPin] = useState("");

    const [withdraw, { isLoading }] = useWithdrawMutation();
    const [saveBanks] = useSaveBanksMutation();
    const [getRefreshToken] = useGetRefreshTokenMutationMutation();

    // Fetch latest user data on screen focus so withdrawal_charge is up-to-date
    useFocusEffect(
        React.useCallback(() => {
            const refreshUserData = async () => {
                try {
                    const token = await TokenManager.getToken();
                    if (!token) return;
                    const response: any = await getRefreshToken(token).unwrap();
                    const res = response?.data || response || null;
                    if (res?.token) {
                        await TokenManager.setToken(res.token);
                    }
                    if (res) {
                        dispatch(setUser(res));
                    }
                } catch (error) {
                    console.error("Failed to refresh user data:", error);
                }
            };
            refreshUserData();
        }, [getRefreshToken, dispatch])
    );

    const handleKeyPress = (key: string) => {
        if (amount.length < 10) {
            if (key === "." && amount.includes(".")) return;
            setAmount((prev) => prev + key);
        }
    };

    const handleDelete = () => {
        setAmount((prev) => prev.slice(0, -1));
    };

    const handleConfirm = () => {
        if (!amount || Number(amount) <= 0) {
            toast.showToast("Please enter a valid amount", "error");
            return;
        }
        setShowPinModal(true);
    };

    const handleSaveBeneficiary = async (shouldSave: boolean) => {
        if (!shouldSave) return;
        try {
            const token = await TokenManager.getToken();
            await saveBanks({
                data: {
                    token,
                    account_number: accountNumber,
                    bank_code: bankCode,
                    bank_name: bankName,
                    account_name: accountName,
                }
            }).unwrap();
            toast.showToast("Beneficiary saved successfully", "success");
        } catch (e: any) {
            console.error("Failed to save beneficiary:", e);
        }
    };

    const handleWithdrawal = async (enteredPin: string) => {
        try {
            const atex = await TokenManager.getToken();
            // console.log("Withdrawal request:", {
            //     token: atex,
            //     amount,
            //     bankCode,
            //     account_number: accountNumber,
            //     account_name: accountName,
            //     bankName,
            //     description: description || "Nil",
            //     pin: enteredPin
            // });
            const response: any = await withdraw({
                data: {
                    token: atex,
                    amount,
                    bankCode,
                    account_number: accountNumber,
                    account_name: accountName,
                    bankName,
                    description: description || "Nil",
                    pin: enteredPin
                }
            }).unwrap();

            console.log('res-withdrawal:', response)

            if (response?.status === "success") {
                // Save to local recents
                dispatch(addRecentWithdrawal({
                    userEmail,
                    accountNumber,
                    accountName,
                    bankName,
                    bankCode,
                    bankUrl,
                }));

                setShowPinModal(false);
                setTransId(response?.data?.transid || response?.transid || response?.reference || "");
                setShowSuccessModal(true);
            } else {
                setShowPinModal(false);
                toast.showToast(response?.message || "Failed", "error");
            }
        } catch (e: any) {
            setShowPinModal(false);
            // console.error("Failed to withdraw:", e);
            toast.showToast(e?.data?.message || e?.message || "Error withdrawal", "error");
        }
    };

    return (
        <ThemedView className="flex-1">
            <SettingsHeader title="Withdraw" />

            {/* Scrollable Content */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: 20
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Send To Card */}
                <ThemedText className="mb-2 text-[#666] font-medium">Send to</ThemedText>
                <View
                    className="bg-[#FFFFFF] dark:bg-[#111111] px-2 py-2 rounded-[30px] border-[#EFEFEF] dark:border-[#232323] border"
                >
                    <View className="flex-row items-center gap-3 p-2 bg-[#F8F8F8] dark:bg-[#0C0C0C] rounded-[20px] border border-[#EFEFEF] dark:border-[#232323]">
                        {bankUrl ? (
                            <Image source={{ uri: bankUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                        ) : (
                            <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                                <ThemedText>{getFirstChar(bankName || "B")}</ThemedText>
                            </View>
                        )}
                        <View className="flex-1">
                            <ThemedText className="font-semibold text-[12px]">{accountName}</ThemedText>
                            <ThemedText className="text-[#666] text-xs">{accountNumber} | {bankName}</ThemedText>
                        </View>
                    </View>

                    {/* Fee Row */}
                    <View className="flex-row justify-between items-center bg-[#F8F8F8] dark:bg-[#0C0C0C] py-2 px-4 mt-2 rounded-[20px] border border-[#EFEFEF] dark:border-[#232323]">
                        <ThemedText className="text-[#666]">Withdrawal fee</ThemedText>
                        <ThemedText className="font-semibold">₦{user?.withdrawal_charge}</ThemedText>
                    </View>

                    {/* Description Input */}
                    <View className="mt-2">
                        <Textarea
                            placeholder="Description (Optional)"
                            value={description}
                            onChangeText={setDescription}
                            rows={4}
                            className="!bg-[#F8F8F8] dark:!bg-[#0C0C0C] px-4 !rounded-[20px] border border-[#EFEFEF] dark:border-[#232323] text-black dark:text-white"
                        />
                    </View>
                </View>

                {/* Amount Display */}
                <View className="items-center justify-center my-8">
                    <ThemedText variant="secondary" className="text-[21px]">Enter amount</ThemedText>
                    <ThemedText className="text-[42px] font-bold">
                        {amount ? `₦${Number(amount).toLocaleString()}` : "₦0.00"}
                    </ThemedText>
                </View>

                <CustomKeypad
                    onPress={handleKeyPress}
                    onDelete={handleDelete}
                />
            </ScrollView>

            {/* Fixed Bottom Button */}
            <View
                className="px-5 pb-4 bg-background-light dark:bg-background-dark"
                style={{
                    paddingBottom: Math.max(insets.bottom, 16)
                }}
            >
                <Button
                    className="bg-[#4BC131] py-4 rounded-full"
                    onPress={handleConfirm}
                    disabled={isLoading}
                >
                    <ThemedText className="text-white text-center font-bold text-lg">
                        {isLoading ? "Processing..." : "Confirm"}
                    </ThemedText>
                </Button>
            </View>

            <PinEntryModal
                visible={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSubmit={(code) => {
                    handleWithdrawal(code);
                }}
                pin={pin}
                setPin={setPin}
                maxLength={4}
                isLoading={isLoading}
            />

            <WithdrawalSuccessModal
                visible={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    // router.replace(paths.tabs.home);
                }}
                onViewReceipt={() => {
                    setShowSuccessModal(false);
                    router.push({
                        pathname: paths.detailtransaction,
                        params: {
                            transId: transId,
                            type: "withdrawal",
                        }
                    });
                }}
                amount={amount}
                bankName={bankName}
                accountNumber={accountNumber}
                accountName={accountName}
                onSaveBeneficiaryChange={handleSaveBeneficiary}
            />
        </ThemedView>
    );
}