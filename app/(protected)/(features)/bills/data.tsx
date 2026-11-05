import { SettingsHeader } from "@/components/customs/settingsHeader";
import BeneficiaryModal, {
  bentypes,
} from "@/components/modals/beneficiarymodals";
import BillsSuccessModal from "@/components/modals/BillsSuccessModal";
import BuyDataModal from "@/components/modals/buyDatamodal";
import { PinEntryModal } from "@/components/modals/pinmodal";
import { DataPlanSkeleton } from "@/components/skeletons/dataplanskeleton";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { networkMapping, networkTypes } from "@/constant/data";
import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useContactPhoneSelector } from "@/hooks/useContact";
import {
  addPhoneBeneficiary,
  removePhoneBeneficiary,
} from "@/redux/beneficiary/bene_slice";
import {
  useBuyDataMutation,
  useGetAirtimeNetworkStatusMutation,
  useGetPlanTypeMutation
} from "@/redux/bills/bills_api";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { getFirstChar, getIconsForBeneficiary } from "@/utils/bills";
import { app_config } from "@/utils/config";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { CowrieService } from "@/services/cowrie-service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  UIManager,
  View,
} from "react-native";
import { z } from "zod";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}



const dataSchema = z.object({
  number: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(11, "Phone number must not exceed 11 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),

  network: z.string().min(1, "Please select a network"),
  planId: z.string().min(1, "Please select a data plan"),
});

const Data = () => {
  const [activeNetwork, setActiveNetwork] = React.useState<any>(
    networkTypes[0],
  );
  const [showDataModal, setShowDataModal] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [transactionId, setTransactionId] = React.useState<string>("");
  const { width: deviceWidth } = Dimensions.get("window");
  const [selectedAmount, setSelectedAmount] = React.useState("");
  const router = useRouter();
  const [formData, setFormData] = React.useState({
    number: "",
    amount: "",
    network: networkTypes[0].id,
    planId: "",
    plan_type: "Daily",
  });

  const availableCategories = React.useMemo(() => {
    return CowrieService.getPlanCategories(formData.network || activeNetwork?.id || "mtn");
  }, [formData.network, activeNetwork]);

  const [activePlanType, setActivePlanType] = React.useState<string>("Daily");

  // Keep active category in sync if the network changes and category isn't available
  React.useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.includes(activePlanType)) {
      setActivePlanType(availableCategories[0]);
    }
  }, [availableCategories]);
  const maxLength = 4;
  const [selectedBeneficiary, setSelectedBeneficiary] =
    React.useState<bentypes>({
      id: "",
      number: "",
      name: "",
      network: "",
    });
  const [planTypeData, setPlanTypeData] = React.useState<any>(null);
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [showBeneficiaryModal, setShowBeneficiaryModal] = React.useState(false);
  const { phoneBeneficiaries } = useAppSelector(
    (state) => state.beneficiary,
  ) as { phoneBeneficiaries: bentypes[] };
  const dispatch = useAppDispatch();
  const { selectContactPhone, setPhoneNumber } = useContactPhoneSelector();
  const [detectedNetwork, setDetectedNetwork] = React.useState("");
  const [showNetworkMismatchModal, setShowNetworkMismatchModal] =
    React.useState(false);
  const [errors, setErrors] = React.useState<{ [k: string]: string }>({});
  const toast = useToast();
  const { isDark } = useTheme();
  const [showNetworkDropdown, setShowNetworkDropdown] = React.useState(false);
  const [isBeneficiaryExpanded, setIsBeneficiaryExpanded] = React.useState(false);
  const [showBeneficiaryExpanded, setShowBeneficiaryExpanded] = React.useState(false);
  const isMobile = Platform.OS === "ios" ? false : true;
  // const { atex } = useAppSelector((state) => state.session);
  const [ignoreMismatch, setIgnoreMismatch] = useState(false);
  // const { atex } = useAuthToken();

  const displayBeneficiary = selectedBeneficiary.id
    ? selectedBeneficiary
    : phoneBeneficiaries.length > 0
      ? phoneBeneficiaries[0]
      : ({} as bentypes);
  const BeneficiaryIcon = getIconsForBeneficiary(displayBeneficiary as any);

  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};

  const validateForm = () => {
    const result = dataSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
        toast.showToast(err.message, "error");
      });
      setErrors(fieldErrors);

      return false;
    }
    setErrors({});
    return true;
  };

  const handlePinSubmit = (enteredPin: string) => {
    setPin(enteredPin);
    if (enteredPin.length === maxLength) {
      setShowPinModal(false);
    }
  };

  const [getAirtimeNetworkStatus, { isLoading: isGettingAirtimeNetwork }] =
    useGetAirtimeNetworkStatusMutation();

  const [getPlanType, { isLoading: isGettingPlanType }] =
    useGetPlanTypeMutation();

  const [buyData, { isLoading: isBuyingData }] = useBuyDataMutation();

  React.useEffect(() => {
    const checkNetworkStatus = async () => {
      const atex = await TokenManager.getToken();
      if (atex) {
        try {
          const response: any = await getAirtimeNetworkStatus({
            data: { token: atex },
          }).unwrap();
          if (response.status === "success") {
            console.log("Airtime Network Status:", response);
          } else {
            console.error("Failed to fetch airtime network status:", response);
          }
        } catch (error) {
          console.error("Error fetching airtime network status:", error);
        }
      }
    };
    checkNetworkStatus();
  }, []);

  const [isCowrieLoading, setIsCowrieLoading] = React.useState(false);

  const getPlanTypeData = async (network: string, category: string) => {
    // 1. Primary authoritative Cowrie plans for the selected network and category
    const cowrieBundles = CowrieService.getDataPlans(network, category);
    setPlanTypeData(cowrieBundles);

    // 2. Check backend in background if available
    const atex = await TokenManager.getToken();
    if (atex) {
      try {
        const response: any = await getPlanType({
          data: {
            token: atex,
            network: network || "mtn",
            time: category || "Weekly",
          },
        }).unwrap();

        if (response.status === "success" && response.data_plans && response.data_plans.length > 0) {
          setPlanTypeData(response.data_plans);
        }
      } catch (error: any) {
        // Fallback to cowrieBundles
      }
    }
  };

  React.useEffect(() => {
    getPlanTypeData(formData.network, activePlanType);
  }, [formData.network, activePlanType]);

  const PurchaseData = async () => {
    setIsCowrieLoading(true);
    try {
      // 1. Try Cowrie VAS Data Integration (https://github.com/cowriesys/airtime)
      console.log("[Data] Purchasing data via Cowrie VAS API...");
      const selectedPlan = planTypeData?.find((p: any) => p.plan_id === formData.planId);
      const bundleCode = selectedPlan?.bundleCode || formData.planId;

      const cowrieRes = await CowrieService.vendData({
        network: formData.network,
        phone: formData.number,
        amount: formData.amount,
        bundle: bundleCode,
      });

      if (cowrieRes.success) {
        console.log("Cowrie Data Purchase Successful:", cowrieRes);
        setShowDataModal(false);
        setPin("");
        setTransactionId(cowrieRes.transid || cowrieRes.reference || "");
        toast.showToast(cowrieRes.message || "Data Purchase Successful", "success");
        setShowSuccessModal(true);
        return;
      }

      // 2. Fallback to existing backend API if Cowrie failed
      const atex = await TokenManager.getToken();
      if (atex) {
        const response: any = await buyData({
          data: {
            token: atex,
            phone: formData.number,
            pin: pin,
            data_plan: formData.planId,
          },
        }).unwrap();
        if (response.status === "success") {
          console.log("Data Purchase Successful:", response);
          setShowDataModal(false);
          setPin("");
          setTransactionId(response?.data?.transid || response?.transid);
          toast.showToast("Data Purchase Successful", "success");
          setShowSuccessModal(true);
        } else {
          setPin("");
          console.error("Data Purchase Failed:", response);
          toast.showToast(
            response.message || cowrieRes.message || "Data Purchase Failed",
            "error",
          );
        }
      } else {
        setPin("");
        toast.showToast(cowrieRes.message || "Data Purchase Failed", "error");
      }
    } catch (error: any) {
      console.error("Error purchasing data:", error);
      toast.showToast(`${error?.data?.message || error?.message || "Data purchase failed"}`, "error");
      setPin("");
    } finally {
      setIsCowrieLoading(false);
    }
  };

  React.useEffect(() => {
    const processTrade = async () => {
      if (pin && pin.length === maxLength) {
        try {
          setShowPinModal(false);
          await PurchaseData();
        } catch (error) {
          setPin("");
          console.log("Error processing trade:", error);
        }
      }
    };

    processTrade();
  }, [pin]);

  const handleContactSelect = async (): Promise<void> => {
    const selectedPhone = await selectContactPhone();
    console.log("Selected Phone:", selectedPhone);
    if (selectedPhone) {
      setFormData((prev) => ({ ...prev, number: selectedPhone }));
    }
  };

  const handleNetworkSelect = (network: any) => {
    const newNetworkId = network.id === activeNetwork?.id ? null : network.id;

    setActiveNetwork(network.id === activeNetwork?.id ? null : network);
    setFormData((prev) => ({
      ...prev,
      network: newNetworkId,
    }));

    if (newNetworkId && formData.number && formData.number.length >= 4) {
      const match = networkMapping.find((n) => n.regex.test(formData.number));
      if (match && match.name.toLowerCase() !== newNetworkId.toLowerCase()) {
        setShowNetworkMismatchModal(true);
      }
    }
  };

  const handleChangePhoneNumber = (text: string) => {
    setFormData((prev) => ({ ...prev, number: text }));
    setPhoneNumber(text);

    if (errors.number) {
      setErrors((prev) => ({ ...prev, number: "" }));
    }

    // Clear selected beneficiary if user manually changes the number
    if (text !== selectedBeneficiary.number) {
      setSelectedBeneficiary({ id: "", number: "", name: "", network: "" });
    }

    // Run detection only if number is 6+ digits
    if (text.length >= 4) {
      const match = networkMapping.find((n) => n.regex.test(text));
      if (match) {
        const identifiedNetwork = networkTypes.find(
          (net) => net.id.toLowerCase() === match.name.toLowerCase()
        );
        // Only switch network if we haven't ignored a mismatch before OR if it matches the current one?
        // Actually copy airtime logic:
        if (identifiedNetwork && identifiedNetwork.id !== activeNetwork?.id) {
          // Check mismatch logic from Airtime
          // If user manually selected a network, we might warn them? 
          // Airtime logic auto-switches activeNetwork. 
          // But Data.tsx had "ignoreMismatch" state. 
          // Let's adopt Airtime's simpler "auto switch" + "mismatch modal" pattern.

          // For now, let's just auto-switch visual active network
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setActiveNetwork(identifiedNetwork);
          setFormData((prev) => ({ ...prev, network: identifiedNetwork.id }));
        }
        setDetectedNetwork(match.name);
      } else {
        setDetectedNetwork("Unknown Network");
      }
    }
  };

  // Keep this for other fields if needed, but we mostly replaced 'number' handling
  const handleChangeFormData = (field: string, value: string) => {
    if (field === 'number') {
      handleChangePhoneNumber(value);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAmountandId = (amount: string, planId: string) => {
    setSelectedAmount(amount);
    setFormData((prev) => ({ ...prev, amount, planId }));

    if (errors.amount || errors.planId) {
      setErrors((prev) => ({ ...prev, amount: "", planId: "" }));
    }
  };

  const handleSelectBeneficiary = (item: bentypes) => {
    setSelectedBeneficiary(item);
    setShowBeneficiaryModal(false);

    // Update form data with beneficiary data
    setFormData((prev) => ({
      ...prev,
      number: item.number ?? "",
      network: activeNetwork?.name || item.network || "",
    }));
    setIsBeneficiaryExpanded(false);
  };

  useEffect(() => {
    setIgnoreMismatch(false);
  }, [formData.plan_type]);

  return (
    <>
      <SettingsHeader title="Buy Data" />

      <ThemedView className="flex-1 px-5">

        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
          accessible={false}
        >
          <View style={{ flex: 1 }}>
            {/* Phone Number Input with Network Selector */}
            <View className={`mt-6 z-50 p-2 rounded-[30px] bg-[#FFFFFF] dark:bg-[#111111] border ${errors.number ? "border-red-500" : "border-border-light dark:border-border-dark"}`}>
              <View className="relative bg-[#FFFFFF] dark:bg-[#0C0C0C]  border border-border-light dark:border-border-dark rounded-[20px]">
                {/* Network Selector (Leading Icon) */}
                <View className="absolute left-1 top-1 z-30 ">
                  <Pressable
                    className="flex-row items-center gap-1 bg-gray-100 dark:bg-dark-600 px-2 py-1 rounded-[18px]"
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setShowNetworkDropdown(!showNetworkDropdown);
                    }}
                  >
                    {activeNetwork ? (
                      <activeNetwork.icon width={36} height={36} />
                    ) : (
                      <View className="w-6 h-6 items-center justify-center">
                        {networkTypes[0]?.icon && React.createElement(networkTypes[0].icon, { width: 24, height: 24 })}
                      </View>
                    )}
                    <Ionicons
                      name="chevron-down"
                      size={12}
                      color={isDark ? "#ffffff" : "#000000"}
                    />
                  </Pressable>
                </View>

                <TextInput
                  placeholder="Enter phone number"
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  value={formData.number}
                  onChangeText={handleChangePhoneNumber}
                  keyboardType="numeric"
                  className="bg-white dark:bg-[#0C0C0C] rounded-[20px] pl-[80px] py-4 text-black dark:text-white font-primary-medium border border-transparent focus:border-primary-500"
                />
                {errors.number && (
                  <ThemedText className="!text-red-500 text-xs p-2 mt-1 ml-2">
                    {errors.number}
                  </ThemedText>
                )}

                {/* Network Dropdown */}
                {showNetworkDropdown && (
                  <>
                    <Pressable
                      style={{ position: 'absolute', top: -1000, left: -1000, right: -1000, bottom: -1000, zIndex: 40 }}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setShowNetworkDropdown(false);
                      }}
                    />
                    <View className="absolute top-[60px] w-[70%] flex-col  gap-2 left-0 right-0 bg-white dark:bg-[#111111] rounded-[30px] shadow-lg border border-border-light dark:border-border-dark z-50 p-2">
                      {networkTypes.map((network) => (
                        <Pressable
                          key={network.id}
                          className="flex-row items-center justify-between p-3  bg-gray-50 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-full"
                          onPress={() => {
                            handleNetworkSelect(network);
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setShowNetworkDropdown(false);
                          }}
                        >
                          <View className="flex-row items-center gap-3">
                            <network.icon width={28} height={28} />
                            <ThemedText className="text-b2 font-primary-medium">
                              {network.name}
                            </ThemedText>
                          </View>
                          <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${activeNetwork?.id === network.id
                            ? "border-primary-500"
                            : "border-gray-300 dark:border-gray-600"
                            }`}>
                            {activeNetwork?.id === network.id && (
                              <View className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                            )}
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </View>

              {/* Recent Beneficiaries - Accordion Style */}
              {phoneBeneficiaries.length > 0 && (
                <View
                  className="relative px-2 bg-[#FFFFFF] dark:bg-[#0C0C0C]  border border-border-light dark:border-border-dark rounded-[18px] mt-3"
                >
                  <Pressable
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setIsBeneficiaryExpanded(!isBeneficiaryExpanded);
                    }}
                    className="flex-row items-center justify-between py-2 "
                  >
                    <ThemedText
                      family="primary"
                      variant="secondary"
                      weight="regular"
                      className="text-b2"
                    >
                      Recent beneficiary
                    </ThemedText>
                    <Ionicons
                      name={isBeneficiaryExpanded ? "chevron-up" : "chevron-down"}
                      size={15}
                      color={isDark ? "#ffffff" : "#232323"}
                    />
                  </Pressable>

                  {isBeneficiaryExpanded && (
                    <View className="mt-2 gap-y-2">
                      {phoneBeneficiaries.slice(0, 3).map((bene, index) => {
                        const BeneIcon = getIconsForBeneficiary(bene as any);
                        return (
                          <Pressable
                            key={index}
                            className={`flex-row items-center gap-3 p-1 rounded-[30px] border ${formData.number === bene.id
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-border-light dark:border-border-dark bg-white dark:bg-dark-600"
                              }`}
                            onPress={() => handleSelectBeneficiary(bene)}
                          >
                            {BeneIcon ? (
                              <BeneIcon width={24} height={24} />
                            ) : (
                              <View className="w-6 h-6 rounded-full bg-gray-200 items-center justify-center">
                                <ThemedText className="text-xs">
                                  {getFirstChar(bene.network || "C")}
                                </ThemedText>
                              </View>
                            )}
                            <ThemedText className="text-b2 font-primary-medium">
                              {bene.number}
                            </ThemedText>
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

            {/* Plan Type Tabs */}
            <View className="mt-6">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="bold"
                className="text-b2"
              >
                Plan Type
              </ThemedText>
              <ScrollView
                className="flex-row mt-4"
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 24 }}
              >
                {availableCategories.map((plan, index) => (
                  <Pressable
                    key={index}
                    className={`flex-row items-center justify-center bg-light-150 dark:bg-dark-900 py-[8px] px-[20px] rounded-full mr-2 ${
                      activePlanType === plan
                        ? "border border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                        : "border border-border-light dark:border-border-dark"
                    }`}
                    onPress={() => {
                      setActivePlanType(plan);
                      setFormData((prev) => ({ ...prev, plan_type: plan }));
                    }}
                  >
                    <ThemedText
                      family="primary"
                      variant={activePlanType === plan ? "primary" : "secondary"}
                      weight="medium"
                      className={`text-b2 ${activePlanType === plan ? "text-primary-500 font-bold" : ""}`}
                    >
                      {plan}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Data Plans List */}
            {isGettingPlanType ? (
              <View className="mt-4 flex-1">
                <DataPlanSkeleton />
              </View>
            ) : (
              <FlatList
                data={planTypeData}
                renderItem={({ item, index }) => (
                  <Pressable
                    key={index}
                    className={`flex-row justify-between items-center p-4 mb-2 rounded-[24px] ${
                      formData.planId === item.plan_id
                        ? "bg-[#E8FFE4] dark:bg-[#0B2E02] border border-primary-500 "
                        : "bg-light-150 dark:bg-dark-900 border border-border-light dark:border-border-dark"
                    }`}
                    onPress={() => {
                      handleAmountandId(item.amount, item.plan_id);
                    }}
                  >
                    <View className="flex-1 pr-3">
                      <ThemedText
                        className={`text-b2 font-primary-bold ${formData.planId === item.plan_id ? "text-black dark:text-white" : ""}`}
                      >
                        {item.name || `${item.size} - ${item.duration}`}
                      </ThemedText>
                      <ThemedText
                        className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                        numberOfLines={2}
                      >
                        {item.description ? `${item.duration} • ${item.description}` : item.duration}
                      </ThemedText>
                    </View>
                    <View className="items-end">
                      <ThemedText
                        family="secondary"
                        className="text-b1 font-bold text-primary-500"
                      >
                        ₦{Number(item.amount).toLocaleString()}
                      </ThemedText>
                      {formData.planId === item.plan_id && (
                        <ThemedText className="text-primary-500 text-xs font-bold mt-0.5">
                          ✓ Selected
                        </ThemedText>
                      )}
                    </View>
                  </Pressable>
                )}
                keyExtractor={(item) => item.plan_id.toString()}
                className="mt-4 flex-1"
                contentContainerStyle={{
                  flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View className="py-4 flex-col items-center mt-3 justify-center">
                    {<icons.nohistory width={30} height={30} />}
                    <ThemedText
                      className="text-center  py-[20px] text-b2"
                      variant="secondary"
                      family="primary"
                      weight="medium"
                    >
                      No data plans available
                    </ThemedText>
                  </View>
                }
              />
            )}

            {/* Continue Button */}
            <View className={`py-[12px] ${Platform.OS === "android" ? "mb-10" : "mb-10"}`}>
              <Button
                className=""
                onPress={() => {
                  Keyboard.dismiss();
                  if (validateForm()) {
                    const amount = Number(formData.amount);
                    const balance = Number(userInfo?.bal || 0);

                    if (balance < amount) {
                      toast.showToast("Insufficient balance to perform this transaction", "error");
                      return;
                    }
                    setShowDataModal(true);
                  }
                }}
              >
                <ThemedText
                  family="primary"
                  variant="primary"
                  weight="bold"
                  className="text-b2 text-center text-white"
                >
                  Continue
                </ThemedText>
              </Button>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </ThemedView>

      {showDataModal && (
        <BuyDataModal
          visible={showDataModal}
          setVisible={setShowDataModal}
          formData={formData}
          setShowPinModal={setShowPinModal}
        />
      )}

      {showSuccessModal && (
        <BillsSuccessModal
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          onViewReceipt={() => {
            setShowSuccessModal(false);
            // Navigate to receipt
            router.push({
              pathname: paths.detailtransaction,
              params: {
                transId: transactionId,
                type: "data",
              },
            });
          }}
          billType="data"
          amount={formData.amount}
          recipient={formData.number}
          recipientName={activeNetwork?.name || formData.network}
          onSaveBeneficiaryChange={(value) => {
            if (value) {
              dispatch(
                addPhoneBeneficiary({
                  id: formData.number,
                  number: formData.number,
                  network: formData.network,
                  name: formData.network,
                })
              );
            } else {
              dispatch(
                removePhoneBeneficiary({
                  id: formData.number,
                  number: formData.number,
                  network: formData.network,
                  name: formData.network,
                })
              );
            }
          }}
        />
      )}

      {showBeneficiaryModal && (
        <>
          <BeneficiaryModal
            visible={showBeneficiaryModal}
            setVisible={setShowBeneficiaryModal}
            beneficiaryType={"phone"}
            selectedBeneficiary={selectedBeneficiary}
            setSelectedBeneficiary={setSelectedBeneficiary}
            handleSelectBeneficiary={handleSelectBeneficiary}
            formData={formData}
          />
        </>
      )}

      {showPinModal && (
        <PinEntryModal
          visible={showPinModal}
          onClose={() => setShowPinModal(false)}
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
        visible={isBuyingData || isCowrieLoading}
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
              Processing your purchase...
            </ThemedText>
            <ThemedText className="mt-2 text-b3 text-center text-gray-500">
              Please wait, do not leave this screen
            </ThemedText>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showNetworkMismatchModal}
        transparent
        animationType="fade"
      >
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="bg-white dark:bg-dark-700 p-6 rounded-xl w-[80%] items-center">
            {/* ⚠️ Warning Icon */}
            <ThemedText className="text-5xl">⚠️</ThemedText>

            <ThemedText className="mt-4 text-center text-b2 font-bold">
              Network Mismatch
            </ThemedText>
            <ThemedText className="mt-2 text-center text-b3 text-gray-600">
              You entered a number that looks like {detectedNetwork}, but you
              selected {formData.network}.
            </ThemedText>

            {/* Buttons */}
            <View className="flex-row mt-6 w-full justify-between">
              <Pressable
                className="flex-1 mr-2  bg-gray-200 py-3 rounded-xl"
                onPress={() => setShowNetworkMismatchModal(false)}
              >
                <ThemedText className="text-center !text-primary-500 font-medium text-b2">
                  Recheck
                </ThemedText>
              </Pressable>

              <Pressable
                className="flex-1 ml-2 bg-primary-500 py-3 rounded-xl"
                onPress={() => {
                  setIgnoreMismatch(true);
                  setShowNetworkMismatchModal(false);
                  // setShowDataModal(true);
                }}
              >
                <ThemedText className="text-center font-medium text-white text-b2">
                  Continue
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Data;
