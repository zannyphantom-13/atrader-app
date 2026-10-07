import { SettingsHeader } from "@/components/customs/settingsHeader";
import CryptoPayAttentionModal from "@/components/modals/CryptoPayAttentionModal";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useGetCrptoNetworkQuery } from "@/redux/crypto/crypto_api";
import { formatNumber } from "@/utils/formatamount";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { Info } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

const SellCryptoData = () => {
    const { isDark } = useTheme();
    const params = useLocalSearchParams();
    console.log(params)
    const { cryptoName, cryptoSymbol, networkName, cryptoImage, address, minimumDeposit } = params;

    const [showAttentionModal, setShowAttentionModal] = useState(false);
    const { showToast } = useToast();
    const viewShotRef = useRef<View>(null);

    const { data: cryptoData } = useGetCrptoNetworkQuery({});
    const nairaRate = cryptoData?.all_addresses?.naira_rate || 0;


    useEffect(() => {
        // Trigger the attention modal immediately on mount
        setShowAttentionModal(true);
    }, []);

    const walletAddress = (address as string) || "Generating...";

    const handleCopyAddress = async () => {
        if (!address) return;
        try {
            await Clipboard.setStringAsync(address as string);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast("Address copied to clipboard", "success");
        } catch (error) {
            showToast("Failed to copy address", "error");
            console.error(error);
        }
    };

    const handleSharePicture = async () => {
        try {
            showToast("Preparing image for sharing...", "info");
            const uri = await captureRef(viewShotRef, {
                format: "png",
                quality: 1,
            });
            await Sharing.shareAsync(uri);
        } catch (error) {
            showToast("Failed to share picture", "error");
            console.error(error);
        }
    };

    return (
        <>
            <SettingsHeader title="Sell crypto" />
            <ThemedView className="flex-1">
                <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
                    {/* QR Code and Address Container */}
                    <View ref={viewShotRef} collapsable={false} className="bg-[#FCFCFC] dark:bg-[#111111] rounded-[30px] p-2 border border-border-light dark:border-border-dark w-full mb-6">
                        <View className="bg-white dark:bg-dark-900 rounded-[24px] p-5 items-center border border-border-light dark:border-border-dark">
                            <ThemedText family="primary" weight="bold" className="text-xl mb-1">
                                {cryptoName} address
                            </ThemedText>
                            <ThemedText variant="secondary" className="text-center mb-6 text-sm">
                                Send {cryptoSymbol} to this wallet below/scan the QR code
                            </ThemedText>

                            {/* QR Code Placeholder with icon overlap */}
                            <View className="relative mb-8 p-4 bg-white rounded-3xl">
                                <View className="w-56 h-56 items-center justify-center rounded-xl overflow-hidden">
                                    {address ? (
                                        <QRCode
                                            value={address as string}
                                            size={200}
                                            color="black"
                                            backgroundColor="white"
                                        />
                                    ) : (
                                        <View className="w-full h-full border-[10px] border-gray-200" style={{ borderStyle: 'dashed' }} />
                                    )}
                                    <View className="absolute bg-white p-2 rounded-full">
                                        {cryptoImage ? (
                                            <Image source={{ uri: cryptoImage as string }} style={{ width: 40, height: 40 }} className="rounded-full" />
                                        ) : (
                                            <View className="w-10 h-10 bg-primary-500 rounded-full items-center justify-center">
                                                <ThemedText className="text-white text-xs">{cryptoSymbol}</ThemedText>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Info Blocks within the container */}
                            <View className="w-full gap-2">
                                {/* Network */}
                                <View className="bg-[#F9F9F9] dark:bg-black rounded-[20px] p-4 border border-border-light dark:border-border-dark flex-row justify-between items-center">
                                    <View>
                                        <ThemedText variant="secondary" className="text-xs mb-1">Network</ThemedText>
                                        <ThemedText family="primary" weight="bold" className="text-base">{networkName}</ThemedText>
                                    </View>
                                </View>

                                {/* Deposit Address */}
                                <View className="bg-[#F9F9F9] dark:bg-black rounded-[20px] p-4 border border-border-light dark:border-border-dark">
                                    <ThemedText variant="secondary" className="text-xs mb-1">Deposit Address</ThemedText>
                                    <ThemedText family="primary" className="text-sm font-medium pr-2" numberOfLines={2}>
                                        {walletAddress}
                                    </ThemedText>
                                </View>

                                {/* Current Rate Row (Horizontal Layout internal) */}
                                <View className="bg-[#F9F9F9] dark:bg-black rounded-[20px] p-4 border border-border-light dark:border-border-dark flex-row justify-between items-center">
                                    <ThemedText variant="secondary" className="text-sm">Current rate:</ThemedText>
                                    <ThemedText family="primary" weight="bold" className="text-base">$1~₦{formatNumber(nairaRate)}</ThemedText>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Important Notes */}
                    <View className="bg-[#FCFCFC] dark:bg-[#111111] rounded-[30px] p-4 border border-border-light dark:border-border-dark mb-10">
                        <ThemedText variant="secondary" weight="medium" className="text-sm mb-4">Note</ThemedText>

                        <View className="flex-row items-start gap-2 mb-3">
                            <View className="pt-0.5"><Info size={16} color="#666" /></View>
                            <ThemedText variant="secondary" className="text-xs leading-4 flex-1">
                                Ensure the network matches the coin you're depositing.
                            </ThemedText>
                        </View>

                        <View className="flex-row items-start gap-2">
                            <View className="pt-0.5"><Info size={16} color="#666" /></View>
                            <ThemedText variant="secondary" className="text-xs leading-4 flex-1">
                                Minimum deposit is {minimumDeposit || '0'} {cryptoSymbol} ({networkName} network)
                            </ThemedText>
                        </View>
                    </View>
                </ScrollView>

                <SafeAreaView edges={["bottom"]} className="px-5 pb-10 pt-4 flex-row gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-[50px] border-gray-200 dark:border-gray-800"
                        onPress={handleSharePicture}
                    // icon="share-outline"
                    >
                        Share Picture
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 h-[50px]"
                        onPress={handleCopyAddress}
                    // icon="copy-outline"
                    >
                        Copy Address
                    </Button>
                </SafeAreaView>
            </ThemedView>

            <CryptoPayAttentionModal
                visible={showAttentionModal}
                onClose={() => setShowAttentionModal(false)}
                cryptoSymbol={cryptoSymbol as string}
                networkName={networkName as string}
            />
        </>
    );
};

export default SellCryptoData;
