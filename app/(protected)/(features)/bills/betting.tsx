import { SettingsHeader } from "@/components/customs/settingsHeader";
import BeneficiaryModal from "@/components/modals/beneficiarymodals";
import BettingProviderModal from "@/components/modals/bettingprovidermodals";
import BillsSuccessModal from "@/components/modals/BillsSuccessModal";
import PayBettingModal from "@/components/modals/paybettingmodal";
import { PinEntryModal } from "@/components/modals/pinmodal";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import {
  addBettingBeneficiary,
  removeBettingBeneficiary,
} from "@/redux/beneficiary/bene_slice";
import {
  useGetBettingListQuery,
  usePayBettingMutation,
  useVeryBettingNumberMutation,
} from "@/redux/bills/bills_api";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  LayoutAnimation,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import z from "zod";

const smallAmounts = ["1000", "2000", "5000", "10000", "20000"];
const maxLength = 4;

const bettingFormSchema = z.object({
  id: z.string().min(1, "Betting ID is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val.replace(/,/g, ""))), "Must be valid number")
    .refine((val) => Number(val.replace(/,/g, "")) >= 100, "Minimum ₦100"),
  provider: z.string().min(1, "Please select a betting provider"),
});

const Betting = () => {
  const [activeNetwork, setActiveNetwork] = useState<any>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const { width: deviceWidth } = Dimensions.get("window");
  const [showBettingProviderModal, setShowBettingProviderModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionId, setTransactionId] = useState<string>("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);
  const [pin, setPin] = useState<string>("");
  const [isBeneficiaryExpanded, setIsBeneficiaryExpanded] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { isDark } = useTheme();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const { bettingBeneficiaries } = useAppSelector((state) => state.beneficiary);
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};

  const { data, isLoading: isLoadingProviders } = useGetBettingListQuery({});
  const [veryBettingNumber, { isLoading: isVerifying }] = useVeryBettingNumberMutation();
  const [payBetting, { isLoading: isPaying }] = usePayBettingMutation();

  const [formData, setFormData] = useState({
    id: "",
    amount: "",
    provider: "",
  });

  const validateForm = (): boolean => {
    try {
      bettingFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const formattedErrors: any = {};
        err.issues.forEach((issue) => {
          formattedErrors[issue.path[0]] = issue.message;
        });
        setErrors(formattedErrors);
        toast.showToast(err.issues[0].message, "error");
      }
      return false;
    }
  };

  const handleChangeAmount = (text: string) => {
    // Remove non-numeric characters except for formatting if needed
    const cleanText = text.replace(/[^0-9]/g, "");
    setFormData((prev) => ({ ...prev, amount: cleanText }));
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
  };

  const handleChangeID = (text: string) => {
    setFormData((prev) => ({ ...prev, id: text }));
    if (errors.id) setErrors((prev) => ({ ...prev, id: "" }));
  };

  const getBetNumber = async () => {
    try {
      const atex = await TokenManager.getToken();
      const response: any = await veryBettingNumber({
        data: {
          token: atex,
          betting_account: formData.id,
          unique_identifier: activeNetwork?.unique_identifier,
        },
      }).unwrap();
      if (response.status === "success") {
        toast.showToast("Betting ID verified", "success");
      }
    } catch (error: any) {
      toast.showToast(`${error?.data?.message || "Verification failed"}`, "error");
    }
  };

  useEffect(() => {
    if (activeNetwork?.unique_identifier && formData.id.length >= 5) {
      getBetNumber();
    }
  }, [activeNetwork?.unique_identifier, formData.id]);

  const handlePayBetting = async () => {
    try {
      const atex = await TokenManager.getToken();
      const response: any = await payBetting({
        data: {
          token: atex,
          betting_account: formData.id,
          unique_identifier: activeNetwork?.unique_identifier,
          amount: formData.amount,
          pin: pin,
        },
      }).unwrap();
      if (response.status === "success") {
        toast.showToast("Payment successful", "success");
        setPin("");
        setTransactionId(response?.data?.transid || response?.transid);
        setShowPayModal(false);
        setShowSuccessModal(true);
      } else {
        toast.showToast(`${response.message}`, "error");
        setPin("");
      }
    } catch (error: any) {
      toast.showToast(`${error?.data?.message || "Payment failed"}`, "error");
      setPin("");
    }
  };

  useEffect(() => {
    if (pin.length === maxLength) {
      setShowPinModal(false);
      handlePayBetting();
    }
  }, [pin]);

  const handleBeneficiarySelect = (bene: any) => {
    setFormData({
      id: bene.id,
      provider: bene.provider,
      amount: "",
    });
    const provider = data?.bet_providers?.find((p: any) => p.name === bene.provider);
    if (provider) setActiveNetwork(provider);
    setIsBeneficiaryExpanded(false);
  };

  // Calculate dynamic width for 3 items per row
  const itemWidth = (deviceWidth - 94) / 3;

  const suggestedProviders = React.useMemo(() => {
    const allProviders = data?.bet_providers || [];
    if (!allProviders.length) return [];

    const slice = allProviders.slice(0, 6);
    if (!activeNetwork) return slice;

    const isIncluded = slice.some((p: any) => p.unique_identifier === activeNetwork.unique_identifier);
    if (isIncluded) return slice;

    // If not included, show activeNetwork as the first one and then 5 more from the beginning
    const otherProviders = allProviders.filter((p: any) => p.unique_identifier !== activeNetwork.unique_identifier);
    return [activeNetwork, ...otherProviders.slice(0, 5)];
  }, [data, activeNetwork]);

  return (
    <>
      <SettingsHeader title="Betting" />
      <ThemedView className="flex-1 px-[24px]">
        <SafeAreaView className="flex-1" edges={["bottom"]}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
              <View className="flex-row items-center justify-between px-2 pt-2 mt-6 ">
                <ThemedText weight="medium" className="text-b2">Choose Provider</ThemedText>
                <Pressable onPress={() => setShowBettingProviderModal(true)}>
                  <ThemedText weight="medium" className="text-b2 !text-primary-500">See all</ThemedText>
                </Pressable>
              </View>
              <View className="bg-white dark:bg-[#111111] mt-3 rounded-[20px] p-2 border border-border-light dark:border-border-dark">
                {/* Provider Selection */}
                {isLoadingProviders ? (
                  <ActivityIndicator size="small" color="#00C853" className="my-4" />
                ) : (
                  <View className="flex-row flex-wrap gap-2 px-1 mb-4">
                    {suggestedProviders.map((provider: any, index: number) => (
                      <Pressable
                        key={index}
                        onPress={() => {
                          setActiveNetwork(provider);
                          setFormData(prev => ({ ...prev, provider: provider.name }));
                        }}
                        style={{ width: itemWidth, height: 80 }}
                        className={`items-center justify-center rounded-xl bg-[#F5F5F5] dark:bg-dark-900 border ${activeNetwork?.name === provider.name ? "border-primary-500 bg-[#F5F5F5] dark:bg-primary-900" : "border-border-light dark:border-border-dark"}`}
                      >
                        <Image
                          source={{ uri: provider.image }}
                          style={{ width: 28, height: 28 }}
                          className="rounded-full mb-2"
                        />
                        <ThemedText weight="medium" className="text-[10px] text-center px-1" numberOfLines={1}>
                          {provider.name}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* User ID and Amount Inputs */}
                <View className="px-1 gap-y-2">
                  <Input
                    placeholder="Enter your Betting ID"
                    value={formData.id}
                    onChangeText={handleChangeID}
                    className="rounded-[20px] !bg-[#F5F5F5] dark:!bg-dark-900"
                    error={errors.id}
                    trailingIcon={isVerifying ? <ActivityIndicator size="small" /> : undefined}
                  />
                </View>
                {/* Beneficiary Accordion */}
                {bettingBeneficiaries.length > 0 && (
                  <View className="mx-1 mb-2 bg-[#F9F9F9] dark:bg-[#0C0C0C] border border-border-light dark:border-border-dark rounded-[18px] overflow-hidden">
                    <Pressable
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setIsBeneficiaryExpanded(!isBeneficiaryExpanded);
                      }}
                      className="flex-row items-center justify-between px-4 py-3"
                    >
                      <ThemedText variant="secondary" className="text-b2">Recent beneficiaries</ThemedText>
                      <Ionicons name={isBeneficiaryExpanded ? "chevron-up" : "chevron-down"} size={16} color={isDark ? "white" : "black"} />
                    </Pressable>

                    {isBeneficiaryExpanded && (
                      <View className="px-4 pb-3 gap-y-2">
                        {bettingBeneficiaries.slice(0, 3).map((bene, idx) => {
                          const isActive = formData.id === bene.id && formData.provider === bene.provider;
                          return (
                            <Pressable
                              key={idx}
                              onPress={() => handleBeneficiarySelect(bene)}
                              className={`flex-row items-center gap-3 p-2 rounded-xl border ${isActive
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                : "border-border-light dark:border-border-dark bg-white dark:bg-dark-900"
                                }`}
                            >
                              <View>
                                <ThemedText weight="medium" className="text-b2">
                                  {bene.id} |{" "}
                                  <ThemedText variant="secondary" className="text-[10px]">
                                    {bene.provider}
                                  </ThemedText>
                                </ThemedText>
                              </View>
                            </Pressable>
                          );
                        })}
                        <Pressable
                          className="items-center py-2"
                          onPress={() => setShowBeneficiaryModal(true)}
                        >
                          <ThemedText className="text-primary-500 text-b3 font-primary-medium">
                            View all
                          </ThemedText>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View className="bg-white dark:bg-[#111111] mt-3 rounded-[20px] p-2 border border-border-light dark:border-border-dark">
                {/* User ID and Amount Inputs */}
                <View className="px-1 gap-y-2">
                  {/* Amount Section with Standardized TextInput appearance */}
                  <View>
                    <TextInput
                      placeholder="Enter amount"
                      placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                      value={formData.amount}
                      onChangeText={handleChangeAmount}
                      keyboardType="numeric"
                      className={`bg-light-150 dark:bg-dark-900 rounded-[20px] py-3 px-4 text-black dark:text-white font-primary-medium border ${errors.amount ? "border-red-500" : "border-border-light dark:border-border-dark focus:border-primary-500"}`}
                    />
                    {errors.amount && (
                      <ThemedText className="!text-red-500 text-xs px-2 mt-1">{errors.amount}</ThemedText>
                    )}
                    <ThemedText variant="secondary" className="text-[10px] mt-1 px-2">Minimum amount is ₦100</ThemedText>
                  </View>
                </View>

                {/* Quick Amount Buttons */}
                <View className="flex-row flex-wrap gap-2 px-1 mt-4 mb-4">
                  {smallAmounts.map((amt, index) => (
                    <Pressable
                      key={index}
                      className={`items-center justify-center py-[12px] px-[12px] rounded-[12px] bg-[#F5F5F5] dark:bg-dark-900 ${formData.amount === amt ? "border-2 border-primary-500" : "border border-border-light dark:border-border-dark"
                        }`}
                      // Width calculation: (Screen - ScreenPadding(48) - ContainerPadding(16) - Gaps(16) - Borders(6) - Safety(8)) / 3
                      style={{ width: (deviceWidth - 94) / 3 }}
                      onPress={() => {
                        setFormData((prev) => ({
                          ...prev,
                          amount: amt,
                        }));
                      }}
                    >
                      <ThemedText
                        className={`text-b2 font-primary-bold text-center ${formData.amount === amt ? "text-primary-500" : ""
                          }`}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        ₦{amt}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>


            </ScrollView>

          </TouchableWithoutFeedback>
          <View className="my-8 justify-end flex-1">
            <Button
              onPress={() => {
                if (validateForm()) {
                  const amount = Number(formData.amount.replace(/,/g, ""));
                  const balance = Number(userInfo?.bal || 0);

                  if (balance < amount) {
                    toast.showToast("Insufficient balance to perform this transaction", "error");
                    return;
                  }
                  setShowPayModal(true);
                }
              }}
            >
              <ThemedText weight="bold" className="text-white text-b1">Continue</ThemedText>
            </Button>
          </View>
        </SafeAreaView>
      </ThemedView>

      <BettingProviderModal
        visible={showBettingProviderModal}
        setVisible={setShowBettingProviderModal}
        selectedBettingProvider={formData.provider}
        handleChange={(val) => setFormData(prev => ({ ...prev, provider: val }))}
        setActiveNetwork={setActiveNetwork}
      />

      {showPayModal && (
        <PayBettingModal
          visible={showPayModal}
          setVisible={setShowPayModal}
          formData={formData}
          activeNetwork={activeNetwork}
          setShowPinModal={setShowPinModal}
        />
      )}

      {showSuccessModal && (
        <BillsSuccessModal
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          onViewReceipt={() => {
            setShowSuccessModal(false);
            router.push({
              pathname: paths.detailtransaction,
              params: { transId: transactionId, type: "betting" },
            });
          }}
          billType="betting"
          amount={formData.amount}
          recipient={formData.id}
          recipientName={formData.provider}
          onSaveBeneficiaryChange={(val) => {
            if (val) dispatch(addBettingBeneficiary({ id: formData.id, provider: formData.provider }));
            else dispatch(removeBettingBeneficiary({ id: formData.id, provider: formData.provider }));
          }}
        />
      )}

      {showPinModal && (
        <PinEntryModal
          visible={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSubmit={(p) => setPin(p)}
          pin={pin}
          setPin={setPin}
          title="Enter PIN"
        />
      )}

      {showBeneficiaryModal && (
        <BeneficiaryModal
          visible={showBeneficiaryModal}
          setVisible={setShowBeneficiaryModal}
          beneficiaryType="betting"
          selectedBeneficiary={selectedBeneficiary}
          setSelectedBeneficiary={setSelectedBeneficiary}
          handleSelectBeneficiary={handleBeneficiarySelect}
          formData={formData}
        />
      )}

      <Modal visible={isPaying} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center items-center">
          <View className="bg-white dark:bg-dark-700 p-6 rounded-xl items-center mx-4">
            <ActivityIndicator size="large" color="#00C853" />
            <ThemedText className="mt-4 text-b2">Processing your payment...</ThemedText>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Betting;
