import { ThemedText } from "@/components/theme/themeText";
import { networkTypes } from "@/constant/data";
import { useTheme } from "@/context/ThemeProvider";
import { ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

interface NetworkDropdownProps {
    selectedNetwork: string | null;
    onSelectNetwork: (network: any) => void;
}

export const NetworkDropdown: React.FC<NetworkDropdownProps> = ({
    selectedNetwork,
    onSelectNetwork,
}) => {
    const { isDark } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const currentNetwork = networkTypes.find((n) => n.id === selectedNetwork);
    const NetworkIcon = currentNetwork?.icon;

    return (
        <View className="relative">
            {/* Trigger Button */}
            <Pressable
                onPress={() => setIsOpen(!isOpen)}
                className="flex-row items-center gap-2 py-2 px-3"
            >
                {NetworkIcon ? (
                    <View className="w-10 h-10 rounded-full overflow-hidden items-center justify-center bg-white">
                        <NetworkIcon width={32} height={32} />
                    </View>
                ) : (
                    <View className="w-10 h-10 rounded-full bg-gray-300 items-center justify-center">
                        <ThemedText className="text-xs">Net</ThemedText>
                    </View>
                )}
                <ChevronDown
                    size={16}
                    color={isDark ? "#888888" : "#666666"}
                />
            </Pressable>

            {/* Dropdown Menu */}
            {isOpen && (
                <View
                    className="absolute top-14 left-0 z-50 bg-white dark:bg-[#111111] rounded-2xl border border-[#EFEFEF] dark:border-[#232323] py-2 w-48"
                    style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 12,
                        elevation: 8,
                    }}
                >
                    {networkTypes.map((network) => {
                        const Icon = network.icon;
                        const isSelected = selectedNetwork === network.id;

                        return (
                            <Pressable
                                key={network.id}
                                onPress={() => {
                                    onSelectNetwork(network);
                                    setIsOpen(false);
                                }}
                                className={`flex-row items-center justify-between px-4 py-3 ${isSelected ? "bg-[#F5F5F5] dark:bg-[#1A1A1A]" : ""
                                    }`}
                            >
                                <View className="flex-row items-center gap-3">
                                    <View className="w-8 h-8 rounded-full overflow-hidden items-center justify-center bg-white">
                                        <Icon width={24} height={24} />
                                    </View>
                                    <ThemedText
                                        family="primary"
                                        weight="medium"
                                        className="text-b2"
                                    >
                                        {network.name}
                                    </ThemedText>
                                </View>

                                {/* Radio Button */}
                                <View
                                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isSelected
                                            ? "border-primary-500"
                                            : "border-gray-300 dark:border-gray-600"
                                        }`}
                                >
                                    {isSelected && (
                                        <View className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                                    )}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

export default NetworkDropdown;
