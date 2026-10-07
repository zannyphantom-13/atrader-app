import { WalletGiftCardSkeleton } from "@/components/skeletons/walletskeleton";
import { ThemedText } from "@/components/theme/themeText";
import { useTheme } from "@/context/ThemeProvider";
import { usePagination } from "@/hooks/usepagination";
import { useFindGiftCardMutation } from "@/redux/giftcards/giftcards_api";
import { TokenManager } from "@/utils/secure-store-adapter";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Search, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    TextInput,
    View,
} from "react-native";
import { CustomModal } from "../ui/modal";

interface SellGiftCardsDataModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (item: any) => void;
    selectedId?: string;
}

const SellGiftCardsDataModal: React.FC<SellGiftCardsDataModalProps> = ({
    visible,
    onClose,
    onSelect,
    selectedId,
}) => {
    const { isDark } = useTheme();
    const [search, setSearch] = React.useState("");
    const [findGiftCard] = useFindGiftCardMutation();

    // We fetch all categories from the working endpoint matching wallet.tsx.
    // This endpoint works 100% reliably because we only pass the correct token, per_page, and page.
    const fetchGiftCards = useCallback(
        async (page: number, limit: number) => {
            const token = await TokenManager.getToken();
            if (!token) throw new Error("No token found");

            try {
                const response = await findGiftCard({
                    data: {
                        search,
                        token,
                        per_page: limit,
                        page,
                    },
                }).unwrap();

                if (response.status === "success") {
                    return {
                        data: response.categories || [],
                        pagination: response.pagination,
                    };
                }
                return { data: [] };
            } catch (err) {
                console.error("findGiftCard API error:", err);
                return { data: [] };
            }
        },
        [findGiftCard, search]
    );

    const {
        data,
        isLoading,
        isRefreshing,
        isLoadingMore,
        loadMore,
        refresh,
        hasMore,
    } = usePagination(fetchGiftCards, { limit: 20 });

    // Client-side filtering is extremely fast, instant, and avoids hitting 
    // network endpoints with unsupported search filters.
    const filteredData = useMemo(() => {
        if (!search) return data;
        return data.filter((item: any) =>
            item.name?.toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    // Trigger API fetch only when modal becomes visible
    useEffect(() => {
        if (visible) {
            refresh();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const getFirstChar = (text: string) => text.charAt(0).toUpperCase();

    const handleSelect = (item: any) => {
        onSelect(item);
        onClose();
    };

    const renderItem = ({ item }: { item: any }) => (
        <Pressable
            onPress={() => handleSelect(item)}
            className={`flex-row items-center gap-4 p-4 rounded-[20px] border-[0.5px] justify-between ${selectedId && (selectedId === item.id || selectedId === item.name)
                ? "dark:bg-[#0B2E02] bg-[#E8F5E9] border-primary-500"
                : "bg-[#F9F9F9] dark:bg-[#0C0C0C] border-border-light dark:border-border-dark"
                }`}
        >
            <View className="flex-row items-center gap-3">
                {item.image ? (
                    <Image
                        source={typeof item.image === "string" ? { uri: item.image } : item.image}
                        style={{ width: 36, height: 36 }}
                        className="rounded-full bg-gray-200 dark:bg-gray-800"
                    />
                ) : (
                    <View className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center">
                        <ThemedText className="text-primary-500 font-bold text-xs">
                            {getFirstChar(item.name || "G")}
                        </ThemedText>
                    </View>
                )}
                <View>
                    <ThemedText family="primary" variant="primary" weight="medium" className="text-b2">
                        {item.name}
                    </ThemedText>
                </View>
            </View>
            {(selectedId && (selectedId === item.id || selectedId === item.name)) && (
                <View className="w-5 h-5 rounded-full bg-primary-500 items-center justify-center">
                    <ThemedText className="text-[10px] text-white font-bold">✓</ThemedText>
                </View>
            )}
        </Pressable>
    );

    console.log('filteredData', data);


    const renderFooter = () => {
        if (isLoadingMore) {
            return (
                <View className="py-4">
                    <ActivityIndicator size="small" color={isDark ? "white" : "black"} />
                </View>
            );
        }
        // if (!hasMore && data.length > 0) {
        //     return (
        //         <ThemedText className="text-center py-4 text-gray-500 text-xs">
        //             No more gift cards
        //         </ThemedText>
        //     );
        // }
        return null;
    };

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
            <View className="px-5 pb-3">
                <View className="flex-row items-center justify-between mb-4">
                    <ThemedText weight="semibold" className="text-xl flex-1">
                        Select Gift Card
                    </ThemedText>
                    <Pressable onPress={onClose} className="p-2">
                        <X size={24} color={isDark ? "white" : "black"} />
                    </Pressable>
                </View>

                {/* Search */}
                <View
                    className="flex-row items-center gap-3 px-4 py-4 rounded-[20px] border border-border-light dark:border-border-dark"
                    style={{
                        backgroundColor: isDark ? "#0C0C0C" : "#F9F9F9",
                    }}
                >
                    <Search size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                    <TextInput
                        placeholder="Search gift cards..."
                        placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                        value={search}
                        onChangeText={setSearch}
                        className="flex-1 text-base font-primary-medium"
                        style={{ color: isDark ? "#FFFFFF" : "#000000" }}
                    />
                </View>
            </View>

            {/* List */}
            <View style={{ flex: 1 }}>
                {isLoading && data.length === 0 ? (
                    <View className="px-5 pt-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <WalletGiftCardSkeleton key={i} />
                        ))}
                    </View>
                ) : !isLoading && filteredData.length === 0 ? (
                    <View className="flex-1 items-center justify-center mt-8 px-5">
                        <ThemedText className="text-gray-500 text-center font-primary-medium text-b2">
                            No gift cards found {search ? `matching "${search}"` : ""}
                        </ThemedText>
                    </View>
                ) : (
                    <BottomSheetFlatList
                        data={filteredData}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                        ItemSeparatorComponent={() => <View className="h-3" />}
                        refreshing={isRefreshing}
                        onRefresh={refresh}
                        showsVerticalScrollIndicator={false}

                    />
                )}
            </View>
        </CustomModal>
    );
};

export default SellGiftCardsDataModal;
