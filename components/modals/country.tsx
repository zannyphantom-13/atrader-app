import { useTheme } from "@/context/ThemeProvider";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Search, X } from "lucide-react-native";
import React, { useMemo } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View
} from "react-native";
import {
  COUNTRIES,
  CountryData,
  POPULAR_COUNTRIES,
  searchCountries,
} from "../phone_dial_contries";
import { ThemedText } from "../theme/themeText";
import { CustomModal } from "../ui/modal";
import { CountryFlag } from "../ui/CountryFlag";

interface CountryModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  selectedCountry: any; // Changed from string to any to match usage in buyGiftcardsData
  setSelectedCountry: (country: any) => void;
  handleChange?: (value: string) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  handleSearchChange?: (text: string) => void;
}

const CountryModal = ({
  visible,
  setVisible,
  selectedCountry,
  setSelectedCountry,
  handleChange,
  searchText,
  setSearchText,
  handleSearchChange,
}: CountryModalProps) => {
  const { isDark } = useTheme();

  const filteredCountries = useMemo(() => {
    if (!searchText.trim()) {
      // Show popular countries first when no search
      const popular = COUNTRIES.filter((country) =>
        POPULAR_COUNTRIES.includes(country.code)
      );
      const others = COUNTRIES.filter(
        (country) => !POPULAR_COUNTRIES.includes(country.code)
      );
      return [...popular, ...others];
    }
    return searchCountries(searchText);
  }, [searchText]);

  const renderCountryItem = ({ item }: { item: CountryData }) => (
    <Pressable
      onPress={() => {
        handleChange?.(item.name);
        setSelectedCountry({
          name: item.name,
          flag: item.flag,
          code: item.code,
        });
        setVisible(false);
      }}
      className={`flex-row items-center gap-4 p-4 rounded-[20px] border-[0.5px] justify-between ${selectedCountry && (selectedCountry.code === item.code || selectedCountry.name === item.name)
        ? "dark:bg-[#0B2E02] bg-[#E8F5E9] border-primary-500"
        : "bg-[#F9F9F9] dark:bg-[#0C0C0C] border-border-light dark:border-border-dark"
        }`}
    >
      <View className="flex-row items-center gap-3">
        <CountryFlag flag={item.flag} size={22} />
        <View className="flex-1">
          <ThemedText weight="medium" className="text-base">
            {item.name}
          </ThemedText>
          <ThemedText variant="secondary" className="text-xs uppercase">
            {item.code}
          </ThemedText>
        </View>
      </View>
      {/* {(selectedCountry && (selectedCountry.code === item.code || selectedCountry.name === item.name)) && (
        <View className="w-5 h-5 rounded-full bg-primary-500 items-center justify-center">
          <ThemedText className="text-[10px] text-white font-bold">✓</ThemedText>
        </View>
      )} */}
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
            Choose country
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
            value={searchText}
            onChangeText={handleSearchChange || setSearchText}
            className="flex-1 text-base font-primary-medium"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          />
        </View>
      </View>

      {/* Scrollable Country List */}
      <BottomSheetFlatList
        data={filteredCountries}
        renderItem={renderCountryItem}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40
        }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={() => (
          <View className="py-10 items-center">
            <ThemedText variant="secondary" className="text-center">
              No countries found
            </ThemedText>
          </View>
        )}
        keyboardShouldPersistTaps="handled"
      />
    </CustomModal>
  );
};

export default CountryModal;
