import { ThemedText } from "@/components/theme/themeText";
import { CustomModal } from "@/components/ui/modal";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useGetCableMutation } from "@/redux/bills/bills_api";
import { TokenManager } from "@/utils/secure-store-adapter";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Search, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, TextInput, View } from "react-native";

interface SelectCableProviderModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (cable: any) => void;
    selectedId?: string;
}

interface CablePlan {
    plan_id: string;
    plan_name: string;
    amount: string;
}

interface CableProvider {
    name: string;
    image: string;
    plans: CablePlan[];
}

const SelectCableProviderModal: React.FC<SelectCableProviderModalProps> = ({
    visible,
    onClose,
    onSelect,
    selectedId,
}) => {
    const { isDark } = useTheme();
    const toast = useToast();
    const [search, setSearch] = useState("");
    const [cableDatas, setCableDatas] = useState<CableProvider[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const [getCable, { isLoading }] = useGetCableMutation();
    console.log('CablePackages', cableDatas)

    const getCableData = useCallback(async (isRefresh = false) => {
        const atex = await TokenManager.getToken();
        if (!atex) return;

        if (isRefresh) setRefreshing(true);

        try {
            const response: any = await getCable({
                data: { token: atex },
            }).unwrap();
            if (response.status === "success") {
                const transformedData: CableProvider[] = Object.entries(
                    response.data,
                ).map(([key, value]: [string, any]) => ({
                    name: key,
                    image: value.image,
                    plans: value.plans || [],
                }));
                setCableDatas(transformedData);
            } else {
                toast.showToast(`${response.message}`, "error");
            }
        } catch (error) {
            toast.showToast(`An error occurred. Please try again.`, "error");
        } finally {
            if (isRefresh) setRefreshing(false);
        }
    }, [getCable, toast]);

    useEffect(() => {
        if (visible) {
            getCableData();
        }
    }, [visible, getCableData]);

    const filteredCableData = useMemo(() => {
        if (!cableDatas) return [];
        if (search === "") return cableDatas;

        return cableDatas.filter((cable) =>
            cable.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [cableDatas, search]);

    const getFirstChar = (text: string) => text.charAt(0).toUpperCase();

    const renderItem = ({ item }: { item: CableProvider }) => (
        <Pressable
            onPress={() => onSelect(item)}
            className={`flex-row items-center gap-4 p-4 rounded-[20px] border-[0.5px] justify-between ${selectedId === item.name
                ? "dark:bg-[#0B2E02] bg-[#E8F5E9] border-primary-500"
                : "bg-[#F9F9F9] dark:bg-[#0C0C0C] border-border-light dark:border-border-dark"
                }`}
        >
            <View className="flex-row items-center gap-3">
                {item?.image ? (
                    <Image
                        source={{ uri: item.image }}
                        style={{ width: 36, height: 36 }}
                        className="rounded-full"
                    />
                ) : (
                    <View className="bg-white dark:bg-dark-500 w-9 h-9 items-center justify-center rounded-full">
                        <ThemedText className="text-xs">{getFirstChar(item?.name || "C")}</ThemedText>
                    </View>
                )}
                <ThemedText family="primary" variant="primary" weight="medium" className="text-b2">
                    {item?.name}
                </ThemedText>
            </View>
            {selectedId === item.name && (
                <View className="w-5 h-5 rounded-full bg-primary-500 items-center justify-center">
                    <ThemedText className="text-[10px] text-white font-bold">✓</ThemedText>
                </View>
            )}
        </Pressable>
    );

    return (
        <CustomModal
            visible={visible}
            onClose={onClose}
            title=""
            height="85%"
            showHandle={true}
            showHeader={false}
            renderScrollableContent={true}
            padding={0}
        >
            {/* Fixed Header */}
            <View className="px-5 pb-3">
                <View className="flex-row items-center justify-between mb-4">
                    <ThemedText weight="semibold" className="text-xl flex-1">
                        Select Cable Provider
                    </ThemedText>
                    <Pressable
                        onPress={onClose}
                        className="p-2"
                    >
                        <X size={24} color={isDark ? "white" : "black"} />
                    </Pressable>
                </View>

                {/* Search Bar */}
                <View
                    className="flex-row items-center gap-3 px-4 py-4 rounded-[20px] border border-border-light dark:border-border-dark"
                    style={{
                        backgroundColor: isDark ? "#0C0C0C" : "#F9F9F9",
                    }}
                >
                    <Search size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                    <TextInput
                        placeholder="Search cable provider"
                        placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                        value={search}
                        onChangeText={setSearch}
                        className="flex-1 text-base font-primary-medium"
                        style={{ color: isDark ? "#FFFFFF" : "#000000" }}
                    />
                </View>
            </View>

            <View style={{ flex: 1 }}>
                {isLoading && !refreshing ? (
                    <ActivityIndicator size="large" color="#00C853" className="mt-10" />
                ) : (
                    <BottomSheetFlatList
                        data={filteredCableData}
                        keyExtractor={(item, index) => `${item.name}-${index}`}
                        renderItem={renderItem}
                        contentContainerStyle={{
                            paddingHorizontal: 20,
                            paddingBottom: 40
                        }}
                        ItemSeparatorComponent={() => <View className="h-3" />}
                        ListEmptyComponent={() => (
                            <ThemedText className="text-center mt-10 text-b2 text-gray-500">
                                {search ? "No matches found" : "No providers available"}
                            </ThemedText>
                        )}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => getCableData(true)}
                                tintColor="#00C853"
                            />
                        }
                    />
                )}
            </View>
        </CustomModal>
    );
};

export default SelectCableProviderModal;
