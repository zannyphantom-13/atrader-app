import { useTheme } from "@/context/ThemeProvider";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Search, X } from "lucide-react-native";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View
} from "react-native";
import { ThemedText } from "../theme/themeText";
import { CustomModal } from "../ui/modal";
import { CountryFlag } from "../ui/CountryFlag";

interface GiftCardSubCategoryModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  selectedSubCategory: string;
  handleChange: (item: any) => void;
  data: any;
  isFindingSubCategory: boolean;
  searchGiftcards: string;
  setSearchGiftCards: (text: string) => void;
  image: any;
  handleSearchChange?: (text: string) => void;
}

const GiftCardSubCategoryModal = ({
  visible,
  setVisible,
  selectedSubCategory,
  handleChange,
  data,
  isFindingSubCategory,
  searchGiftcards,
  setSearchGiftCards,
  image,
  handleSearchChange,
}: GiftCardSubCategoryModalProps) => {
  const { isDark } = useTheme();

  const filteredData = useMemo(() => {
    if (!data) return []; // Now receiving the `countries` array directly
    if (!searchGiftcards) return data;
    return data.filter((item: any) =>
      item.country.toLowerCase().includes(searchGiftcards.toLowerCase())
    );
  }, [data, searchGiftcards]);

  const renderSubCategoryItem = ({ item, index }: { item: any; index: number }) => {
    const match = item?.country?.match(/^((?:[\uD800-\uDBFF][\uDC00-\uDFFF])+)\s*(.*)$/);
    const flag = match ? match[1] : "";
    const countryName = match ? match[2] : item?.country;

    return (
      <Pressable
        key={index}
        onPress={() => {
          handleChange(item);
          setVisible(false);
        }}
        className={`flex-row items-center gap-4 p-4 rounded-[20px] border-[0.5px] justify-between ${selectedSubCategory && selectedSubCategory === item.country
          ? "dark:bg-[#0B2E02] bg-[#E8F5E9] border-primary-500"
          : "bg-[#F9F9F9] dark:bg-[#0C0C0C] border-border-light dark:border-border-dark"
          }`}
      >
        <View className="flex-row items-center gap-3">
          {flag ? (
            <CountryFlag flag={flag} size={18} style={{ marginRight: 4 }} />
          ) : null}
          <ThemedText
            family="primary"
            weight="medium"
            className="text-b2"
          >
            {countryName}
          </ThemedText>
        </View>
        {(selectedSubCategory && selectedSubCategory === item.country) && (
          <View className="w-5 h-5 rounded-full bg-primary-500 items-center justify-center">
            <ThemedText className="text-[10px] text-white font-bold">✓</ThemedText>
          </View>
        )}
      </Pressable>
    );
  };

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
            Choose Country
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
            placeholder="Search country"
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            value={searchGiftcards}
            onChangeText={handleSearchChange || setSearchGiftCards}
            className="flex-1 text-base font-primary-medium"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          />
        </View>
      </View>

      {/* List */}
      <View style={{ flex: 1 }}>
        <BottomSheetFlatList
          data={isFindingSubCategory ? [] : filteredData}
          renderItem={renderSubCategoryItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40
          }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={() => (
            isFindingSubCategory ? (
              <ActivityIndicator size="large" color="#00C853" style={{ marginTop: 40 }} />
            ) : (
              <ThemedText className="text-center mt-10 text-b2 text-gray-500">
                {searchGiftcards ? "No matches found" : "No countries available"}
              </ThemedText>
            )
          )}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </CustomModal>
  );
};

export default GiftCardSubCategoryModal;

