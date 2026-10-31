import { formDataCryptoProps } from "@/app/(protected)/(tabs)/calculator";
import { useTheme } from "@/context/ThemeProvider";
import { useGetCrptoNetworkQuery } from "@/redux/crypto/crypto_api";
import { getFirstChar } from "@/utils/bills";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Search } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  TextInput,
  View
} from "react-native";
import { ThemedText } from "../theme/themeText";
import { CustomModal } from "../ui/modal";

interface CryptoModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  formData: formDataCryptoProps;
  handleChange: (field: keyof formDataCryptoProps, value: string, image?: string, networks?: any[]) => void;
}

const CryptoModal = ({
  visible,
  setVisible,
  formData,
  handleChange,
}: CryptoModalProps) => {
  const { isDark } = useTheme();
  const [search, setSearch] = React.useState("");

  const { data: cryptoData, isLoading: isCryptoLoading, refetch: refetchCrypto, isFetching } = useGetCrptoNetworkQuery({});

  const handleChangeSearch = (text: string) => {
    setSearch(text);
  };

  console.log('cryptoData', cryptoData);

  const filteredData = React.useMemo(() => {
    if (!cryptoData?.all_addresses?.data) return [];

    // Transform object data into array for FlatList
    const cryptoList = Object.entries(cryptoData.all_addresses.data).map(([symbol, details]: [string, any]) => ({
      symbol,
      ...details
    }));

    return cryptoList.filter((item: any) =>
      item.currencyName?.toLowerCase().includes(search.toLowerCase()) ||
      item.symbol?.toLowerCase().includes(search.toLowerCase())
    );
  }, [cryptoData, search]);

  const onRefresh = React.useCallback(() => {
    refetchCrypto();
  }, [refetchCrypto]);

  const renderCryptoItem = ({ item }: { item: any }) => {
    const isSelected = formData.crypto === item.currencyName;

    return (
      <Pressable
        onPress={() => {
          handleChange("crypto", item.currencyName, item.image || "", item.networks || []);
          handleChange("sign", item.symbol);
          setVisible(false);
        }}
        className={`flex-row items-center py-[14px] rounded-[20px] px-3 border-[0.5px] border-[#EFEFEF] dark:border-[#232323] justify-between 
          ${isSelected ? "border-primary-500 border-2 " : "bg-[#FCFCFC] dark:bg-[#111111]"}
          `}
      >
        <View className="flex-row items-center gap-3 flex-1">
          {item.image ? (
            <Image
              source={{
                uri: item.image.startsWith("http")
                  ? item.image
                  : ``,
              }}
              style={{ width: 40, height: 40 }}
              className="rounded-full"
            />
          ) : (
            <View className="bg-white dark:bg-dark-500 w-10 h-10 items-center justify-center rounded-full">
              <ThemedText className="text-xs">
                {getFirstChar(item.currencyName || item.symbol || "C")}
              </ThemedText>
            </View>
          )}

          <View className="flex-1">
            <ThemedText
              family="primary"
              variant="primary"
              weight="bold"
              style={{ fontSize: 16 }}
              className={`${isSelected ? "!text-primary-500" : "text-text-primary-light dark:text-text-primary-dark"}`}
            >
              {item.currencyName}
            </ThemedText>
            <ThemedText
              family="primary"
              weight="medium"
              className="text-xs text-[#999] uppercase"
            >
              {item.symbol}
            </ThemedText>
          </View>

          {/* <View>
            <ThemedText
              family="primary"
              weight="medium"
              className="text-sm dark:text-white"
            >
              1{item.symbol} ~ ₦0.00
            </ThemedText>
          </View> */}
        </View>
      </Pressable>
    );
  };

  return (
    <CustomModal
      visible={visible}
      onClose={() => setVisible(false)}
      title="Select Crypto"
      height="80%"
      padding={24}
      topOffset={80}
      bottomOffset={0}
      modalStyle={{
        borderRadius: 12,
        paddingTop: 20,
        paddingBottom: 20,
      }}
      containerStyle={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderRadius: 10,
      }}
      showHandle={false}
      showHeader={false}
      closebutton={true}
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => { }}
      renderScrollableContent={true}
      className="font-primary-bold bg-red-500 text-[2px]"
    >
      <View style={{ paddingTop: 10, paddingInline: 12 }}>
        <ThemedText
          family="primary"
          weight="medium"
          className="text-b2 text-left"
        >
          Choose Crypto
        </ThemedText>

        <View className="flex-row items-center bg-[#F9F9F9] dark:bg-[#111111] rounded-[20px] px-4 py-3 mb-6 mt-6 border-[0.5px] border-[#EFEFEF] dark:border-[#232323]">
          <Search size={24} color={isDark ? "#888" : "#999"} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={isDark ? "#888" : "#999"}
            value={search}
            onChangeText={handleChangeSearch}
            className="flex-1 ml-2 text-b1 py-2 font-primary-medium dark:text-white"
          />
        </View>
      </View>
      {isCryptoLoading ? (
        <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={isDark ? "white" : "black"} />
        </View>
      ) : (
        <BottomSheetFlatList
          data={filteredData}
          renderItem={renderCryptoItem}
          keyExtractor={(item: any, index: number) => `${item.id || item.name}-${index}`}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 40,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          // ListHeaderComponent={
          //   <View style={{ paddingTop: 10 }}>
          //     <ThemedText
          //       family="primary"
          //       weight="medium"
          //       className="text-b2 text-left"
          //     >
          //       Choose Crypto
          //     </ThemedText>

          //     <View className="flex-row items-center bg-[#F9F9F9] dark:bg-[#111111] rounded-[20px] px-4 py-3 mb-6 mt-6 border-[0.5px] border-[#EFEFEF] dark:border-[#232323]">
          //       <Search size={24} color={isDark ? "#888" : "#999"} />
          //       <TextInput
          //         placeholder="Search"
          //         placeholderTextColor={isDark ? "#888" : "#999"}
          //         value={search}
          //         onChangeText={handleChangeSearch}
          //         className="flex-1 ml-2 text-b1 py-2 font-primary-medium dark:text-white"
          //       />
          //     </View>
          //   </View>
          // }
          ListEmptyComponent={() => (
            <ThemedText
              family="primary"
              variant="primary"
              weight="medium"
              className="text-b2 text-center mt-8"
            >
              No Cryptocurrencies found
            </ThemedText>
          )}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
          }
        />
      )
      }
    </CustomModal >
  );
};

export default CryptoModal;
