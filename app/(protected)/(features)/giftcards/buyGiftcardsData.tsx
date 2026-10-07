import { SettingsHeader } from "@/components/customs/settingsHeader";
import CountryModal from "@/components/modals/country";
import { ThemedText } from "@/components/theme/themeText";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { ThemedView } from "@/components/theme/themeView";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useGetAllGiftCardsMutation } from "@/redux/giftcards/giftcards_api";
import { useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BuyGiftCardsData = () => {
  const { selectedCable } = useAppSelector((state) => state.beneficiary);
  const router = useRouter();
  const toast = useToast();
  const [cardDatas, setCardDatas] = React.useState<any>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [showCountryModal, setShowCountryModal] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState({} as any);
  const [searchText, setSearchText] = React.useState("");
  const [formData, setFormData] = React.useState({
    country: "US",
    country_code: "",
    flag: "🇺🇸",
  });
  const { isDark } = useTheme();
  const isMobile = Platform.OS === "ios" ? false : true;

  const getFirstChar = (text: string) => {
    return text.charAt(0).toUpperCase();
  };

  console.log("Selected Country", selectedCountry);

  const [getAllGiftCards, { isLoading }] = useGetAllGiftCardsMutation();

  const getCardData = React.useCallback(
    async (isRefresh = false) => {
      const atex = await TokenManager.getToken();
      if (!atex) {
        router.replace(paths.auth.login);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      }

      try {
        const response: any = await getAllGiftCards({
          data: {
            token: atex,
            country_letter: selectedCountry?.code || "US",
          },
        }).unwrap();
        console.log("Response", response);
        const data = response?.data || response;
        if (Array.isArray(data)) {
          setCardDatas(data);
        } else {
          console.error("API returned non-array data:", data);
          setCardDatas([]);
        }
      } catch (error) {
        toast.showToast(`An error occurred. Please try again.`, "error");
        console.error("Error fetching cable data:", error);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        }
      }
    },
    [getAllGiftCards, selectedCountry?.code, router, toast],
  );

  React.useEffect(() => {
    getCardData();
  }, [selectedCountry?.code]);

  const onRefresh = React.useCallback(() => {
    getCardData(true);
  }, [getCardData]);

  // Filter cable data based on search
  const filteredCardData = React.useMemo(() => {
    if (!Array.isArray(cardDatas)) return [];
    if (search === "") return cardDatas;

    return cardDatas.filter((card: any) =>
      card.productName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [cardDatas, search]);

  const handleChangeSearch = (text: string) => {
    setSearch(text);
  };

  const rendercableList = (card: any) => (
    <Pressable
      onPress={() => {
        router.replace({
          pathname: paths.giftcards.buyGiftCards,
          params: {
            name: card.productName,
            id: card.productId,
            countryCode: selectedCountry?.code || formData?.country,
            image: card?.logoUrls[0] || null,
            denomType: card?.denominationType, // either "FIXED" or "RANGE"
            exchangeRate: card?.exchangeRate,
            // In BuyGiftCardsData.tsx - when navigating
            fixedRecipientDenominations: JSON.stringify(
              card?.fixedRecipientDenominations || [],
            ),
            country: selectedCountry?.name || formData?.country,
          },
        });
      }}
      className={`flex-row items-center border py-3 mt-2 rounded-[20px] px-3 border-border-light dark:border-border-dark justify-between  ${selectedCable?.id === card?.productId ? "bg-primary-500" : "bg-light-150 dark:bg-dark-700"}`}
    >
      <View className="flex-row items-center gap-2">
        {card?.logoUrls[0] ? (
          <Image
            source={{
              uri: card?.logoUrls[0].startsWith("http")
                ? card?.logoUrls[0]
                : ``,
            }}
            style={{ width: 32, height: 32 }}
            className="rounded-full"
          />
        ) : (
          <>
            <ThemedText className="bg-white dark:bg-dark-500 w-8 h-8 text-center leading-8 rounded-full text-xs">
              {getFirstChar(card?.productName || "C")}
            </ThemedText>
          </>
        )}
        <ThemedText
          family="primary"
          variant="primary"
          weight="medium"
          className="text-b2  flex-shrink flex-wrap"
          style={{ flex: 1, flexWrap: "wrap" }}
        >
          {card?.productName}
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <>
      <SettingsHeader title="Buy Gift Card" />
      <ThemedView
        className={`flex-1 ${Platform.OS === "ios" ? "" : ""}   px-[24px]`}
        style={{
          height: "100%",
        }}
      >

        <SafeAreaView className="flex-1" edges={["bottom"]}>
          {/* Search and Country section */}
          <View className="pt-[25px]  flex-row items-center gap-2">
            <View
              className="flex-1 flex-row items-center gap-3 px-4  rounded-[20px] bg-light-150 dark:bg-dark-900 border border-border-light dark:border-border-dark"
            >
              <Search size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
              <TextInput
                placeholder="Search gift card"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={search}
                onChangeText={(text) => handleChangeSearch(text)}
                className="flex-1 py-3 text-base font-primary-medium"
                style={{ color: isDark ? "#FFFFFF" : "#000000" }}
              />
            </View>
            <Pressable
              onPress={() => setShowCountryModal(true)}
              className="bg-light-150 dark:bg-dark-900 px-3 py-3 rounded-[20px] border border-border-light dark:border-border-dark flex-row items-center gap-1 min-w-[70px] justify-center"
            >
              <CountryFlag flag={selectedCountry?.flag || formData?.flag} size={16} />
              <ThemedText
                family="primary"
                variant="primary"
                weight="medium"
                className="text-b3"
              >
                {selectedCountry.code || formData?.country}
              </ThemedText>
            </Pressable>
          </View>
          {/* list section */}
          {/* <View className="h-[1px] bg-light-300 dark:bg-dark-600 w-full mt-6"></View> */}
          {isLoading ? (
            <ActivityIndicator size="large" className="mt-10" />
          ) : (
            <FlatList
              data={cardDatas ? filteredCardData : cardDatas}
              keyExtractor={(item, index) =>
                item?.productId || index.toString()
              }
              ListEmptyComponent={() => (
                <ThemedText
                  family="primary"
                  variant="primary"
                  weight="medium"
                  className="text-b2 text-center mt-16"
                >
                  {search
                    ? "No gift card matches your search"
                    : "No gift card found"}
                </ThemedText>
              )}
              renderItem={({ item }) => rendercableList(item as any)}
              className="mt-2 "
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </SafeAreaView>
      </ThemedView>

      {showCountryModal && (
        <>
          <CountryModal
            visible={showCountryModal}
            setVisible={setShowCountryModal}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            searchText={searchText}
            setSearchText={setSearchText}
            handleChange={(value: string) => {
              setShowCountryModal(false);
              setFormData((prev) => ({
                ...prev,
                country: value,
                flag: selectedCountry?.flag,
              }));
            }}
          />
        </>
      )}
    </>
  );
};

export default BuyGiftCardsData;
