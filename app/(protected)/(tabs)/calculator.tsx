import CryptoModal from "@/components/modals/cryptomodal";
import CurrencyModal from "@/components/modals/currencymodal";
import GiftCardTypeModal from "@/components/modals/GiftCardTypeModal";
import SellGiftCardsDataModal from "@/components/modals/sellGiftCardsDataModal";
import GiftCardSubCategoryModal from "@/components/modals/sellGiftcardSubcategorymodal";
import { ThemedText } from "@/components/theme/themeText";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { parseFlagAndName } from "@/utils/helper";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useGetCrptoNetworkQuery } from "@/redux/crypto/crypto_api";
import {
  useFindGiftCardTypeMutation,
  useFindSubCategoryMutation,
  useFetchGiftCardRateMutation
} from "@/redux/giftcards/giftcards_api";
import { formatNumber } from "@/utils/formatamount";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronDown } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "crypto" | "giftcard";

export type currencyProps = {
  currency: string;
  abbr: string;
  flag?: any;
};

export type formDataCryptoProps = {
  currency: string;
  crypto: string;
  amount: string;
  sign: string;
  image: string;
};


const Calculator = () => {
  const { isDark } = useTheme();
  const toast = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = React.useState<TabType>("crypto");

  // Crypto state
  const [isOpenCryptoModal, setIsOpenCryptoModal] = React.useState(false);
  const [isOpenCurrencyModal, setIsOpenCurrencyModal] = React.useState(false);
  const [currencyData, setCurrencyData] = React.useState<currencyProps>({
    currency: "US Dollars",
    abbr: "USD",
    flag: img.USA,
  });
  const [formDataCrpto, setFormDataCrpto] = React.useState<formDataCryptoProps>({
    currency: "",
    crypto: "",
    amount: "",
    sign: "",
    image: "",
  });

  // Gift Card state
  const [showDataModal, setShowDataModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showCardTypeModal, setShowCardTypeModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<any>(null);
  const [selectedCardType, setSelectedCardType] = useState<any>(null);
  const [cardTypes, setCardTypes] = useState<any[]>([]);
  const [nairaaaRate, setNairaRate] = useState<number>(0);

  const [formDataGiftCards, setFormDataGiftCards] = useState({
    amount: "",
    quantity: 1,
  });

  const [fetchedRateResponse, setFetchedRateResponse] = useState<any>(null);
  const [rate, setRate] = useState<any>({});

  const [findSubCategory, { isLoading: isFindingSubCategory }] = useFindSubCategoryMutation();
  const [findGiftCardType, { isLoading: isFetchingCardTypes }] = useFindGiftCardTypeMutation();
  const [fetchGiftCardRate, { isLoading: isFetchingRate }] = useFetchGiftCardRateMutation();
  const { data: cryptoData } = useGetCrptoNetworkQuery({});

  // Reset state when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Logic for when the screen is focused
      return () => {
        // Logic for when the screen is blurred (leaving the screen)
        setActiveTab("crypto");
        setCurrencyData({ currency: "US Dollars", abbr: "USD", flag: img.USA });
        setFormDataCrpto({ currency: "", crypto: "", amount: "", sign: "", image: "" });
        setSelectedCategory(null);
        setSelectedSubCategory(null);
        setSelectedCardType(null);
        setCardTypes([]);
        setFormDataGiftCards({ amount: "", quantity: 1 });
        setFetchedRateResponse(null);
        setRate({});
      };
    }, [])
  );

  const handleChangeTab = (tab: TabType) => {
    setActiveTab(tab);
  };

  const getCardTypes = async () => {
    if (!selectedSubCategory?.subcategory_id) return;
    try {
      const token = await TokenManager.getToken();
      const response = await findGiftCardType({
        data: {
          token: token,
          sub_category: selectedSubCategory.subcategory_id.toString(),
        },
      }).unwrap();

      if (response.status === "success") {
        setCardTypes(response.type || []);
      }
    } catch (error) {
      console.log("Error fetching card types:", error);
    }
  };

  useEffect(() => {
    getCardTypes();
  }, [selectedSubCategory]);

  const handleChangeCrypto = (field: keyof formDataCryptoProps, value: string, image?: string) => {
    setFormDataCrpto((prev) => ({
      ...prev,
      [field]: value,
      image: image ?? prev.image,
    }));
  };



  const handleFetchRate = async () => {
    if (!formDataGiftCards.amount || formDataGiftCards.quantity < 1 || !selectedCardType?.type_id) {
      toast.showToast("Please enter amount, quantity and select a card type", "error");
      return;
    }
    const rawAmount = formDataGiftCards.amount.replace(/,/g, '');
    try {
      const token = await TokenManager.getToken();
      const res = await fetchGiftCardRate({
        data: {
          token: token,
          type_id: selectedCardType.type_id,
          amount: rawAmount,
          quantity: formDataGiftCards.quantity,
        },
      }).unwrap();
      if (res.status === "success") {
        setFetchedRateResponse(res.data);
        setRate({ rate: res.data.rate, amt: res.data.amount });
        toast.showToast("Rate fetched successfully", "success");
      } else {
        toast.showToast(res.message || "Failed to fetch rate", "error");
      }
    } catch (err: any) {
      console.log("Error fetching rate:", err);
      toast.showToast(err?.data?.message || err?.message || "Failed to fetch rate", "error");
    }
  };

  const calculateTotal = useMemo(() => {
    if (activeTab === "giftcard") {
      const rawAmount = formDataGiftCards.amount.replace(/,/g, '');
      const amount = parseFloat(rawAmount) || 0;
      const rateNaira = parseFloat(fetchedRateResponse?.rate) || 0;
      return amount * rateNaira * formDataGiftCards.quantity;
    }
    const rawAmount = formDataCrpto.amount.replace(/,/g, '');
    const amount = parseFloat(rawAmount) || 0;
    // For crypto tab, we always calculate the total in Naira based on the rate
    if (activeTab === "crypto") {
      return amount * nairaaaRate;
    }
    return amount;
  }, [activeTab, formDataGiftCards.amount, formDataGiftCards.quantity, selectedCardType?.rate, selectedSubCategory?.rate, formDataCrpto.amount, nairaaaRate, fetchedRateResponse]);


  useEffect(() => {
    console.log('cryptoData full structure:', JSON.stringify(cryptoData, null, 2));
    // Reverting to the original path which was likely correct
    const rate = cryptoData?.all_addresses?.naira_rate || 0;
    console.log('Extracted rate:', rate);
    setNairaRate(rate);
  }, [cryptoData]);

  return (
    <ThemedView className="flex-1 dark:!bg-[#0C0C0C]">
      <SafeAreaView
        className={`flex-1 ${Platform.OS === "ios" ? "" : "pt-4"}`}
        edges={["top"]}
      >
        <View
          className={`flex-row ${Platform.OS === "ios" ? "mt-7" : "mt-0"} px-[24px] pb-2 items-center border-b border-light-100 dark:border-dark-600 justify-between`}
        >
          <ThemedText
            family="primary"
            weight="bold"
            style={{ fontSize: 24 }}
            className="text-h7 font-bold"
          >
            Calculator
          </ThemedText>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
            paddingTop: 8,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-2 dark:bg-[#111111] bg-[#FFFFFF] rounded-[30px] border-[#EFEFEF] dark:border-[#232323] border-[1px] overflow-hidden">
            {/* tabs */}
            <View className="flex-row items-center justify-between mx-1 mb-2 bg-[#F8F8F8] dark:bg-[#0C0C0C] rounded-[20px] p-1">
              <Pressable
                onPress={() => handleChangeTab("crypto")}
                className={`flex-1 items-center justify-center rounded-[16px] p-[14px] ${activeTab === "crypto" ? "border-none bg-[#FFFFFF] dark:bg-[#111111]" : "bg-transparent"} !border-none `}
              >
                <ThemedText
                  family="primary"
                  weight="regular"
                  className={`text-[14px] ${activeTab === "crypto" ? "!text-primary-500" : ""}`}
                >
                  Crypto
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => handleChangeTab("giftcard")}
                className={`flex-1 items-center justify-center rounded-[16px] p-[14px] ${activeTab === "giftcard" ? "border-none bg-[#FFFFFF] dark:bg-[#111111]" : "bg-transparent"} !border-none `}
              >
                <ThemedText
                  family="primary"
                  weight="regular"
                  className={`text-[14px] ${activeTab === "giftcard" ? "!text-primary-500" : ""}`}
                >
                  Gift card
                </ThemedText>
              </Pressable>
            </View>

            <View className="px-2 pb-4">
              {/* Gift card section */}
              {activeTab === "giftcard" && (
                <View className="p-2">
                  {/* Category Selection */}
                  <Pressable
                    onPress={() => setShowDataModal(true)}
                    className="w-full flex-row justify-between items-center dark:bg-black rounded-[20px] bg-[#FCFCFC] border border-light-200 dark:border-dark-400 px-3 py-4 mb-4"
                  >
                    <View className="flex-row gap-3 items-center flex-1 mr-2">
                      {selectedCategory?.image ? (
                        <Image
                          source={typeof selectedCategory.image === "string" ? { uri: selectedCategory.image } : selectedCategory.image}
                          style={{ width: 32, height: 32 }}
                          className="rounded-full bg-gray-200"
                        />
                      ) : null}
                      <ThemedText family="primary" weight="regular" className="text-b2">
                        {selectedCategory?.name || "Select category"}
                      </ThemedText>
                    </View>
                    <ChevronDown size={20} color={isDark ? "#B4B4B4" : "#1E1E1E"} />
                  </Pressable>

                  {/* Country/Sub-category Selection */}
                  <Pressable
                    onPress={() => {
                      if (!selectedCategory) {
                        toast.showToast("Please select a category first", "error");
                        return;
                      }
                      setShowSubCategoryModal(true);
                    }}
                    className="w-full flex-row justify-between items-center dark:bg-black rounded-[20px] bg-[#FCFCFC] border border-light-200 dark:border-dark-400 px-3 py-4 mb-4"
                  >
                    <View className="flex-row gap-3 items-center flex-1 mr-2">
                      {(() => {
                        if (!selectedSubCategory?.country) {
                          return (
                            <ThemedText family="primary" variant="secondary" weight="regular" className="text-b2">
                              Select Country
                            </ThemedText>
                          );
                        }
                        const { flag, name: countryName } = parseFlagAndName(selectedSubCategory.country);
                        return (
                          <View className="flex-row items-center gap-1.5 flex-1">
                            {flag ? <CountryFlag flag={flag} size={16} /> : null}
                            <ThemedText family="primary" variant="primary" weight="regular" className="text-b2">
                              {countryName}
                            </ThemedText>
                          </View>
                        );
                      })()}
                    </View>
                    <ChevronDown size={20} color={isDark ? "#B4B4B4" : "#1E1E1E"} />
                  </Pressable>

                  {/* Card Type Selection */}
                  <Pressable
                    onPress={() => {
                      if (!selectedSubCategory) {
                        toast.showToast("Please select a country first", "error");
                        return;
                      }
                      setShowCardTypeModal(true);
                    }}
                    className="w-full flex-row justify-between items-center dark:bg-black rounded-[20px] bg-[#FCFCFC] border border-light-200 dark:border-dark-400 px-3 py-4 mb-4"
                  >
                    <View className="flex-row gap-3 items-center flex-1 mr-2">
                      {selectedCardType?.type_image ? (
                        <Image
                          source={{ uri: selectedCardType.type_image }}
                          style={{ width: 32, height: 32 }}
                          className="rounded-full bg-gray-200"
                        />
                      ) : null}
                      <View className="flex-col flex-1">
                        <ThemedText family="primary" weight="regular" className="text-b2">
                          {selectedCardType?.type || "Select card type"}
                        </ThemedText>
                        {selectedCardType?.type_description ? (
                          <ThemedText family="primary" variant="secondary" className="text-b3 mt-0.5">
                            {selectedCardType.type_description}
                          </ThemedText>
                        ) : null}
                      </View>
                    </View>
                    <ChevronDown size={20} color={isDark ? "#B4B4B4" : "#1E1E1E"} />
                  </Pressable>

                  {/* Amount Input */}
                  <Input
                    className="w-full mb-4 !bg-[#FCFCFC] dark:!bg-black border border-light-200 dark:border-dark-400 rounded-[20px] px-3"
                    placeholder="Enter amount"
                    keyboardType="numeric"
                    value={formDataGiftCards.amount}
                    leadingIcon={
                      <ThemedText family="primary" weight="bold" className="text-b1 pt-[5px] ml-1">$</ThemedText>
                    }
                    onChangeText={(text) => {
                      // Allow only numbers and one decimal point
                      const cleanText = text.replace(/[^0-9.]/g, '');
                      const parts = cleanText.split('.');

                      // Format integer part with commas
                      const integerPart = parts[0];
                      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

                      let finalValue = formattedInteger;
                      if (parts.length > 1) {
                        finalValue += "." + parts.slice(1).join('').substring(0, 8); // Allow decimals
                      }

                      setFormDataGiftCards(prev => ({ ...prev, amount: finalValue }));
                      setFetchedRateResponse(null);
                      setRate({});
                    }}
                  />

                  {/* Quantity selector */}
                  <View className="flex-row items-center gap-4 justify-between mb-4">
                    <Pressable
                      onPress={() => setFormDataGiftCards(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                      className="items-center justify-center h-14 flex-1 bg-[#F5F5F5] dark:bg-[#232323] rounded-[20px]"
                    >
                      <ThemedText family="primary" weight="bold" className="text-xl">-</ThemedText>
                    </Pressable>
                    <View className="bg-background-light dark:bg-dark-900 flex-1 h-14 items-center justify-center border border-border-light dark:border-border-dark rounded-[20px]">
                      <ThemedText family="primary" weight="bold" className="text-lg text-center">
                        {formDataGiftCards.quantity}
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => setFormDataGiftCards(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                      className="items-center justify-center h-14 bg-[#F5F5F5] dark:bg-[#232323] flex-1 rounded-[20px]"
                    >
                      <ThemedText family="primary" weight="bold" className="text-xl">+</ThemedText>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={handleFetchRate}
                    disabled={isFetchingRate}
                    className={`mb-4 py-3 rounded-[20px] items-center border border-primary-500 bg-primary-50 dark:bg-primary-900/20 ${isFetchingRate ? 'opacity-70' : ''}`}
                  >
                    {isFetchingRate ? (
                      <ActivityIndicator size="small" color={colorThemes[app_config.theme][500]} />
                    ) : (
                      <ThemedText family="primary" weight="medium" className="text-primary-500">
                        See Rate
                      </ThemedText>
                    )}
                  </Pressable>

                  {/* rate / receive */}
                  <View className="w-full bg-[#F9FFF8] dark:bg-[#171717] border border-light-200 dark:border-dark-400 rounded-[20px] px-3 py-4">
                    <View className="items-center justify-center mb-2">
                      <ThemedText family="primary" weight="regular" className="text-[14px] text-text-secondary-light dark:text-text-secondary-dark">
                        You’ll receive in total
                      </ThemedText>
                      <ThemedText family="primary" weight="bold" className="text-[28px] text-text-secondary-light py-1 dark:text-[#fff]">
                        ₦{formatNumber(Number(calculateTotal.toFixed(2))) || "0.00"}
                      </ThemedText>
                    </View>
                    <View className="flex-row items-center justify-center">
                      <ThemedText family="primary" weight="regular" className="text-[12px] text-text-secondary-light dark:text-text-secondary-dark">
                        Rate: $1 ~ ₦{formatNumber(Number(fetchedRateResponse?.rate || "0")) || "0.00"}
                      </ThemedText>
                    </View>
                  </View>

                  <Button
                    variant="primary"
                    className={`w-full mt-6 ${(!selectedCategory || !selectedSubCategory || !selectedCardType || !formDataGiftCards.amount) ? 'opacity-50' : ''}`}
                    onPress={() => {
                      router.push({
                        pathname: paths.giftcards.sellGiftCards as any,
                        params: {
                          categoryId: selectedCategory?.id,
                          categoryName: selectedCategory?.name,
                          categoryImage: selectedCategory?.image,
                          countriesList: JSON.stringify(selectedCategory?.countries || []),
                        }
                      });
                    }}
                    disabled={!selectedCategory || !selectedSubCategory || !selectedCardType || !formDataGiftCards.amount}
                  >
                    Sell Gift card
                  </Button>
                </View>
              )}

              {/* Crypto section */}
              {activeTab === "crypto" && (
                <View className="p-2">
                  <Pressable
                    onPress={() => setIsOpenCryptoModal(true)}
                    className="w-full flex-row justify-between items-center dark:bg-black rounded-[20px] bg-[#FCFCFC] dark:bg-black-900 border border-light-200 dark:border-dark-400 px-3 py-4 mb-4"
                  >
                    <View className="flex-row gap-3 items-center">
                      {formDataCrpto.image ? (
                        <Image
                          source={{ uri: formDataCrpto.image }}
                          style={{ width: 32, height: 32, borderRadius: 16 }}
                        />
                      ) : null}
                      <ThemedText family="primary" weight="regular" className="text-b2">
                        {formDataCrpto.crypto || "Select crypto"}
                      </ThemedText>
                    </View>
                    <ChevronDown size={20} color={isDark ? "#B4B4B4" : "#1E1E1E"} />
                  </Pressable>

                  <Pressable
                    onPress={() => setIsOpenCurrencyModal(true)}
                    className="w-full flex-row justify-between items-center dark:bg-black rounded-[20px] bg-white dark:bg-black-900 border border-light-200 dark:border-dark-400 px-3 py-4 mb-4"
                  >
                    <View className="flex-row items-center gap-3">
                      {/* {currencyData.flag ? (
                        <View className="w-8 h-8 rounded-full items-center justify-center bg-light-200 dark:bg-dark-500">
                          <currencyData.flag width={20} height={20} />
                        </View>
                      ) : null} */}
                      <ThemedText family="primary" weight="regular" className="text-b2">
                        {currencyData.abbr || "Select currency"}
                      </ThemedText>
                    </View>
                    <ChevronDown size={24} color={isDark ? "#B4B4B4" : "#1E1E1E"} />
                  </Pressable>

                  <Input
                    className="w-full mb-4 !bg-[#FCFCFC] dark:!bg-black border border-light-200 dark:border-dark-400 rounded-[20px] px-3"
                    placeholder="Enter amount"
                    keyboardType="numeric"
                    value={formDataCrpto.amount}
                    leadingIcon={
                      <ThemedText family="primary" weight="bold" className="text-b1 pt-[3px] ml-1">{currencyData.abbr === "USD" ? "$" : "₦"}</ThemedText>
                    }
                    onChangeText={(text) => {
                      // Allow only numbers and one decimal point
                      const cleanText = text.replace(/[^0-9.]/g, '');
                      const parts = cleanText.split('.');

                      // Format integer part with commas
                      const integerPart = parts[0];
                      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

                      let finalValue = formattedInteger;
                      if (parts.length > 1) {
                        finalValue += "." + parts.slice(1).join('').substring(0, 8); // Allow decimals
                      }

                      setFormDataCrpto(prev => ({ ...prev, amount: finalValue }));
                    }}
                  />

                  <View className="w-full bg-[#F9FFF8] dark:bg-[#171717] border border-light-200 dark:border-dark-400 rounded-[20px] px-3 py-4">
                    <View className="items-center justify-center mb-2">
                      <ThemedText family="primary" weight="regular" className="text-[14px] text-text-secondary-light dark:text-text-secondary-dark">
                        You’ll receive in total
                      </ThemedText>
                      <ThemedText family="primary" weight="bold" className="text-[28px] text-text-secondary-light py-1 dark:text-[#fff]">
                        ₦{formatNumber(Number(calculateTotal.toFixed(2))) || "0.00"}
                      </ThemedText>
                    </View>
                    <View className="flex-row items-center justify-center">
                      <ThemedText family="primary" weight="regular" className="text-[12px] text-text-secondary-light dark:text-text-secondary-dark">
                        Rate: $1 ~ ₦{formatNumber(nairaaaRate)}
                      </ThemedText>
                    </View>
                  </View>

                  <Button
                    variant="primary"
                    className={`w-full mt-6 ${(!formDataCrpto.crypto || !currencyData.abbr || !formDataCrpto.amount) ? 'opacity-50' : ''}`}
                    onPress={() => router.push({
                      pathname: paths.crypto.sellCrypto as any,
                      params: {
                        symbol: formDataCrpto.sign,
                        cryptoName: formDataCrpto.crypto,
                        cryptoImage: formDataCrpto.image,
                      }
                    })}
                    disabled={!formDataCrpto.crypto || !currencyData.abbr || !formDataCrpto.amount}
                  >
                    Deposit Now
                  </Button>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Modals */}
        <CryptoModal
          visible={isOpenCryptoModal}
          setVisible={setIsOpenCryptoModal}
          formData={formDataCrpto}
          handleChange={handleChangeCrypto}
        />

        <CurrencyModal
          visible={isOpenCurrencyModal}
          setVisible={setIsOpenCurrencyModal}
          setCurrencyData={setCurrencyData}
          currencyData={currencyData}
        />

        <SellGiftCardsDataModal
          visible={showDataModal}
          onClose={() => setShowDataModal(false)}
          onSelect={(item) => {
            setSelectedCategory(item);
            setSelectedSubCategory(null);
            setSelectedCardType(null);
            setCardTypes([]);
            setFetchedRateResponse(null);
            setRate({});
          }}
          selectedId={selectedCategory?.id}
        />

        <GiftCardSubCategoryModal
          visible={showSubCategoryModal}
          setVisible={setShowSubCategoryModal}
          selectedSubCategory={selectedSubCategory?.country}
          handleChange={(item) => {
            setSelectedSubCategory(item);
            setSelectedCardType(null);
            setFetchedRateResponse(null);
            setRate({});
          }}
          data={selectedCategory?.countries || []}
          isFindingSubCategory={isFindingSubCategory}
          searchGiftcards=""
          setSearchGiftCards={() => { }}
          image={selectedCategory?.image}
        />

        <GiftCardTypeModal
          visible={showCardTypeModal}
          setVisible={setShowCardTypeModal}
          selectedCardType={selectedCardType}
          onSelect={(item) => {
            setSelectedCardType(item);
            setFetchedRateResponse(null);
            setRate({});
          }}
          data={selectedSubCategory?.types || cardTypes}
          isLoading={isFetchingCardTypes}
          subcategoryName={selectedSubCategory?.country || ""}
        />
      </SafeAreaView>
    </ThemedView>
  );
};

export default Calculator
