import { SettingsHeader } from "@/components/customs/settingsHeader";
import CryptoModal from "@/components/modals/cryptomodal";
import NetworkSelectionModal from "@/components/modals/NetworkSelectionModal";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useGenerateWalletMutation, useGetCrptoNetworkQuery } from "@/redux/crypto/crypto_api";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SellCrypto = () => {
    const { isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const toast = useToast();
    const [showCryptoModal, setShowCryptoModal] = useState(false);
    const [showNetworkModal, setShowNetworkModal] = useState(false);

    const [generateWallet, { isLoading }] = useGenerateWalletMutation();
    const { data: cryptoData, isError, error, isLoading: isNetworksLoading } = useGetCrptoNetworkQuery({});

    const params = useLocalSearchParams();
    const { symbol, cryptoName, cryptoImage, networksList } = params;

    const [formData, setFormData] = useState({
        crypto: "",
        cryptoImage: "",
        network: "", // This will hold networkCode for API
        networkName: "", // This will hold networkName for UI
        symbol: "",
        networks: [] as any[],
        minDeposit: "",
    });

    useEffect(() => {
        if (symbol) {
            let parsedNetworks = [];
            try {
                parsedNetworks = networksList ? JSON.parse(networksList as string) : [];
                if (!Array.isArray(parsedNetworks)) {
                    parsedNetworks = [];
                }
            } catch (e) {
                console.error("Error parsing networksList:", e);
                parsedNetworks = [];
            }

            setFormData({
                crypto: (cryptoName as string) || "",
                cryptoImage: (cryptoImage as string) || "",
                symbol: (symbol as string) || "",
                networks: parsedNetworks,
                network: "",
                networkName: "",
                minDeposit: "",
            });
        }
    }, [symbol, cryptoName, cryptoImage, networksList]);

    // Handle fetching error
    useEffect(() => {
        if (isError) {
            toast.showToast(
                (error as any)?.data?.message || "Failed to fetch crypto networks. Please try again.",
                "error"
            );
        }
    }, [isError, error]);

    // Handle fetching networks if they're missing or if symbol changes
    useEffect(() => {
        if (formData.symbol && formData.networks.length === 0 && cryptoData?.all_addresses?.data) {
            const cryptoDetails = cryptoData.all_addresses.data[formData.symbol];
            if (cryptoDetails && cryptoDetails.networks) {
                setFormData(prev => ({
                    ...prev,
                    networks: (cryptoDetails.networks && Array.isArray(cryptoDetails.networks)) 
                        ? cryptoDetails.networks 
                        : []
                }));
            }
        }
    }, [formData.symbol, formData.networks.length, cryptoData]);

    const handleSelectCrypto = (field: string, value: string, image?: string, networks?: any[]) => {
        setFormData((prev) => ({
            ...prev,
            crypto: value,
            cryptoImage: image || "",
            networks: networks || [],
            network: "", // Clear networkCode
            networkName: "", // Clear networkName display
        }));
    };

    const handleSelectSymbol = (symbol: string) => {
        setFormData((prev) => ({ ...prev, symbol }))
    }

    const handleSelectNetwork = (network: any) => {
        setFormData((prev) => ({
            ...prev,
            network: network.networkCode,
            networkName: network.networkName,
            minDeposit: network.minimumDeposit
        }));
        setShowNetworkModal(false);
    };

    const handleGenerateWallet = async () => {
        try {
            const token = await TokenManager.getToken();
            const response = await generateWallet({
                data: {
                    token: token,
                    currency: formData.symbol,
                    network: formData.network,
                }
            }).unwrap();
            // console.log('response', response)
            if (response.status === "success" || response.address) {
                toast.showToast(response.message || "Wallet generated successfully", "success");
                router.push({
                    pathname: paths.crypto.sellCryptoData as any,
                    params: {
                        cryptoName: formData.crypto,
                        cryptoSymbol: formData.symbol,
                        networkName: response.network || formData.network,
                        cryptoImage: formData.cryptoImage,
                        address: response.address,
                        minimumDeposit: formData.minDeposit,
                    }
                });
            } else {
                toast.showToast(response.message || "Failed to generate wallet", "error");
            }
        } catch (error: any) {
            toast.showToast(
                error?.data?.message || error?.message || "Failed to generate wallet",
                "error"
            );
        }
    };

    return (
        <>
            <SettingsHeader title="Sell crypto" />

            <ThemedView className="flex-1">
                <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
                    {/* Selection Container Pattern */}
                    <View className="bg-[#FCFCFC] dark:bg-[#111111] rounded-[30px] p-2 border border-border-light dark:border-border-dark w-full mb-6">
                        <View className="bg-white dark:bg-dark-900 rounded-[24px] overflow-hidden border border-border-light dark:border-border-dark">
                            {/* Select Crypto */}
                            <Pressable
                                onPress={() => setShowCryptoModal(true)}
                                className={`flex-row items-center justify-between p-5 border-b border-border-light dark:border-border-dark`}
                            >
                                <View className="flex-row items-center gap-3">
                                    <View>
                                        <ThemedText
                                            family="primary"
                                            weight="medium"
                                            className={formData.crypto ? "text-black dark:text-white text-base" : "text-gray-400 text-base"}
                                        >
                                            {formData.crypto || "Select crypto"}
                                        </ThemedText>
                                        {formData.symbol && (
                                            <ThemedText variant="secondary" className="text-xs uppercase">
                                                {formData.symbol}
                                            </ThemedText>
                                        )}
                                    </View>
                                </View>
                                <ChevronRight size={20} color={isDark ? "#555" : "#999"} />
                            </Pressable>

                            {/* Choose Network */}
                            <Pressable
                                onPress={() => setShowNetworkModal(true)}
                                className={`flex-row items-center justify-between p-5`}
                            >
                                <View className="flex-row items-center gap-3">
                                    {isNetworksLoading && formData.symbol && formData.networks.length === 0 ? (
                                        <ActivityIndicator size="small" color={isDark ? "white" : "black"} />
                                    ) : (
                                        <ThemedText
                                            family="primary"
                                            weight="medium"
                                            className={formData.networkName ? "text-black dark:text-white text-base" : "text-gray-400 text-base"}
                                        >
                                            {formData.networkName || "Choose network"}
                                        </ThemedText>
                                    )}
                                </View>
                                <ChevronRight size={20} color={isDark ? "#555" : "#999"} />
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>

                {/* Fixed Bottom Button */}
                <View className="px-5 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 10) + 10 }}>
                    <Button
                        variant="primary"
                        fullWidth
                        onPress={handleGenerateWallet}
                        disabled={!formData.crypto || !formData.network || isLoading}
                    >
                        {isLoading ? <ActivityIndicator color="#fff" /> : "Continue"}
                    </Button>
                </View>

                {/* Modals */}
                <CryptoModal
                    visible={showCryptoModal}
                    setVisible={setShowCryptoModal}
                    formData={{ crypto: formData.crypto } as any}
                    handleChange={(field, value, image, networks) => {
                        if (field === "crypto") {
                            handleSelectCrypto(field, value, image, networks);
                        } else if (field === "sign") {
                            handleSelectSymbol(value);
                        }
                    }}
                />

                <NetworkSelectionModal
                    visible={showNetworkModal}
                    onClose={() => setShowNetworkModal(false)}
                    onSelect={handleSelectNetwork}
                    selectedNetwork={formData.network}
                    cryptoSymbol={formData.symbol}
                    networksList={formData.networks}
                />
            </ThemedView>
        </>
    );
};

export default SellCrypto;
