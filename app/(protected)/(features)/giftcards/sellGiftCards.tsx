import { SettingsHeader } from "@/components/customs/settingsHeader";
import CountryModal from "@/components/modals/country";
import GiftCardTypeModal from "@/components/modals/GiftCardTypeModal";
import PayAttentionModal from "@/components/modals/PayAttentionModal";
import PaySellGiftCardsModal from "@/components/modals/paySellGiftcardsmodal";
import SellGiftCardsDataModal from "@/components/modals/sellGiftCardsDataModal";
import GiftCardSubCategoryModal from "@/components/modals/sellGiftcardSubcategorymodal";
import SellGiftCardSuccessModal from "@/components/modals/SellGiftCardSuccessModal";
import { getCountryByCode } from "@/components/phone_dial_contries";
import { ThemedText } from "@/components/theme/themeText";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { parseFlagAndName } from "@/utils/helper";
import { ThemedView } from "@/components/theme/themeView";
import { Input, Textarea } from "@/components/ui/form-fields";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";

import {
  useFetchGiftCardRateMutation,
  useFindGiftCardTypeMutation,
  useFindSubCategoryMutation,
  useTradeGiftCardMutation,
} from "@/redux/giftcards/giftcards_api";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import { formatNumber } from "@/utils/formatamount";
import { requestPermissions } from "@/utils/img";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, CircleAlertIcon, Upload } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const amountt = ["20", "50", "100", "150", "200"];

// Add validation schema
const giftCardSchema = z.object({
  amount: z.string().min(1, "Card value is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  // subCategory: z.string().min(1, "Sub-category is required"),
  country: z.string().min(1, "Country is required"),
});

const SellGiftCards = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const isMobile = Platform.OS === "ios" ? false : true;
  const toast = useToast();
  const params = useLocalSearchParams();

  // Modals state
  const [showPayGcModal, setShowPayGcModal] = React.useState(false);
  const [showCountryModal, setShowCountryModal] = React.useState(false);
  const [showGiftCardSubCategoryModal, setShowGiftCardSubCategoryModal] = React.useState(false);
  const [showDataModal, setShowDataModal] = React.useState(false);
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showAttentionModal, setShowAttentionModal] = React.useState(false);
  const [showCardTypeModal, setShowCardTypeModal] = React.useState(false);

  // Image Viewing state
  const [visible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Data state
  const [selectedCategory, setSelectedCategory] = React.useState<any>(null);

  const [selectedCountry, setSelectedCountry] = React.useState<any>(null);
  const [selectedSubCategory, setSelectedSubCategory] = React.useState<any>(null);
  const [selectedCardType, setSelectedCardType] = React.useState<any>(null);

  const [formData, setFormData] = React.useState({
    referral: "",
    amount: "",
    country: "",
    note: "",
    quantity: 1,
    subCategory: "",
    speed: "",
    planType: "physical",
    cardType: "",
    type_id: "",
  });

  console.log("formData", formData);


  const [selectedImages, setSelectedImages] = useState<any>([]);
  const maxLength = 4;
  const [rate, setRate] = React.useState<any>({});
  const [pin, setPin] = React.useState<string>("");

  // Sub-category data
  const [data, setData] = React.useState<any>({});
  const [limit, setLimit] = React.useState(20);
  const [page, setPage] = React.useState(1);
  const [searchGiftcards, setSearchGiftCards] = React.useState("");
  const [countrySearch, setCountrySearch] = React.useState("");

  // Success data
  const [successData, setSuccessData] = React.useState<any>({
    amount: "",
    recipientEmail: "",
    transId: "",
    cardName: "",
    cardImage: "",
    country: "",
    rate: "",
    settlementAmount: 0,
    quantity: 1,
    type: "",
    formDataAmount: "",
  });


  const [tradeGiftCard, { isLoading }] = useTradeGiftCardMutation();
  const [findSubCategory, { isLoading: isFindingSubCategory }] = useFindSubCategoryMutation();
  const [findGiftCardType, { isLoading: isFetchingCardTypes }] = useFindGiftCardTypeMutation();
  const [fetchGiftCardRate, { isLoading: isFetchingRate }] = useFetchGiftCardRateMutation();
  const [cardTypes, setCardTypes] = React.useState<any[]>([]);
  const [fetchedRateResponse, setFetchedRateResponse] = React.useState<any>(null);



  React.useEffect(() => {
    if (params?.categoryName && !selectedCategory) {
      let parsedCountries = [];
      try {
        parsedCountries = params?.countriesList ? JSON.parse(params.countriesList as string) : [];
      } catch (e) {
        parsedCountries = [];
      }

      setSelectedCategory({
        name: params.categoryName as string,
        image: params.categoryImage as string,
        id: params.categoryId as string,
        countries: parsedCountries,
      });
    }
  }, [params?.categoryName, params?.categoryImage, params?.categoryId, params?.countriesList]);

  const resetForm = () => {
    setFormData({
      referral: "",
      amount: "",
      country: "",
      note: "",
      quantity: 1,
      subCategory: "",
      speed: "",
      planType: "physical",
      cardType: "",
      type_id: "",
    });
    setSelectedImages([]);
    setSelectedCategory(null);
    setSelectedCountry(null);
    setSelectedSubCategory(null);
    setSelectedCardType(null);
    setPin("");
    setRate({});
    setFetchedRateResponse(null);
  };

  const validateForm = () => {
    try {
      const formDataToValidate = {
        amount: formData.amount,
        quantity: formData.quantity,
        // subCategory: selectedSubCategory?.subcategory || "",
        country: selectedSubCategory?.country || formData.country,
      };

      giftCardSchema.parse(formDataToValidate);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err: any) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        return { isValid: false, errors };
      }
      return { isValid: false, errors: {} };
    }
  };

  console.log("fetchedRateResponse", fetchedRateResponse);


  const buttonCheck = () => {
    // Check if category is selected
    if (!selectedCategory) {
      toast.showToast("Please select a gift card category", "error");
      return;
    }

    const { isValid, errors } = validateForm();

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast.showToast(firstError, "error");
      }
      return;
    }

    // const amountVal = parseFloat(formData.amount);
    // if (selectedCardType?.min_amount && amountVal < parseFloat(selectedCardType.min_amount)) {
    //   toast.showToast(`Minimum amount allowed is $${selectedCardType.min_amount}`, "error");
    //   return;
    // }
    // if (selectedCardType?.max_amount && amountVal > parseFloat(selectedCardType.max_amount)) {
    //   toast.showToast(`Maximum amount allowed is $${selectedCardType.max_amount}`, "error");
    //   return;
    // }

    if (!selectedSubCategory) {
      toast.showToast("Please select a sub-category", "error");
      return;
    }

    if (selectedImages.length === 0) {
      toast.showToast("Please select at least one image of the gift card", "error");
      return;
    }

    // const currentRate = fetchedRateResponse?.rate || selectedSubCategory?.rate || selectedCardType?.rate || rate.rate;
    const isCreateYourGiftcardOrder = selectedCategory?.name === "Create Your Giftcard Order";
    const currentRate = isCreateYourGiftcardOrder ? "0" : fetchedRateResponse?.rate;
    if (!currentRate) {
      toast.showToast("Rate information is missing", "error");
      return;
    }

    setShowPayGcModal(true);
  };

  const getSubCategory = async () => {
    /*
    if (!selectedCategory?.name) return;

    try {
      const atex = await TokenManager.getToken();
      const response = await findSubCategory({
        data: {
          token: atex,
          name: selectedCategory?.name,
          per_page: limit,
          page: page,
          search: searchGiftcards,
        },
      }).unwrap();

      if (response.status === "success") {
        setData(response);
      }
    } catch (error) {
      console.log("Error fetching sub-category:", error);
    }
    */
  };

  React.useEffect(() => {
    getSubCategory();
  }, [selectedCategory, searchGiftcards, page, limit]);

  const getCardTypes = async () => {
    /*
    if (!selectedSubCategory?.subcategory_id) return;
    try {
      const atex = await TokenManager.getToken();
      const response = await findGiftCardType({
        data: {
          token: atex,
          sub_category: selectedSubCategory.subcategory_id.toString(),
        },
      }).unwrap();

      if (response.status === "success") {
        setCardTypes(response.type || []);
      }
    } catch (error) {
      console.log("Error fetching card types:", error);
    }
    */
  };

  React.useEffect(() => {
    getCardTypes();
  }, [selectedSubCategory]);

  const handleTradeGiftCard = async () => {
    const atex = await TokenManager.getToken();
    try {
      const form = new FormData();

      form.append("token", atex ?? "");
      form.append("category", selectedCategory?.name || "");
      // form.append("sub_category", selectedSubCategory?.subcategory || formData.subCategory);
      form.append("card_form", selectedCardType?.type || formData.planType);
      // form.append("speed", formData.speed);
      form.append("country", selectedSubCategory?.country || formData.country);
      form.append("referral_code", formData.referral);
      form.append("quantity", formData.quantity.toString());
      form.append("card_amount", formData.amount || "");
      const isCreateYourGiftcardOrder = selectedCategory?.name === "Create Your Giftcard Order";
      // form.append("rate", String(fetchedRateResponse?.rate || selectedSubCategory?.rate || selectedCardType?.rate || rate.rate || ""));
      form.append("rate", String(isCreateYourGiftcardOrder ? "0" : (fetchedRateResponse?.rate || "")));
      form.append("comment", formData.note || "");
      form.append("type_id", String(formData.type_id || ""));

      selectedImages.forEach((image: any) => {
        form.append("files[]", {
          uri: Platform.OS === "android" && !image.uri.startsWith("file://") ? `file://${image.uri}` : image.uri,
          name: image.fileName || `image_${Date.now()}.jpg`,
          type: image.mimeType || image.type || "image/jpeg",
        } as any);
      });
      // console.log("Trade gift card form:", form);
      const response = await tradeGiftCard({
        data: form,
      }).unwrap();

      setShowPayGcModal(false);

      // Pass empty string for recipientEmail as it's a sell transaction (to us)
      // Or we could pass User's email if we wanted to show it
      setSuccessData({
        amount: calculateTotal.toString(),
        recipientEmail: "",
        transId: response.transid,
        cardName: selectedCategory?.name || "",
        cardImage: selectedCategory?.image,
        country: getCountryByCode(formData.country) ? `${getCountryByCode(formData.country)?.name} - ${formData.country}` : formData.country,
        formDataAmount: formData.amount || "0",
        rate: isCreateYourGiftcardOrder ? "0" : (selectedSubCategory?.rate || rate.rate || "0"),
        settlementAmount: calculateTotal,
        quantity: formData.quantity,
        type: formData.planType,
      });
      setShowSuccessModal(true);
      resetForm();

      console.log("Trade gift card response:", response);
    } catch (error: any) {
      console.log("Trade gift card error:", error);
      setShowPayGcModal(false);
      if (error?.status === "TIMEOUT_ERROR") {
        toast.showToast("Upload timed out. Please check your connection.", "error");
      } else {
        toast.showToast(
          `${error?.data?.message || error?.message || "Failed to trade gift card"}`,
          "error"
        );
      }
      setPin("");
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImages((prevImages: any) => {
          const existingFilenames = prevImages.map((img: any) => img.fileName);
          const newImages = result.assets.filter(
            (asset: any) => !existingFilenames.includes(asset.fileName)
          );

          const duplicateCount = result.assets.length - newImages.length;
          if (duplicateCount > 0) {
            Alert.alert("Duplicate Images", `${duplicateCount} image(s) skipped.`);
          }
          return [...prevImages, ...newImages];
        });
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages((prevImages: any) =>
      prevImages.filter((_: any, index: number) => index !== indexToRemove)
    );
  };

  const paywithoutPin = useCallback(async () => {
    await handleTradeGiftCard();
  }, [selectedCategory, selectedSubCategory, formData, rate, selectedImages]);

  const handleChangeAll = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key === "subCategory") {
      setSelectedSubCategory(value as string);
    }
    if (key === "amount" || key === "quantity" || key === "type_id") {
      if (selectedCategory?.name === "Create Your Giftcard Order") {
        setFetchedRateResponse({ rate: "0", amount: value || "0", estimated_payout: "0" });
        setRate({ rate: "0", amt: value || "0" });
      } else {
        setFetchedRateResponse(null);
      }
    }
    if (key === "amount") {
      if (selectedCategory?.name !== "Create Your Giftcard Order") {
        setRate({});
      }
    }
  };

  const calculateTotal = useMemo(() => {
    // if (fetchedRateResponse) {
    //   return Number(fetchedRateResponse.estimated_payout) || 0;
    // }
    const isCreateYourGiftcardOrder = selectedCategory?.name === "Create Your Giftcard Order";
    const amount = parseFloat(formData.amount) || 0;
    const rateNaira = isCreateYourGiftcardOrder ? 0 : (parseFloat(fetchedRateResponse?.rate) || 0);
    return amount * rateNaira * formData.quantity;
  }, [formData.amount, selectedCardType?.rate, rate.rate, formData.quantity, fetchedRateResponse, selectedCategory]);



  const handleFetchRate = async () => {
    if (selectedCategory?.name === "Create Your Giftcard Order") {
      setFetchedRateResponse({ rate: "0", amount: formData.amount || "0", estimated_payout: "0" });
      setRate({ rate: "0", amt: formData.amount || "0" });
      toast.showToast("Rate configured for manual order", "success");
      return;
    }
    if (!formData.amount || formData.quantity < 1 || !formData.type_id) {
      toast.showToast("Please enter amount, quantity and select a card type", "error");
      return;
    }
    console.log('rate called', formData)
    try {
      const atex = await TokenManager.getToken();
      const res = await fetchGiftCardRate({
        data: {
          token: atex,
          type_id: formData.type_id,
          amount: formData.amount,
          quantity: formData.quantity,
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

  const handleSelectGiftCard = (item: any) => {
    setSelectedCategory(item);
    // Reset dependent states
    setSelectedSubCategory(null);
    setSelectedCardType(null);
    setSelectedCountry(null);
    setFormData(prev => ({ ...prev, subCategory: "", country: "", amount: "", planType: "physical", speed: "", cardType: "", type_id: "" }));
    setRate({});
    setFetchedRateResponse(null);
  };

  return (
    <>
      <SettingsHeader title="Sell Gift Card" />
      {/* <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        className="bg-background-light dark:bg-background-dark"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 3}
      > */}
      <ThemedView className="flex-1">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 140, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={Platform.OS === "ios" ? 0 : 80}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
        >
          <View
            className="flex-1 bg-[#FFFFFF] dark:bg-[#111111] rounded-[20px] p-[8px] mt-4 border border-border-light dark:border-border-dark"
          >
            <View className="bg-[#FFFFFF] dark:bg-background-dark  rounded-[20px] p-[8px] border border-border-light dark:border-border-dark">
              <ThemedText>
                Card
              </ThemedText>
              {/* Category Selection */}
              <Pressable
                className="bg-background-light dark:bg-[#111111] border border-border-light dark:border-border-dark flex-row justify-between items-center rounded-[20px] p-3 mt-2"
                onPress={() => setShowDataModal(true)}
              >
                <View className="flex-row items-center gap-3 flex-1 mr-2">
                  {selectedCategory?.image ? (
                    <Image
                      source={typeof selectedCategory.image === "string" && selectedCategory.image.startsWith("http") ? { uri: selectedCategory.image } : selectedCategory.image}
                      style={{ width: 32, height: 32 }}
                      className="rounded-full bg-gray-200"
                    />
                  ) : (
                    // <View className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center">
                    //   <ThemedText className="text-primary-500 text-xs font-bold">
                    //     {getFirstChar(selectedCategory?.name || "G")}
                    //   </ThemedText>
                    // </View>
                    <></>
                  )}
                  <ThemedText family="primary" variant={selectedCategory?.name ? "primary" : "secondary"} weight="regular" className="text-b2">
                    {selectedCategory?.name || "Select category card"}
                  </ThemedText>
                </View>
                <ChevronRight size={20} color={isDark ? "white" : "#6B7280"} />
              </Pressable>

              {/* Sub-category Selection
                    <Pressable
                      className="bg-background-light dark:bg-[#111111] border border-border-light dark:border-border-dark flex-row justify-between items-center rounded-[20px] p-3 mt-2"
                      onPress={() => {
                        if (!selectedCategory) {
                          toast.showToast("Please select a category first", "error");
                          return;
                        }
                        setShowGiftCardSubCategoryModal(true);
                      }}
                    >
                      <View className="flex-row items-center gap-3">
                        {selectedCategory?.image ? (
                          <Image
                            source={typeof selectedCategory.image === "string" && selectedCategory.image.startsWith("http") ? { uri: selectedCategory.image } : selectedCategory.image}
                            style={{ width: 32, height: 32 }}
                            className="rounded-full bg-gray-200"
                          />
                        ) : (
                          // <View className="w-8 h-8 rounded-full bg-light-200 dark:bg-dark-700 items-center justify-center">
                          //   <ThemedText className="text-xs font-bold">
                          //     {getFirstChar(selectedSubCategory?.subcategory || "S")}
                          //   </ThemedText>
                          // </View>
                          <></>
                        )}
                        <ThemedText family="primary" variant={selectedSubCategory?.subcategory ? "primary" : "secondary"} weight="regular" className="text-b2 ">
                          {selectedSubCategory?.subcategory || "Select sub-category card"}
                        </ThemedText>
                      </View>
                      <ChevronRight size={20} color={isDark ? "white" : "#6B7280"} />
                    </Pressable>
                    */}

              {/* Country Selection */}
              <Pressable
                className="bg-background-light dark:bg-[#111111] border border-border-light dark:border-border-dark flex-row justify-between items-center rounded-[20px] p-3 mt-2"
                onPress={() => {
                  if (!selectedCategory) {
                    toast.showToast("Please select a category first", "error");
                    return;
                  }
                  setShowGiftCardSubCategoryModal(true);
                }}
              >
                <View className="flex-1 mr-2">
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
                      <View className="flex-row items-center gap-1.5">
                        {flag ? <CountryFlag flag={flag} size={16} /> : null}
                        <ThemedText family="primary" variant="primary" weight="regular" className="text-b2">
                          {countryName}
                        </ThemedText>
                      </View>
                    );
                  })()}
                </View>
                <ChevronRight size={20} color={isDark ? "white" : "#6B7280"} />
              </Pressable>

              {/* Card Type Selection */}
              <Pressable
                className="bg-background-light dark:bg-[#111111] border border-border-light dark:border-border-dark flex-row justify-between items-center rounded-[20px] p-3 mt-2"
                onPress={() => {
                  if (!selectedSubCategory) {
                    toast.showToast("Please select a country first", "error");
                    return;
                  }
                  setShowCardTypeModal(true);
                }}
              >
                <View className="flex-row items-center gap-3 flex-1 mr-2">
                  {selectedCardType?.type_image ? (
                    <Image
                      source={{ uri: selectedCardType.type_image }}
                      style={{ width: 32, height: 32 }}
                      className="rounded-full bg-gray-200"
                    />
                  ) : (
                    // <View className="w-8 h-8 rounded-full bg-light-200 dark:bg-dark-700 items-center justify-center">
                    //   <ThemedText className="text-xs font-bold">
                    //     {getFirstChar(selectedCardType?.type || "T")}
                    //   </ThemedText>
                    // </View>
                    <></>
                  )}
                  <View className="flex-col flex-1">
                    <ThemedText family="primary" variant={selectedCardType?.type ? "primary" : "secondary"} weight="regular" className="text-b2 ">
                      {selectedCardType?.type || "Select card type"}
                    </ThemedText>
                    {selectedCardType?.type_description ? (
                      <ThemedText family="primary" variant="secondary" className="text-b3 mt-0.5">
                        {selectedCardType.type_description}
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
                <ChevronRight size={20} color={isDark ? "white" : "#6B7280"} />
              </Pressable>

              {/* Old Country Selection (Auto-filled) - COMMENTED OUT
                    <Pressable
                      className="bg-background-light dark:bg-[#111111] border border-border-light dark:border-border-dark flex-row justify-between items-center rounded-[20px] p-3 mt-2"
                      onPress={() => {
                        // Manual selection is disabled because it's auto-filled
                      }}
                    >
                      <View className="flex-row items-center gap-3">
                        {getCountryByCode(formData.country)?.flag ? (
                          <View className="w-8 h-8 rounded-full bg-light-200 dark:bg-dark-700 items-center justify-center">
                            <ThemedText className="text-[10px]">
                              {getCountryByCode(formData.country)?.flag}
                            </ThemedText>
                          </View>
                        ) : (
                          <></>
                        )}
                        <ThemedText family="primary" variant={formData.country ? "primary" : "secondary"} weight="regular" className="text-b2">
                          {getCountryByCode(formData.country) ? `${getCountryByCode(formData.country)?.name} - ${formData.country}` : formData.country || "Select Country"}
                        </ThemedText>
                      </View>
                    </Pressable>
                    */}


              {/* Type Selection (Physical / E-Code) as Tabs */}
              {/* <View className="flex-row items-center justify-between bg-background-light dark:bg-dark-900 rounded-[20px] p-1 my-2 border border-border-light dark:border-border-dark">
                      {["physical", "ecode"].map((type) => (
                        <Pressable
                          key={type}
                          onPress={() => setPlanType(type)}
                          className={`flex-1 items-center justify-center rounded-[16px] py-3 ${planType === type ? "bg-white dark:bg-dark-700 " : "bg-transparent"
                            }`}
                        >
                          <ThemedText
                            family="secondary"
                            weight={planType === type ? "medium" : "regular"}
                            className={`text-b3 capitalize ${planType === type ? "!text-primary-500" : ""
                              }`}
                          >
                            {type === "physical" ? "Physical" : "E-Code"}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View> */}
            </View>

            {/* Type toggle selection - Removed as we now have Card Type modal */}
            {/* <View className="flex-1 bg-[#FFFFFF] dark:bg-background-dark mt-2 rounded-[20px] p-[8px] border border-border-light dark:border-border-dark"
                    >
                      <View
                        className="flex-row justify-between items-center px-1"
                      >
                        <ThemedText family="primary" variant="primary" weight="regular" className="text-b2">
                          Type
                        </ThemedText>
                        <Pressable onPress={() => setShowAttentionModal(true)}>
                          <CircleAlertIcon size={19} color={isDark ? "#4A4A4A" : "#0C0C0C"} />
                        </Pressable>
                      </View>
                      <View className="flex-row items-center justify-between mt-2 bg-background-light dark:bg-[#111111] rounded-[20px] p-1 border border-border-light dark:border-border-dark">
                        {["physical", "ecode"].map((type) => (
                          <Pressable
                            key={type}
                            onPress={() => handleChangeAll("planType", type)}
                            className={`flex-1 items-center justify-center rounded-[16px] py-3 ${formData.planType === type ? "bg-white dark:bg-dark-900" : "bg-transparent"
                              }`}
                          >
                            <ThemedText
                              family="secondary"
                              weight={formData.planType === type ? "medium" : "regular"}
                              className={`text-b3 capitalize ${formData.planType === type ? "!text-primary-500" : ""
                                }`}
                            >
                              {type === "physical" ? "Physical" : "E-Code"}
                            </ThemedText>
                          </Pressable>
                        ))}
                      </View>
                    </View> */}

            {/* speed */}
            {(selectedSubCategory?.slow_enabled === 1 || selectedSubCategory?.fast_enabled === 1) && (
              <View className="flex-1 bg-[#FFFFFF] dark:bg-background-dark mt-2 rounded-[20px] p-[8px] border border-border-light dark:border-border-dark"
              >
                <ThemedText className="px-1">
                  Speed
                </ThemedText>
                {/* Speed Selection (Fast / Slow) as Tabs */}
                <View className="flex-row items-center justify-between mt-2 bg-background-light dark:bg-[#111111] rounded-[20px] p-1 border border-border-light dark:border-border-dark">
                  {["slow", "fast"].map((item) => {
                    const isSlowEnabled = selectedSubCategory?.slow_enabled === 1;
                    const isFastEnabled = selectedSubCategory?.fast_enabled === 1;
                    const isDisabled = (item === "slow" && !isSlowEnabled) || (item === "fast" && !isFastEnabled);

                    return (
                      <Pressable
                        key={item}
                        onPress={() => !isDisabled && handleChangeAll("speed", item)}
                        className={`flex-1 items-center justify-center rounded-[16px] py-3 ${formData.speed === item ? "bg-white dark:bg-dark-900" : "bg-transparent"} ${isDisabled ? "opacity-30" : ""}`}
                        disabled={isDisabled}
                      >
                        <ThemedText
                          family="secondary"
                          weight={formData.speed === item ? "medium" : "regular"}
                          className={`text-b3 capitalize ${formData.speed === item ? "!text-primary-500" : ""
                            }`}
                        >
                          {item}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}


            {/* speed */}
            <View className="flex-1 bg-[#FFFFFF] dark:bg-background-dark mt-2 rounded-[20px] p-[8px] border border-border-light dark:border-border-dark"
            >
              <ThemedText>
                Code (Optional)
              </ThemedText>
              {/* Gift Card Code */}
              <View className="mt-2">
                <Input
                  placeholder="Enter code"
                  value={formData.referral}
                  onChangeText={(text) => handleChangeAll("referral", text)}
                  className="text-b2 bg-background-light dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-[20px]"
                />
              </View>
            </View>


            <View className="bg-[#FFFFFF] dark:bg-background-dark mt-2 rounded-[20px] p-[8px] border border-border-light dark:border-border-dark">
              {/* Amount and Quantity Section */}
              <View className="mt-2 " >
                <ThemedText family="primary" variant="primary" weight="medium" className="text-b2 mb-2 ml-2">
                  Amount and quantity
                </ThemedText>
                <Input
                  placeholder="$0.00"
                  value={formData.amount}
                  onChangeText={(text) => handleChangeAll("amount", text)}
                  keyboardType="numeric"
                  className="text-b2 bg-background-light dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-[20px]"
                />
                {/* {(selectedCardType?.min_amount != null || selectedCardType?.max_amount != null) ? (
                  <ThemedText family="primary" variant="secondary" className="text-[12px] mt-1 ml-2 text-primary-500">
                    {selectedCardType?.min_amount != null && selectedCardType?.max_amount != null
                      ? `Amount must be between $${selectedCardType.min_amount} and $${selectedCardType.max_amount}`
                      : selectedCardType?.min_amount != null
                        ? `Minimum amount is $${selectedCardType.min_amount}`
                        : `Maximum amount is $${selectedCardType.max_amount}`}
                  </ThemedText>
                ) : null} */}
                {fetchedRateResponse?.rate ? (
                  <ThemedText family="primary" variant="secondary" className="text-[12px] mt-1 ml-2 text-primary-500">
                    Rate: ₦{fetchedRateResponse.rate}/$
                  </ThemedText>
                ) : null}
              </View>

              {/* Quantity selector row */}
              <View className="">
                <View className="flex-row items-center gap-4 justify-between mt-1">
                  <Pressable
                    onPress={() => {
                      setFormData((prev) => ({
                        ...prev,
                        quantity: Math.max(1, prev.quantity - 1),
                      }));
                    }}
                    className="items-center justify-center h-14 flex-1 bg-[#F5F5F5] dark:bg-[#232323] rounded-[20px]"
                  >
                    <ThemedText
                      family="primary"
                      variant="primary"
                      weight="bold"
                      className="text-xl"
                    >
                      -
                    </ThemedText>
                  </Pressable>
                  <View
                    className="bg-background-light dark:bg-dark-900 flex-1 h-14 items-center justify-center border border-border-light dark:border-border-dark rounded-[20px]"
                  >
                    <ThemedText
                      family="primary"
                      variant="primary"
                      weight="bold"
                      className="text-lg text-center"
                    >
                      {formData.quantity || "1"}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => {
                      setFormData((prev) => ({
                        ...prev,
                        quantity: prev.quantity + 1,
                      }));
                    }}
                    className="items-center justify-center h-14 bg-[#F5F5F5] dark:bg-[#232323] flex-1 rounded-[20px]"
                  >
                    <ThemedText
                      family="primary"
                      variant="primary"
                      weight="bold"
                      className="text-xl"
                    >
                      +
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={handleFetchRate}
                disabled={isFetchingRate}
                className={`mt-4 py-3 rounded-[20px] items-center border border-primary-500 bg-primary-50 dark:bg-primary-900/20 ${isFetchingRate ? 'opacity-70' : ''}`}
              >
                {isFetchingRate ? (
                  <ActivityIndicator size="small" color={colorThemes[app_config.theme][500]} />
                ) : (
                  <ThemedText family="primary" weight="medium" className="text-primary-500">
                    See Rate
                  </ThemedText>
                )}
              </Pressable>

              <View className=" flex-col items-start justify-start border border-border-light dark:border-border-dark mt-2 p-3 rounded-[20px] bg-background-light dark:bg-background-dark ">
                <ThemedText
                  family="primary"
                  variant="secondary"
                  weight="medium"
                  className="text-b3"
                >
                  You’ll receive in total
                </ThemedText>

                <ThemedText
                  family="primary"
                  variant="primary"
                  weight="bold"
                  className="text-h3 pt-2"
                >
                  ₦
                  {formatNumber(Number(calculateTotal.toFixed(2))) ||
                    "0.00"}
                </ThemedText>
              </View>
            </View>

            {/* Image Upload */}
            <View className="bg-[#FFFFFF] dark:bg-background-dark mt-4 rounded-[20px] p-[12px] border border-border-light dark:border-border-dark">
              <View
                className="flex-row justify-between items-center"
              >
                <ThemedText family="primary" variant="primary" weight="bold" className="text-b2 mb-2">
                  Upload image
                </ThemedText>
                <Pressable onPress={() => setShowAttentionModal(true)}>
                  <CircleAlertIcon size={19} color={isDark ? "#4A4A4A" : "#0C0C0C"} />
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
                <Pressable
                  onPress={pickImageFromGallery}
                  className="w-28 h-28 items-center mt-3 justify-center bg-[#F5F5F5] dark:bg-[#232323] border border-dashed border-gray-300 dark:border-gray-700 rounded-[20px] mr-3"
                >
                  <Upload size={24} color={isDark ? "#9CA3AF" : "#6B7280"} />
                </Pressable>

                {selectedImages.map((image: any, index: number) => (
                  <Pressable
                    key={index}
                    className="relative mr-3 pt-3"
                    onPress={() => {
                      setIsVisible(true);
                      setCurrentImageIndex(index);
                    }}
                  >
                    <Image
                      source={{ uri: image.uri }}
                      className="w-28 h-28 rounded-[20px]"
                    />
                    <Pressable
                      onPress={() => removeImage(index)}
                      className="absolute -top0 -right-2 bg-red-500 w-6 h-6 rounded-full items-center justify-center border-2 border-white dark:border-dark-900"
                      style={{ zIndex: 10 }}
                    >
                      <Ionicons name="close" size={14} color="white" />
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* trade note */}
            <View className="mt-4 bg-background-light dark:bg-background-dark px-3 py-2 rounded-[20px] border border-border-light dark:border-border-dark">
              <Textarea
                label="Trade note (Optional)"
                value={formData.note}
                onChangeText={(text) => handleChangeAll("note", text)}
                placeholder="Tell us anything about the gift cards"
                rows={3}
                keyboardType="default"

              />
            </View>
          </View>
        </KeyboardAwareScrollView>
        {/* </TouchableWithoutFeedback> */}

        <View className="absolute bottom-0 left-0 right-0 px-6 pt-4 bg-white dark:bg-[#111111] border-t border-border-light dark:border-border-dark"
          style={{ paddingBottom: insets.bottom }}
        >
          <Pressable
            onPress={buttonCheck}
            className="w-full bg-primary-500 py-4 rounded-full items-center"
          >
            <ThemedText className="text-white font-bold text-lg">Continue</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
      {/* </KeyboardAvoidingView> */}

      {/* Modals */}
      <SellGiftCardsDataModal
        visible={showDataModal}
        onClose={() => setShowDataModal(false)}
        onSelect={handleSelectGiftCard}
        selectedId={selectedCategory?.name}
      />

      <GiftCardSubCategoryModal
        visible={showGiftCardSubCategoryModal}
        setVisible={setShowGiftCardSubCategoryModal}
        data={selectedCategory?.countries || []}
        // data={data}
        // selectedSubCategory={selectedSubCategory?.subcategory || ""}
        selectedSubCategory={selectedSubCategory?.country || ""}
        handleChange={(item) => {
          setSelectedSubCategory(item);
          // Auto-select speed based on availability
          let speedToSet = "";
          if (item.slow_enabled === 1) {
            speedToSet = "slow";
          } else if (item.fast_enabled === 1) {
            speedToSet = "fast";
          }

          setFormData(prev => ({
            ...prev,
            subCategory: item.subcategory,
            country: item.country,
            amount: "",
            speed: speedToSet,
          }));
          setRate({ rate: item.rate, amt: item.min_amount });

          setShowGiftCardSubCategoryModal(false);
          setSelectedCardType(null); // Reset card type when subcategory changes
        }}
        isFindingSubCategory={isFindingSubCategory}
        searchGiftcards={searchGiftcards}
        setSearchGiftCards={setSearchGiftCards}
        image={selectedCategory?.image || ""}
      />

      <GiftCardTypeModal
        visible={showCardTypeModal}
        setVisible={setShowCardTypeModal}
        selectedCardType={selectedCardType}
        onSelect={(item) => {
          setSelectedCardType(item);
          setFormData(prev => ({ ...prev, cardType: item.type, type_id: item.type_id }));
          setRate({ rate: item.rate, amt: item.min_amount || "" });
        }}
        // data={cardTypes}
        // isLoading={isFetchingCardTypes}
        data={selectedSubCategory?.types || []}
        isLoading={false}
        subcategoryName={selectedSubCategory?.subcategory || ""}
      />

      <CountryModal
        visible={showCountryModal}
        setVisible={setShowCountryModal}
        selectedCountry={selectedCountry}
        setSelectedCountry={(country: any) => {
          setSelectedCountry(country);
          handleChangeAll("country", country.name);
          setShowCountryModal(false);
        }}
        searchText={countrySearch}
        setSearchText={setCountrySearch}
      />

      <PaySellGiftCardsModal
        visible={showPayGcModal}
        setVisible={setShowPayGcModal}
        showPinModal={showPinModal}
        setShowPinModal={setShowPinModal}
        formData={{
          ...formData,
          country: getCountryByCode(formData.country) ? `${getCountryByCode(formData.country)?.name} - ${formData.country}` : formData.country
        }}
        image={selectedCategory?.image || ""}
        cardName={selectedCategory?.name || ""}
        rate={selectedSubCategory?.rate ? { ...rate, rate: selectedSubCategory.rate } : rate}
        totalReceived={calculateTotal}
        selectedSubCategory={selectedSubCategory}
        onSubmit={handleTradeGiftCard}
        paywithoutPin={paywithoutPin}
        isLoading={isLoading}
      />

      <SellGiftCardSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onReturnToDashboard={() => {
          setShowSuccessModal(false);
          router.replace(paths.giftcards.sellGiftCards);
        }}
        onViewTradeChat={() => {
          setShowSuccessModal(false);
          const category = selectedCategory?.name;
          // Navigate to Firebase trade chat
          router.push({
            pathname: '/(protected)/(features)/trade-chat' as any,
            params: {
              tradeId: successData.transId,
              cardName: successData.cardName || 'Gift Card',
              cardCategory: successData.cardName || '',
              cardImage: successData.cardImage || '',
              cardAmount: successData.formDataAmount || '0',
              settlementAmount: String(successData.settlementAmount),
              type: 'new'
            }
          });
        }}
        data={{
          cardName: successData.cardName,
          cardImage: successData.cardImage,
          country: getCountryByCode(formData.country) ? `${getCountryByCode(formData.country)?.name} - ${formData.country}` : formData.country,
          amount: successData.formDataAmount,
          rate: successData.rate,
          settlementAmount: successData.settlementAmount,
          quantity: successData.quantity,
          type: successData.type,
        }}
      />

      <PayAttentionModal
        visible={showAttentionModal}
        onClose={() => setShowAttentionModal(false)}
      />

      {/* Image Viewing Modal */}
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-black justify-center items-center">
          <TouchableOpacity
            onPress={() => setIsVisible(false)}
            className="absolute top-10 right-6 z-10 p-2 bg-black/50 rounded-full"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          {selectedImages[currentImageIndex] && (
            <Image
              source={{ uri: selectedImages[currentImageIndex]?.uri }}
              className="w-full h-full"
              resizeMode="contain"
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Loading Modal */}
      <Modal
        visible={isLoading}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View className="flex-1 bg-black/70 justify-center items-center">
          <View className="bg-white dark:bg-dark-700 p-6 rounded-xl items-center mx-4">
            <ActivityIndicator
              size="large"
              color={colorThemes[app_config.theme][500]}
            />
            <ThemedText className="mt-4 text-b2">
              Processing your trade...
            </ThemedText>
            <ThemedText className="mt-2 text-b3 text-center text-gray-500">
              Please wait, do not leave this screen
            </ThemedText>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default SellGiftCards;
