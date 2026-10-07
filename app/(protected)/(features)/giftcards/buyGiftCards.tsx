import { SettingsHeader } from "@/components/customs/settingsHeader";
import { BillsSuccessModal } from "@/components/modals/BillsSuccessModal";
import PayBuyGiftCardsModal from "@/components/modals/buyGiftcardsmodal";
import { PinEntryModal } from "@/components/modals/pinmodal";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { CustomModal } from "@/components/ui/modal";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useBuyGiftCardMutation } from "@/redux/giftcards/giftcards_api";
import { useAppSelector } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { getFirstChar } from "@/utils/bills";
import { app_config } from "@/utils/config";
import { formatNumber } from "@/utils/formatamount";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, MessageCircleWarningIcon } from "lucide-react-native";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

// Add validation schema
const giftCardSchema = z.object({
  amount: z.string().min(1, "Card value is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Sender or Recipient name is required"),
});

// type GiftCardFormData = z.infer<typeof giftCardSchema>;

const BuyGiftCards = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const [showPayGcModal, setShowPayGcModal] = React.useState(false);
  const params = useLocalSearchParams();
  const { name, id, image, countryCode, denomType, exchangeRate, country } =
    params as unknown as {
      name: string;
      id: string;
      image: string;
      countryCode: string;
      denomType: string;
      exchangeRate: string;
      country: string;
    };

  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};

  const [activeRecipientTab, setActiveRecipientTab] = React.useState<"myself" | "someone">("myself");

  const [formData, setFormData] = React.useState({
    name: "",
    amount: "",
    quantity: 1,
    email: "",
    country: country || "",
  });

  const { width: deviceWidth } = Dimensions.get("window");
  const [showAmountModal, setShowAmountModal] = React.useState(false);
  const maxLength = 4;
  const [rate, setRate] = React.useState<any>({});
  const isMobile = Platform.OS === "ios" ? false : true;
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [pin, setPin] = React.useState<string>("");
  const toast = useToast();
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [successData, setSuccessData] = React.useState<{
    amount: string;
    nairaAmount: string;
    recipientEmail: string;
    transId: string;
  }>({ amount: "", nairaAmount: "", recipientEmail: "", transId: "" });

  const [buyGiftCard, { isLoading }] = useBuyGiftCardMutation();

  const fixedRecipientDenominations = useMemo(() => {
    try {
      return JSON.parse(params.fixedRecipientDenominations as string) || [];
    } catch {
      return [];
    }
  }, [params.fixedRecipientDenominations]);


  // Sync with user info when tab changes or info loads
  React.useEffect(() => {
    if (activeRecipientTab === "myself" && userInfo) {
      setFormData(prev => ({
        ...prev,
        name: userInfo.name || "",
        email: userInfo.email || "",
      }));
    }
  }, [activeRecipientTab, userInfo]);


  const validateForm = (): boolean => {
    const formDataToValidate = {
      amount: formData.amount,
      quantity: formData.quantity,
      email: formData.email.trim(),
      name: formData.name.trim(),
    };

    try {
      giftCardSchema.parse(formDataToValidate);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);

        // Show toast with first error
        const firstError = error.issues[0];
        toast.showToast(firstError.message, "error");

        return false;
      }
      return false;
    }
  };

  const handleRecipientTab = (type: "myself" | "someone") => {
    setActiveRecipientTab(type)
    if (type === "myself") {
      setFormData(prev => ({
        ...prev,
        name: userInfo?.name || "",
        email: userInfo?.email || "",
      }));
    } else {
      // Clear name and email for someone else
      setFormData(prev => ({
        ...prev,
        name: "",
        email: "",
      }));
    }
  }

  const buttonCheck = () => {
    const isValid = validateForm();

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast.showToast(firstError, "error");
      }
      return;
    }

    if (calculateTotal > Number(userInfo?.bal || 0)) {
      toast.showToast("Insufficient balance to perform this transaction", "error");
      return;
    }

    setShowPayGcModal(true);
  };

  const handleTradeGiftCard = async () => {
    try {
      const atex = await TokenManager.getToken();
      if (!atex) {
        router.replace(paths.auth.login);
        return;
      }

      const response = await buyGiftCard({
        data: {
          token: atex ?? "",
          pin: pin,
          countryCode: countryCode || "",
          productId: id as string,
          unitPrice: formData.amount || "",
          senderName: activeRecipientTab === "myself"
            ? (userInfo?.name || "Myself")
            : (formData.name || ""),
          recipientEmail: activeRecipientTab === "myself"
            ? (userInfo?.email || "")
            : (formData.email || ""),
          quantity: formData.quantity.toString(),
        },
      }).unwrap();

      setPin("");
      setFormData({
        quantity: 1,
        amount: "",
        name: "",
        email: "",
        country: "",
      });
      setRate({});

      // Show success modal
      setSuccessData({
        amount: formData.amount,
        nairaAmount: calculateTotal.toString(),
        recipientEmail: activeRecipientTab === "myself" ? (userInfo?.email || "") : (formData.email || ""),
        transId: response.transid,
      });
      setShowPayGcModal(false);
      setShowSuccessModal(true);

      console.log("Trade gift card response:", response);
    } catch (error: any) {
      setShowPayGcModal(false);
      if (error?.status === "TIMEOUT_ERROR") {
        toast.showToast("Request timed out. Please try again.", "error");
      } else {
        toast.showToast(
          `${error?.data?.message || error?.message || "Failed to trade gift card"}`,
          "error",
        );
      }
      setPin("");
      console.log("Error trading gift card:", error);
    }
  };

  const handlePinSubmit = (enteredPin: string) => {
    setPin(enteredPin);
    if (enteredPin.length === maxLength) {
      setShowPinModal(false);
    }
  };

  React.useEffect(() => {
    const processTrade = async () => {
      if (pin && pin.length === maxLength) {
        try {
          setShowPinModal(false);
          await handleTradeGiftCard();
        } catch (error) {
          setPin("");
          console.log("Error processing trade:", error);
        }
      }
    };

    processTrade();
  }, [pin]);

  const handleChangeAll = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (errors[key]) {
      setErrors((prev) => {
        const updatedErrors = { ...prev };
        delete updatedErrors[key];
        return updatedErrors;
      });
    }
  };

  const calculateTotal = useMemo(() => {
    const amount = parseFloat(formData.amount) || 0;
    const rateNaira = parseFloat(exchangeRate) || 0;
    const quantity = formData.quantity || 1;
    //     return amount * rateNaira;
    // }, [formData.amount, exchangeRate]);
    return amount * rateNaira * quantity;
  }, [formData.amount, exchangeRate, formData.quantity]);

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
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
            }}
            accessible={false}
          >
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
              showsVerticalScrollIndicator={false}
            >

              {/* Input Wrapper */}
              <View
                className="bg-[#FFFFFF] dark:bg-[#111111] mt-8 rounded-[20px] p-[8px] border border-border-light dark:border-border-dark"
              >
                {/* Tabs for Myself / Someone Else */}
                <View className="flex-row items-center justify-between bg-[#FCFCFC] dark:bg-dark-900 rounded-[20px] p-1 mb-2 border border-border-light dark:border-border-dark">
                  <Pressable
                    onPress={() => setActiveRecipientTab("myself")}
                    className={`flex-1 items-center justify-center rounded-[16px] py-3 ${activeRecipientTab === "myself" ? "bg-white dark:bg-dark-700 " : "bg-transparent"}`}
                  >
                    <ThemedText
                      family="secondary"
                      weight={activeRecipientTab === "myself" ? "medium" : "regular"}
                      className={`text-b3 ${activeRecipientTab === "myself" ? "!text-primary-500" : ""}`}
                    >
                      Myself
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => handleRecipientTab("someone")}
                    className={`flex-1 items-center justify-center rounded-[16px] py-3 ${activeRecipientTab === "someone" ? "bg-white dark:bg-dark-700 " : "bg-transparent"}`}
                  >
                    <ThemedText
                      family="secondary"
                      weight={activeRecipientTab === "someone" ? "medium" : "regular"}
                      className={`text-b3 ${activeRecipientTab === "someone" ? "!text-primary-500" : ""}`}
                    >
                      Someone
                    </ThemedText>
                  </Pressable>
                </View>

                {/* card selected */}
                <Pressable
                  className="border border-border-light dark:border-border-dark flex-row justify-between items-center rounded-[20px] py-3 px-4  bg-[#FCFCFC] dark:bg-dark-900"
                  onPress={() => {
                    router.replace(paths.giftcards.buyGiftcardsData);
                  }}
                >
                  <View className="flex-row items-center gap-2 flex-1">
                    {image ? (
                      <Image
                        source={{
                          uri: image.startsWith("http") ? image : ``,
                        }}
                        style={{ width: 32, height: 32 }}
                        className="rounded-full"
                        onError={() => {
                          console.log("Failed to load image for:", name);
                        }}
                      />
                    ) : (
                      <ThemedText className="bg-white dark:bg-dark-500 w-8 h-8 text-center leading-8 rounded-full text-xs">
                        {getFirstChar(name || "G")}
                      </ThemedText>
                    )}
                    <View className="flex-1">
                      <ThemedText
                        family="primary"
                        variant="primary"
                        weight="medium"
                        className="text-b2"
                        numberOfLines={1}
                      >
                        {name || "Select Gift Card"}
                      </ThemedText>
                    </View>
                  </View>
                  <ChevronRight
                    width={20}
                    height={20}
                    color={isDark ? "white" : "black"}
                  />
                </Pressable>

                {/* country coude preview */}
                <Pressable
                  className="border border-border-light dark:border-border-dark flex-row justify-between items-center rounded-[20px] py-4 px-4 mt-2 bg-[#FCFCFC] dark:bg-dark-900"
                  onPress={() => {
                    router.replace(paths.giftcards.buyGiftcardsData);
                  }}
                >
                  <View className="flex-row items-center gap-2 flex-1">
                    <View className="flex-1">
                      <ThemedText
                        family="primary"
                        variant="primary"
                        weight="medium"
                        className="text-b2"
                        numberOfLines={1}
                      >
                        {country || countryCode || "Global"}
                      </ThemedText>
                    </View>
                  </View>
                  <ChevronRight
                    width={20}
                    height={20}
                    color={isDark ? "white" : "black"}
                  />
                </Pressable>

                {/* Recipient name input - for someone else */}
                <View className="mt-2">
                  {activeRecipientTab === "someone" ? (
                    <Input
                      placeholder="Enter recipient name"
                      value={formData.name}
                      onChangeText={(text) => handleChangeAll("name", text)}
                      className="text-b2 border border-border-light dark:border-border-dark !bg-[#FCFCFC] dark:!bg-dark-900 rounded-[20px]"
                      error={errors.name}
                    />
                  ) : (
                    <View className="bg-[#FCFCFC] dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-[20px] p-4">
                      <ThemedText
                        family="secondary"
                        variant="secondary"
                        className="text-b3"
                      >
                        Recipient:{" "}
                        <ThemedText weight="bold" className="!text-primary-500">
                          {userInfo?.name || "Myself"}
                        </ThemedText>
                      </ThemedText>
                    </View>
                  )}
                </View>

                {/* email */}
                <View className="mt-2">
                  {activeRecipientTab === "someone" ? (
                    <Input
                      placeholder="Enter recipient email"
                      value={formData.email}
                      onChangeText={(text) => handleChangeAll("email", text)}
                      keyboardType="email-address"
                      className="text-b2 border border-border-light dark:border-border-dark !bg-[#FCFCFC] dark:!bg-dark-900 rounded-[20px]"
                      error={errors.email}
                    />
                  ) : (
                    <View className="bg-[#FCFCFC] dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-[20px] p-4">
                      <ThemedText
                        family="secondary"
                        variant="secondary"
                        className="text-b3"
                      >
                        The gift card will be sent to your registered email:{" "}
                        <ThemedText weight="bold" className="!text-primary-500">
                          {userInfo?.email}
                        </ThemedText>
                      </ThemedText>
                    </View>
                  )}
                </View>

                {denomType === "FIXED" && (
                  <View className="mt-4">
                    <ThemedText
                      family="primary"
                      variant="primary"
                      weight="medium"
                      className="text-b2 mb-2 ml-2"
                    >
                      Card value
                    </ThemedText>
                    <Pressable
                      onPress={() => setShowAmountModal(true)}
                      className="bg-[#FCFCFC] dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-[20px] p-4 flex-row justify-between items-center"
                    >
                      <ThemedText
                        family="primary"
                        variant="primary"
                        weight="medium"
                        className="text-b2"
                      >
                        {formData.amount
                          ? `$${formData.amount}`
                          : "Select amount"}
                      </ThemedText>
                      <ChevronRight
                        width={20}
                        height={20}
                        color={isDark ? "white" : "black"}
                      />
                    </Pressable>
                  </View>
                )}

                {/* quantity selector row */}
                <View className="mt-4">
                  <ThemedText
                    family="primary"
                    variant="primary"
                    weight="medium"
                    className="text-b2 mb-2 ml-2"
                  >
                    Quantity
                  </ThemedText>
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
                      className="bg-[#FCFCFC] dark:bg-dark-900 flex-1 h-14 items-center justify-center border border-border-light dark:border-border-dark rounded-[20px]"
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



                {/* Old RANGE input - commented out */}
                {/* {denomType === "RANGE" && (
                  <View className="mt-2 text-primary-500">
                    <ThemedText
                      family="primary"
                      variant="primary"
                      weight="medium"
                      className="text-b2 mb-2 ml-2"
                    >
                      Card value
                    </ThemedText>
                    <Input
                      placeholder="$0.00"
                      value={formData.amount}
                      onChangeText={(text) => handleChangeAll("amount", text)}
                      keyboardType="phone-pad"
                      className="text-b2 border border-border-light dark:border-border-dark !bg-[#FCFCFC] dark:!bg-dark-900 rounded-[20px] py-4"
                      error={errors.amount}
                    />
                  </View>
                )} */}


              </View>

              {denomType === "RANGE" && (
                <View
                  className="bg-[#FFFFFF] dark:bg-[#111111] mt-8 rounded-[20px] p-[8px] border border-border-light dark:border-border-dark"
                >
                  {/* Amount / Value section */}

                  <View className="mt-">
                    {/* Current rate header */}
                    <View
                      className="bg-[#F8F8F8] dark:bg-[#171717] rounded-[20px] p-[8px] border border-border-light dark:border-border-dark"
                    >
                      <View className="flex-row items-center justify-between">
                        <ThemedText
                          family="primary"
                          variant="secondary"
                          weight="medium"
                          className="text-b2"
                        >
                          Current rate:
                        </ThemedText>
                        <ThemedText
                          family="primary"
                          variant="primary"
                          weight="bold"
                          className="text-b3"
                        >
                          $1 ~ ₦{formatNumber(Number(exchangeRate) || 0)}
                        </ThemedText>
                      </View>
                    </View>
                    {/* Amount display card */}
                    <View
                      className="bg-[#F8F8F8] dark:bg-[#171717] my-2 rounded-[20px] p-[14px] border border-border-light dark:border-border-dark"
                    >
                      {/* Large amount input */}
                      <View className="flex-row items-center justify-center mb-2">
                        <ThemedText
                          family="primary"
                          variant="primary"
                          weight="bold"
                          className="text-[36px] !text-black dark:!text-white"
                          style={{ lineHeight: 44 }}
                        >
                          $
                        </ThemedText>
                        <TextInput
                          value={formData.amount ? formatNumber(Number(formData.amount), { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : ""}
                          onChangeText={(text) => {
                            // Remove commas and non-numeric characters for storage
                            const rawValue = text.replace(/[^0-9.]/g, "");
                            handleChangeAll("amount", rawValue);
                          }}
                          keyboardType="numeric"
                          placeholder="0.00"
                          placeholderTextColor="#666"
                          style={{
                            fontSize: 36,
                            fontWeight: "bold",
                            color: isDark ? "white" : "black",
                            flex: 1,
                            padding: 0,
                            margin: 0,
                            backgroundColor: "transparent",
                            lineHeight: 44,
                            textAlignVertical: "center",
                          }}
                        />
                      </View>
                      {/* Total amount to pay */}
                      <View className="flex-row items-center pt-2">
                        <ThemedText
                          family="primary"
                          variant="secondary"
                          weight="medium"
                          className="text-b3 "
                        >
                          Total amount to pay~{" "}
                        </ThemedText>
                        <ThemedText
                          family="primary"
                          variant="primary"
                          weight="medium"
                          className="text-b3 !text-text-secondary-light dark:!text-text-secondary-dark "
                        >
                          ₦{formatNumber(Number(calculateTotal.toFixed(2))) || "0.00"}
                        </ThemedText>
                      </View>
                    </View>


                  </View>


                  {/* Quick amount buttons */}
                  <View className="flex-row flex-wrap gap-2">
                    {[10, 50, 100, 200, 300, 500].map((amount) => (
                      <Pressable
                        key={amount}
                        onPress={() => handleChangeAll("amount", amount.toString())}
                        className={`flex-1 flex-row min-w-[30%] items-center justify-center py-5 rounded-[16px] ${formData.amount === amount.toString()
                          ? "bg-primary-500"
                          : "bg-[#F5F5F5] dark:bg-[#0C0C0C] border border-border-light dark:border-border-dark"
                          }`}
                      >
                        <ThemedText
                          family="primary"
                          variant="primary"
                          weight="semibold"
                          className={`text-b2 ${formData.amount === amount.toString()
                            ? "!text-white"
                            : "!text-text-primary-light dark:!text-text-primary-dark"
                            }`}
                        >
                          ${amount}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* rate section wrapper */}
              {
                denomType === "FIXED" && (
                  <View
                    className="bg-[#FFFFFF] dark:bg-[#111111] mt-4 rounded-[20px] p-[8px] border border-border-light dark:border-border-dark"
                  >
                    <ThemedText
                      family="primary"
                      variant="primary"
                      weight="bold"
                      className="text-b2 pl-2 mb-2"
                    >
                      Rate
                    </ThemedText>
                    <View className="bg-[#FCFCFC] dark:bg-dark-900 p-4 rounded-[20px] border border-border-light dark:border-border-dark">
                      <View className="flex-row items-center justify-between pb-3">
                        <ThemedText
                          family="primary"
                          variant="secondary"
                          weight="medium"
                          className="text-b3"
                        >
                          At rate of
                        </ThemedText>

                        <ThemedText
                          family="primary"
                          variant="primary"
                          weight="medium"
                          className="text-b3"
                        >
                          ${formData.amount || "0"} = ₦
                          {formatNumber(Number(exchangeRate || "0.00"))}
                        </ThemedText>
                      </View>

                      <View className="flex-row items-center justify-between">
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
                          className="text-b3 text-primary-500"
                        >
                          ₦{formatNumber(Number(calculateTotal.toFixed(2))) || "0.00"}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                )
              }
              {/* attention */}
              <View
                className="bg-[#FFFFFF] dark:bg-[#111111] mt-4 rounded-[20px] p-[10px] border border-border-light dark:border-border-dark flex-row items-center gap-2 justify-between"
              >

                <MessageCircleWarningIcon color={isDark ? "#B5B5B5" : "#232323"} width={16} height={16} />
                <ThemedText
                  family="primary"
                  variant="secondary"
                  weight="medium"
                  className="text-b3 flex-1"
                >
                  Your gift card code and photo will be sent to the provided email address. Make sure it’s valid                </ThemedText>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>

          <View className=" justify-end  pb-[24px]">
            <Button
              disabled={isLoading}
              onPress={() => {
                Keyboard.dismiss();
                buttonCheck();
              }}
            // setShowSuccessModal={true}
            >
              <ThemedText
                family="primary"
                variant="primary"
                weight="bold"
                className="text-b1 text-center text-white"
              >
                {isLoading ? <ActivityIndicator color="white" /> : "Continue"}
              </ThemedText>
            </Button>
          </View>
        </SafeAreaView>
      </ThemedView>

      {showPayGcModal && (
        <PayBuyGiftCardsModal
          visible={showPayGcModal}
          setVisible={setShowPayGcModal}
          rate={exchangeRate}
          image={image}
          formData={formData}
          productName={name}
          setShowPinModal={setShowPinModal}
          showPinModal={showPinModal}
          totalReceived={calculateTotal}
          activeRecipientTab={activeRecipientTab}
        />
      )}

      {showPinModal && (
        <PinEntryModal
          visible={showPinModal}
          onClose={() => {
            setShowPinModal(false);
          }}
          onSubmit={handlePinSubmit}
          pin={pin}
          setPin={setPin}
          title="Enter PIN"
          onForgotPin={() => {
            setShowPinModal(false);
            router.push(paths.auth.forgotPassword);
          }}
        />
      )}

      <Modal
        visible={isLoading}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View className="flex-1 bg-black/70 justify-center items-center">
          <View className="bg-white dark:bg-dark-700 p-6 rounded-[20px] items-center mx-4">
            <ActivityIndicator
              size="large"
              color={colorThemes[app_config.theme][500]}
            />
            <ThemedText className="mt-4 text-b2">
              Processing your purchase...
            </ThemedText>
            <ThemedText className="mt-2 text-b3 text-center text-gray-500">
              Please wait, do not leave this screen
            </ThemedText>
          </View>
        </View>
      </Modal>

      <CustomModal
        visible={showAmountModal}
        onClose={() => setShowAmountModal(false)}
        title={""}
        height="50%"
        showHandle={true}
        showHeader={false}
        closebutton={true}
        className=""
      >
        <View className="flex-1 justify-between">
          <ThemedText className="text-b2 font-bold mb-4">
            Select Amount
          </ThemedText>

          <FlatList
            data={fixedRecipientDenominations}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  handleChangeAll("amount", item.toString());
                  setShowAmountModal(false);
                }}
                className="border-b border-border-light dark:border-border-dark py-4"
              >
                <ThemedText className="text-b2">${item}</ThemedText>
              </Pressable>
            )}
          />

          <Pressable
            onPress={() => setShowAmountModal(false)}
            className="bg-gray-200 dark:bg-dark-700 py-3 rounded-[20px] mt-4"
          >
            <ThemedText className="text-center font-semibold">
              Cancel
            </ThemedText>
          </Pressable>
        </View>
      </CustomModal>

      <BillsSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onViewReceipt={() => {
          setShowSuccessModal(false);
          router.replace({
            pathname: paths.detailtransaction,
            params: {
              transId: successData.transId,
              type: "giftcard",
            },
          });
        }}
        billType="giftcard"
        amount={successData.nairaAmount}
        recipient={successData.recipientEmail}
        recipientName={name} // Gift card name (e.g., Apple)
        showBeneficiaryToggle={false}
        buttonTitle="View Receipt"
        customMessage="Your gift card purchase is successfully. We've send a copy of your gift card code and order details to"
      />
    </>
  );
};

export default BuyGiftCards;


