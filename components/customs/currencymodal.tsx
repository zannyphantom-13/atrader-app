import { currencyProps } from "@/app/(protected)/(tabs)/calculator";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { Search } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { ThemedText } from "../theme/themeText";
import { CustomModal } from "../ui/modal";

interface CryptoModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  currencyData: currencyProps;
  setCurrencyData: ({ currency, abbr }: currencyProps) => void;
}

const depData = [
  // { id: 1, title: "Naira", abbr: "NGN", flag: img.NAIRA },
  { id: 2, title: "US Dollars", abbr: "USD", flag: img.USA },
];

const CurrencyModal = ({
  visible,
  setVisible,
  currencyData,
  setCurrencyData,
}: CryptoModalProps) => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    return depData.filter((item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.abbr.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <CustomModal
      visible={visible}
      onClose={() => setVisible(false)}
      title="Choose Currency"
      height="auto"
      // padding={20}
      modalStyle={{
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
      }}
      showHandle={false}
      showHeader={false}
      closebutton={true}
    >
      <View className="flex-row items-center justify-between mb-4">
        <ThemedText family="primary" weight="medium" className="text-[16px]">
          Choose Currency
        </ThemedText>
      </View>

      {/* Search Input */}
      <View className="flex-row items-center bg-[#F9F9F9] dark:bg-[#1A1A1A] rounded-[20px] px-4 py-3 mb-6 border-[0.5px] border-[#EFEFEF] dark:border-[#232323]">
        <Search size={20} color={isDark ? "#888" : "#999"} />
        <TextInput
          placeholder="Search"
          placeholderTextColor={isDark ? "#888" : "#999"}
          value={search}
          onChangeText={setSearch}
          className="flex-1 ml-2 text-b1 py-2 font-primary-medium dark:text-white"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="flex flex-col">
          {filteredData.map((item) => {
            const isSelected = currencyData.abbr === item.abbr;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setCurrencyData({
                    currency: `${item.title}`,
                    abbr: item.abbr,
                    flag: item.flag,
                  });
                  setVisible(false);
                }}
                className="flex-row items-center justify-between p-4 bg-[#F9F9F9] dark:bg-[#1A1A1A] rounded-[24px] mb-3 border-[0.5px] border-[#EFEFEF] dark:border-[#232323]"
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-light-200 dark:bg-dark-500 items-center justify-center">
                    <ThemedText className="text-h6">{<item.flag />}</ThemedText>
                  </View>
                  <ThemedText
                    family="primary"
                    weight="medium"
                    className="text-b1"
                  >
                    {item.title}
                  </ThemedText>
                </View>

                {/* Radio Button */}
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isSelected ? (isDark ? "#FFF" : "#000") : (isDark ? "#444" : "#DDD"),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected && (
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: isDark ? "#FFF" : "#000",
                      }}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
          {filteredData.length === 0 && (
            <ThemedText className="text-center mt-10" variant="secondary">
              No results found
            </ThemedText>
          )}
        </View>
      </ScrollView>
    </CustomModal>
  );
};

export default CurrencyModal;
