import { useTheme } from "@/context/ThemeProvider";
import { getFirstChar } from "@/utils/bills";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Search, X } from "lucide-react-native";
import React, { useMemo } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    TextInput,
    View,
} from "react-native";
import { ThemedText } from "../theme/themeText";
import { CustomModal } from "../ui/modal";

interface GiftCardTypeModalProps {
    visible: boolean;
    setVisible: (visible: boolean) => void;
    selectedCardType: any;
    onSelect: (item: any) => void;
    data: any[];
    isLoading: boolean;
    subcategoryName: string;
}

const GiftCardTypeModal = ({
    visible,
    setVisible,
    selectedCardType,
    onSelect,
    data,
    isLoading,
    subcategoryName,
}: GiftCardTypeModalProps) => {
    const { isDark } = useTheme();
    const [search, setSearch] = React.useState("");

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!search) return data;
        return data.filter((item: any) =>
            item.type.toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    const renderTypeItem = ({ item, index }: { item: any; index: number }) => (
        <Pressable
            key={index}
            onPress={() => {
                onSelect(item);
                setVisible(false);
            }}
            className={`flex-row items-center gap-4 p-4 rounded-[20px] border-[0.5px] justify-between ${selectedCardType && selectedCardType.type === item.type
                ? "dark:bg-[#0B2E02] bg-[#E8F5E9] border-primary-500"
                : "bg-[#F9F9F9] dark:bg-[#0C0C0C] border-border-light dark:border-border-dark"
                }`}
        >
            <View className="flex-row items-center gap-3 flex-1">
                <View className="w-16 h-12 items-center justify-center rounded-lg overflow-hidden">
                    {item.type_image ? (
                        <Image
                            source={{ uri: item.type_image }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                        />
                    ) : (
                        <ThemedText className="text-xs">
                            {getFirstChar(item.type || "T")}
                        </ThemedText>
                    )}
                </View>
                <View className="flex-1">
                    <ThemedText
                        family="primary"
                        weight="medium"
                        className={`text-b1 ${selectedCardType && selectedCardType.type === item.type ? "" : ""}`}
                    >
                        {item?.type}
                    </ThemedText>
                    {item?.type_description ? (
                        <ThemedText
                            family="primary"
                            variant="secondary"
                            className={`text-b3 ${selectedCardType && selectedCardType.type === item.type ? "!text-white/70" : ""}`}
                        >
                            {item.type_description}
                        </ThemedText>
                    ) : null}
                </View>
            </View>
            {
                (selectedCardType && selectedCardType.type === item.type) && (
                    <View className="w-5 h-5 rounded-full bg-primary-500 items-center justify-center">
                        <ThemedText className="text-[10px] text-white font-bold">✓</ThemedText>
                    </View>
                )
            }
        </Pressable >
    );

    return (
        <CustomModal
            visible={visible}
            onClose={() => setVisible(false)}
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
                        Select card type
                    </ThemedText>
                    <Pressable
                        onPress={() => setVisible(false)}
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
                        placeholder="Search card type"
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
                <BottomSheetFlatList
                    data={isLoading ? [] : filteredData}
                    renderItem={renderTypeItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingBottom: 40
                    }}
                    ItemSeparatorComponent={() => <View className="h-3" />}
                    ListEmptyComponent={() => (
                        isLoading ? (
                            <ActivityIndicator size="large" color="#00C853" style={{ marginTop: 40 }} />
                        ) : (
                            <ThemedText className="text-center mt-10 text-b2 text-gray-500">
                                {search ? "No matches found" : "No card types available"}
                            </ThemedText>
                        )
                    )}
                    keyboardShouldPersistTaps="handled"
                />
            </View>
        </CustomModal>
    );
};

export default GiftCardTypeModal;
