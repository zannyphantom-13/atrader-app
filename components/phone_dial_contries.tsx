import { ThemedText } from "@/components/theme/themeText";
import { useTheme } from "@/context/ThemeProvider";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import countries from "world-countries";
import { CustomModal } from "./customs/customModal";
import { CountryFlag } from "./ui/CountryFlag";

export interface CountryData {
  name: string;
  code: string; // ISO alpha-2 code
  dialCode: string;
  flag: string;
  currency: string;
  continent?: string;
}

// Memoize the countries transformation to avoid recalculating on every render
export const COUNTRIES: CountryData[] = countries
  .map((country) => ({
    name: country.name.common,
    code: country.cca2,
    dialCode: country.idd.root + (country.idd.suffixes?.[0] || ""),
    flag: country.flag,
    currency: Object.keys(country.currencies || {})[0] || "",
  }))
  .filter((country) => country.dialCode && country.dialCode !== "+")
  .sort((a, b) => a.name.localeCompare(b.name));

// Popular countries to show first
export const POPULAR_COUNTRIES = [
  "US",
  "GB",
  "CA",
  "AU",
  "DE",
  "FR",
  "NG",
  "IN",
  "JP",
  "CN",
];

// Memoized utility functions
export const getCountryByCode = (code: string): CountryData | undefined => {
  return COUNTRIES.find((country) => country.code === code);
};

export const searchCountries = (query: string): CountryData[] => {
  if (!query.trim()) return COUNTRIES;

  const lowercaseQuery = query.toLowerCase().trim();
  return COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(lowercaseQuery) ||
      country.code.toLowerCase().includes(lowercaseQuery) ||
      country.dialCode.includes(query),
  );
};

interface PhoneInputProps {
  className?: string;
  label?: string;
  labelSecondary?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onChangeCountry?: (country: any) => void;
  error?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  disabled?: boolean;
  defaultCountry?: string;
  disableCountrySelect?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  className = "",
  label,
  labelSecondary,
  placeholder = "Enter phone number",
  value = "",
  onChangeText,
  onChangeCountry,
  error,
  keyboardType = "phone-pad",
  disabled = false,
  defaultCountry = "NG",
  disableCountrySelect = false,
}) => {
  const { isDark } = useTheme();


  const [selectedCountry, setSelectedCountry] = useState(
    () =>
      COUNTRIES.find((country) => country.code === defaultCountry) ||
      COUNTRIES[0],
  );

  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef<TextInput>(null);

  // Memoize filtered countries to avoid recalculating on every render
  const filteredCountries = useMemo(() => {
    if (!searchText.trim()) {
      // Show popular countries first when no search
      const popular = COUNTRIES.filter((country) =>
        POPULAR_COUNTRIES.includes(country.code),
      );
      const others = COUNTRIES.filter(
        (country) => !POPULAR_COUNTRIES.includes(country.code),
      );
      return [...popular, ...others];
    }
    return searchCountries(searchText);
  }, [searchText]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleCountrySelect = useCallback(
    (country: CountryData) => {
      setSelectedCountry(country);
      setShowCountryModal(false);
      setSearchText(""); // Clear search when modal closes
      onChangeCountry?.(country);

      // Focus back to input after country selection
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    },
    [onChangeCountry],
  );

  const handlePhoneChange = useCallback(
    (text: string) => {
      // Remove any non-numeric characters except spaces and dashes for formatting
      const cleaned = text.replace(/[^\d\s-]/g, "");
      onChangeText?.(cleaned);
    },
    [onChangeText],
  );

  const handleModalClose = useCallback(() => {
    setShowCountryModal(false);
    setSearchText(""); // Clear search when modal closes
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  // Memoized country item component
  const CountryItem = React.memo<{ item: CountryData; index: number }>(
    ({ item }) => {
      return (
        <>
          <TouchableOpacity
            style={[
              styles.countryItem,
              {
                borderBottomColor: isDark ? "#48484a" : "#e0e0e0",
              },
            ]}
            onPress={() => handleCountrySelect(item)}
            activeOpacity={0.7}
          >
            <CountryFlag flag={item.flag} size={20} />
            <View style={styles.countryInfo}>
              <ThemedText
                variant="primary"
                family="primary"
                weight="medium"
                className="text-b1"
                numberOfLines={1}
              >
                {item.name}
              </ThemedText>
              <ThemedText
                variant="secondary"
                family="primary"
                className="text-b2"
              >
                {item.dialCode}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </>
      );
    },
  );
  CountryItem.displayName = "CountryItem";

  // Memoized render function for FlatList
  const renderCountryItem = useCallback(
    ({ item, index }: { item: CountryData; index: number }) => (
      <CountryItem item={item} index={index} />
    ),
    [],
  );

  // Memoized key extractor
  const keyExtractor = useCallback((item: CountryData) => item.code, []);

  // Memoized getItemLayout for better performance
  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  return (
    <View className={`mt-2 ${className}`}>
      {/* Label */}
      {label && (
        <View className="flex-row items-center mb-2">
          <ThemedText
            variant="primary"
            family="primary"
            weight="medium"
            className="text-b2"
          >
            {label}
          </ThemedText>
          {labelSecondary && (
            <ThemedText
              variant="secondary"
              family="primary"
              className="text-b2 ml-1"
            >
              {labelSecondary}
            </ThemedText>
          )}
        </View>
      )}

      {/* Input Container */}
      <View
        className={`
          flex-row gap-[10px] items-center bg-background-light dark:bg-background-dark
          ${error ? "border-danger-500" : ""}
          ${disabled ? "opacity-50" : ""}
        `}
        style={{ height: 56 }}
      >
        {/* Country Selector */}
        <TouchableOpacity
          className={`flex-row items-center px-3 py-3 border  bg-foreground-light dark:bg-foreground-dark  rounded-[20px] ${disabled ? "opacity-50" : ""}   ${error ? "border-danger-500" : "border-border-light dark:border-border-dark"}`}
          onPress={() => !disabled && !disableCountrySelect && setShowCountryModal(true)}
          disabled={disabled || disableCountrySelect}
          style={styles.countrySelector}
          activeOpacity={disableCountrySelect ? 1 : 0.7}
        >
          <CountryFlag flag={selectedCountry.flag} size={20} />
          <ThemedText
            variant="primary"
            family="primary"
            weight="medium"
            className="text-b1 ml-2"
          >
            {selectedCountry.dialCode}
          </ThemedText>
        </TouchableOpacity>

        {/* Phone Number Input */}
        <TextInput
          ref={inputRef}
          className={`flex-1 px-3 py-[14px] border  ${error ? "border-danger-500" : "border-border-light dark:border-border-dark"}  rounded-[20px] text-text-primary-light dark:text-text-primary-dark text-base  bg-foreground-light dark:bg-foreground-dark`}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "#8e8e93" : "#999999"}
          value={value}
          onChangeText={handlePhoneChange}
          keyboardType={keyboardType}
          autoCapitalize="none"
          editable={!disabled}
          style={{
            color: isDark ? "#ffffff" : "#333333",
            fontSize: 16,
          }}
        />
      </View>

      {/* Error Message */}
      {error && (
        <ThemedText
          variant="primary"
          family="primary"
          className="!text-red-500 text-sm mt-1"
        >
          {error}
        </ThemedText>
      )}

      {/* Country Selection Modal */}
      <CustomModal
        visible={showCountryModal}
        onClose={handleModalClose}
        height="70%"
        transparent={true}
        topOffset={80}
        bottomOffset={0}
        style={{ flex: 1 }}
        containerStyle={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          borderRadius: 10,
        }}
        showHandle={true}
        showHeader={false}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => { }}
      >
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <ThemedText
            variant="primary"
            family="primary"
            weight="bold"
            className="text-h6"
          >
            Select Country
          </ThemedText>
        </View>

        {/* Search Input */}
        <View className="mb-4 px-3 py-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg">
          <TextInput
            className="text-text-primary dark:text-text-primary-dark text-base"
            placeholder="Search countries..."
            placeholderTextColor={isDark ? "#8e8e93" : "#999999"}
            value={searchText}
            onChangeText={handleSearchChange}
            style={{
              color: isDark ? "#ffffff" : "#333333",
              fontSize: 16,
            }}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>

        {/* Countries List */}

        <FlatList
          data={filteredCountries}
          keyExtractor={keyExtractor}
          renderItem={renderCountryItem}
          style={styles.countriesList}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true} // Important for performance
          maxToRenderPerBatch={10} // Render fewer items per batch
          updateCellsBatchingPeriod={20} // Update frequency
          initialNumToRender={15} // Render fewer items initially
          windowSize={10} // Smaller window size
          getItemLayout={getItemLayout} // Fixed height for better performance
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={null} // Remove if not needed
        />
      </CustomModal>
    </View>
  );
};

// Fixed item height for better performance
const ITEM_HEIGHT = 60;

const styles = StyleSheet.create({
  countrySelector: {
    minWidth: 100,
  },
  flagText: {
    fontSize: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
  },
  countriesList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    height: ITEM_HEIGHT, // Fixed height
  },
  countryInfo: {
    flex: 1,
    marginLeft: 12,
  },
});
