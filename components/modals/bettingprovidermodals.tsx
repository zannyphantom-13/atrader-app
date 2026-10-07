import { ThemedText } from "@/components/theme/themeText";
import { CustomModal } from "@/components/ui/modal";
import { useTheme } from "@/context/ThemeProvider";
import { useGetBettingListQuery } from "@/redux/bills/bills_api";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Search, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, TextInput, View } from "react-native";

interface BettingProviderModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  selectedBettingProvider?: string;
  handleChange: (value: string) => void;
  setActiveNetwork?: (value: any) => void;
}

const BettingProviderModal = ({
  visible,
  setVisible,
  selectedBettingProvider,
  handleChange,
  setActiveNetwork,
}: BettingProviderModalProps) => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetBettingListQuery({});

  const providers = useMemo(() => data?.bet_providers || [], [data]);

  const filteredProviders = useMemo(() => {
    if (!search.trim()) return providers;
    return providers.filter((provider: any) =>
      provider.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, providers]);

  const renderBetItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => {
        handleChange(item?.name);
        setActiveNetwork?.(item);
        setVisible(false);
      }}
      className={`flex-row items-center gap-4 p-4 rounded-[20px] border-[0.5px] justify-between ${selectedBettingProvider === item.name
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
            <ThemedText className="text-xs">
              {item?.name?.charAt(0).toUpperCase() || "B"}
            </ThemedText>
          </View>
        )}
        <ThemedText family="primary" variant="primary" weight="medium" className="text-b2">
          {item?.name}
        </ThemedText>
      </View>
      {selectedBettingProvider === item.name && (
        <View className="w-5 h-5 rounded-full bg-primary-500 items-center justify-center">
          <ThemedText className="text-[10px] text-white font-bold">✓</ThemedText>
        </View>
      )}
    </Pressable>
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
      {/* Fixed Header */}
      <View className="px-5 pb-3">
        <View className="flex-row items-center justify-between mb-4">
          <ThemedText weight="semibold" className="text-xl flex-1">
            Choose betting provider
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
          className="flex-row items-center gap-3 px-4 py-3 rounded-[20px] border border-border-light dark:border-border-dark"
          style={{
            backgroundColor: isDark ? "#0C0C0C" : "#F9F9F9",
          }}
        >
          <Search size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
          <TextInput
            placeholder="Search betting provider"
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-base font-primary-medium"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#00C853" className="mt-10" />
        ) : (
          <BottomSheetFlatList
            data={filteredProviders}
            keyExtractor={(item, index) => `${item.unique_identifier}-${index}`}
            renderItem={renderBetItem}
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
          />
        )}
      </View>
    </CustomModal>
  );
};

export default BettingProviderModal;
