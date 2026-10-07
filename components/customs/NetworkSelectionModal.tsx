import { useTheme } from "@/context/ThemeProvider";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Search, X } from "lucide-react-native";
import React from "react";
import {
    Platform,
    Pressable,
    TextInput,
    View
} from "react-native";
import { ThemedText } from "../theme/themeText";
import { CustomModal } from "../ui/modal";

interface NetworkSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (network: any) => void;
    selectedNetwork?: string;
    cryptoSymbol?: string;
    networksList?: any[];
}

const NetworkSelectionModal = ({
    visible,
    onClose,
    onSelect,
    selectedNetwork,
    cryptoSymbol = "BTC",
    networksList = [],
}: NetworkSelectionModalProps) => {
    const { isDark } = useTheme();
    const [search, setSearch] = React.useState("");

    const filteredNetworks = React.useMemo(() => {
        if (!Array.isArray(networksList)) return [];
        return networksList.filter((network) =>
            network?.networkName?.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, networksList]);

    return (
        <CustomModal
            visible={visible}
            onClose={onClose}
            height="auto"
            padding={0}
            showHandle={false}
            showHeader={false}
            closebutton={false}
            renderScrollableContent={true}
        >
            <BottomSheetFlatList
                data={filteredNetworks}
                keyExtractor={(item: any, index: number) => `${item.networkCode}-${index}`}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingBottom: Platform.OS === 'android' ? 60 : 40,
                    gap: 12
                }}
                ListHeaderComponent={
                    <View style={{ paddingTop: 10 }}>
                        <View className="flex-row items-center justify-between mb-4">
                            <ThemedText family="primary" weight="bold" className="text-xl">
                                Choose network
                            </ThemedText>
                            <Pressable onPress={onClose} className="p-1">
                                <X size={24} color={isDark ? "white" : "black"} />
                            </Pressable>
                        </View>

                        <View className="flex-row items-center bg-[#F9F9F9] dark:bg-[#111111] rounded-[20px] px-4 py-3 mb-4 border-[0.5px] border-[#EFEFEF] dark:border-[#232323]">
                            <Search size={22} color={isDark ? "#888" : "#999"} />
                            <TextInput
                                placeholder="Search"
                                placeholderTextColor={isDark ? "#888" : "#999"}
                                value={search}
                                onChangeText={setSearch}
                                className="flex-1 ml-2 text-b1 font-primary-medium dark:text-white"
                            />
                        </View>
                    </View>
                }
                renderItem={({ item }) => {
                    const isSelected = selectedNetwork === item.networkName;
                    return (
                        <Pressable
                            onPress={() => onSelect(item)}
                            className={`p-4 rounded-[20px] border ${isSelected
                                ? "border-primary-500 bg-primary-500/5"
                                : "border-border-light dark:border-border-dark bg-[#FCFCFC] dark:bg-[#111111]"
                                }`}
                        >
                            <ThemedText family="primary" weight="bold" className="text-base mb-1">
                                {item.networkName}
                            </ThemedText>
                            <ThemedText family="secondary" className="text-gray-500 text-sm">
                                Minimum of {item.minimumDeposit} {cryptoSymbol}
                            </ThemedText>
                        </Pressable>
                    );
                }}
                ListEmptyComponent={() => (
                    <View className="items-center py-10">
                        <ThemedText variant="secondary">No networks found</ThemedText>
                    </View>
                )}
            />
        </CustomModal>
    );
};

export default NetworkSelectionModal;
