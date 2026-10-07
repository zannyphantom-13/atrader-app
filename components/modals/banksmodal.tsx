import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import { useGetBanksQuery } from "@/redux/transaction/banks";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet"; // Import this
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
interface BankModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  handleChangeBankInfo?: (value: any) => void;
  formData?: any;
}

const BankModal = ({
  visible,
  setVisible,
  handleChangeBankInfo,
  formData,
}: BankModalProps) => {
  const { isDark } = useTheme();
  const [search, setSearch] = React.useState("");
  const { data: banks, isLoading } = useGetBanksQuery({});

  const banksList = banks?.banks?.data || [];

  // Memoize filtered data to prevent unnecessary recalculations
  const filteredBanks = useMemo(() => {
    if (!search.trim()) return banksList;
    return banksList.filter((bank: any) =>
      bank.bankName.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, banksList]);

  const renderBankItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => {
        handleChangeBankInfo?.({
          bankcode: item.bankCode,
          bankurl: item.bankUrl,
          bankname: item.bankName,
        });
        setVisible(false);
      }}
      className={`flex-row items-center gap-4 p-4 rounded-[20px] bg-[#F9F9F9] dark:bg-[#0C0C0C] border-[0.5px] border-border-light dark:border-border-dark ${formData?.bankName === item.bankName
        ? "!border-primary-500 bg-primary-50 dark:bg-primary-900/10"
        : ""
        }`}
    >
      {item.bankUrl ? (
        <Image
          source={{ uri: item.bankUrl }}
          className="w-10 h-10 rounded-[20px]"
        />
      ) : (
        <View className="w-10 h-10 rounded-[20px] bg-primary-500 items-center justify-center">
          <ThemedText className="text-white font-semibold">
            {item.bankName.charAt(0).toUpperCase() || "B"}
          </ThemedText>
        </View>
      )}
      <ThemedText weight="medium" className="flex-1 text-base">
        {item?.bankName}
      </ThemedText>
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
      padding={0} // Remove padding from modal, add to header instead
    >
      {/* Fixed Header */}
      <View className="px-5 pb-3">
        <View className="flex-row items-center justify-between mb-4">
          <ThemedText weight="semibold" className="text-xl flex-1">
            Choose bank
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
            placeholder="Search bank"
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-base font-primary-medium"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          />
        </View>
      </View>

      {/* Scrollable Bank List */}
      {isLoading ? (
        <View className="flex-1 px-5 pt-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <View
              key={index}
              className="flex-row items-center gap-4 p-4 rounded-[20px] bg-[#F9F9F9] dark:bg-[#0C0C0C] border-[0.5px] border-border-light dark:border-border-dark mb-3"
            >
              <View className="w-10 h-10 rounded-[20px] bg-gray-300 dark:bg-gray-600 animate-pulse" />
              <View className="w-1/2 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            </View>
          ))}
        </View>
      ) : (
        <BottomSheetFlatList
          data={filteredBanks}
          renderItem={renderBankItem}
          keyExtractor={(item, index) => `${item.bankCode}-${index}`}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40
          }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={() => (
            <View className="py-10 items-center">
              <icons.bankAt width={40} height={40} style={{ opacity: 0.5 }} />
              <ThemedText variant="secondary" className="text-center mt-4">
                No banks found
              </ThemedText>
            </View>
          )}

          keyboardShouldPersistTaps="handled"
        />
      )}
    </CustomModal>
  );
};

export default BankModal;