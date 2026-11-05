import { SettingsHeader } from "@/components/customs/settingsHeader";
import PlanType from "@/components/modals/airtimeplantypemodal";
import BeneficiaryModal, {
  bentypes,
} from "@/components/modals/beneficiarymodals";
import BillsSuccessModal from "@/components/modals/BillsSuccessModal";
import BuyAirtimeModal from "@/components/modals/buyAirtimemodal";
import { PinEntryModal } from "@/components/modals/pinmodal";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { networkMapping, networkTypes } from "@/constant/data";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useContactPhoneSelector } from "@/hooks/useContact";
import {
  addPhoneBeneficiary,
  removePhoneBeneficiary,
} from "@/redux/beneficiary/bene_slice";
import {
  useBuyAirtimeMutation,
  useGetAirtimeNetworkStatusMutation,
} from "@/redux/bills/bills_api";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { getFirstChar, getIconsForBeneficiary } from "@/utils/bills";
import { app_config } from "@/utils/config";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { CowrieService } from "@/services/cowrie-service";
import { saveLocalTransaction, formatTransactionDate } from "@/services/local-transaction-service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
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

const smallAmounts = ["100", "150", "200", "500", "1000", "2000"];

const airtimeSchema = z.object({
  number: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(11, "Phone number must not exceed 11 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => Number(val) > 0, "Amount must be greater than 0"),

  network: z.string().min(1, "Please select a network"),
});

const Airtime = () => {
  const [selectedBeneficiary, setSelectedBeneficiary] =
    React.useState<bentypes>({
      id: "",
      number: "",
      name: "",
      network: "",
    });
  // Default to the first network (MTN)
  const [activeNetwork, setActiveNetwork] = React.useState<any>(networkTypes[0]);
  const [shpwAirtimeModal, setShowAirtimeModal] = React.useState(false);
  const [showPlanTypeModal, setShowPlanTypeModal] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [transactionId, setTransactionId] = React.useState("");
  const [cowrieReceiptData, setCowrieReceiptData] = React.useState<any>(null);
  const [showNetworkDropdown, setShowNetworkDropdown] = React.useState(false);
  const [isBeneficiaryExpanded, setIsBeneficiaryExpanded] = React.useState(false);
  const { width: deviceWidth } = Dimensions.get("window");
  const [amount, setAmount] = React.useState("");
  const [selectedAmount, setSelectedAmount] = React.useState("");
  const [showBeneficiaryModal, setShowBeneficiaryModal] = React.useState(false);
  const [formData, setFormData] = React.useState({
    number: "",
    amount: "",
    network: networkTypes[0]?.id || "", // Default to first network ID
    plan_type: "vtu",
  });
  const [detectedNetwork, setDetectedNetwork] = React.useState("");
  const [showNetworkMismatchModal, setShowNetworkMismatchModal] =
    React.useState(false);
  const [errors, setErrors] = React.useState<{ [k: string]: string }>({});
  const { phoneBeneficiaries } = useAppSelector(
    (state) => state.beneficiary,
  ) as { phoneBeneficiaries: bentypes[] };
  const dispatch = useAppDispatch();
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const router = useRouter();
  const { selectContactPhone, setPhoneNumber } = useContactPhoneSelector();
  const maxLength = 4;
  const { isDark } = useTheme();

  const toast = useToast();

  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};

  const validateForm = () => {
    const result = airtimeSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.showToast(`Please fix the errors in the form`, "error");
      return false;
    }
    setErrors({});
    return true;
  };

  const [getAirtimeNetworkStatus, { isLoading: isGettingAirtimeNetwork }] =
    useGetAirtimeNetworkStatusMutation();

  const [buyAirtime, { isLoading: isBuyingAirtime }] = useBuyAirtimeMutation();

  const handlePinSubmit = (enteredPin: string) => {
    setPin(enteredPin);
    if (enteredPin.length === maxLength) {
      setShowPinModal(false);
    }
  };

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

  const PurchaseAirtime = async () => {
    setIsCowrieLoading(true);
    try {
      // 1. Try Cowrie VAS Airtime Integration (https://github.com/cowriesys/airtime)
      console.log("[Airtime] Purchasing via Cowrie VAS API...");
      const cowrieRes = await CowrieService.vendAirtime({
        network: formData.network,
        phone: formData.number,
        amount: formData.amount,
      });

      if (cowrieRes.success) {
        console.log("Cowrie Airtime Purchase Successful:", cowrieRes);
        setShowAirtimeModal(false);
        setPin("");
        setTransactionId(cowrieRes.transid || cowrieRes.reference || "");
        const tid = cowrieRes.transid || cowrieRes.reference || ("AIR-" + Date.now().toString(16).toUpperCase());
        const formattedDate = formatTransactionDate(new Date());
        const receipt = {
          id: tid,
          transid: tid,
          role: "airtime",
          message: `${activeNetwork?.name || formData.network} Airtime Purchase`,
          network: activeNetwork?.name || formData.network,
          plan_phone: formData.number,
          amount: formData.amount,
          plan_status: 1,
          status: "success",
          plan_date: formattedDate,
          date: formattedDate,
        };
        await saveLocalTransaction(receipt);
        setCowrieReceiptData(receipt);
        toast.showToast(cowrieRes.message || "Airtime Purchase Successful", "success");
        setShowSuccessModal(true);
        return;
      }

      // If Cowrie was configured, report its error directly — do NOT silently fall back to sandbox backend!
      if (CowrieService.isConfigured()) {
        setShowAirtimeModal(false);
        setPin("");
        console.error("Cowrie Airtime Purchase Failed:", cowrieRes);
        toast.showToast(cowrieRes.message || "Airtime Purchase Failed", "error");
        return;
      }

      // 2. Fallback to existing backend API if Cowrie is unconfigured
      const atex = await TokenManager.getToken();
      if (atex) {
        const response: any = await buyAirtime({
          data: {
            token: atex,
            amount: formData.amount,
            network: formData.network,
            phone: formData.number,
            pin: pin,
            plan_type: formData.plan_type || "vtu",
          },
        }).unwrap();
        if (response.status === "success") {
          console.log("Airtime Purchase Successful:", response);
          setShowAirtimeModal(false);
          setPin("");
          setTransactionId(response?.data?.transid || response?.transid);
          toast.showToast("Airtime Purchase Successful", "success");
          setShowSuccessModal(true);
        } else {
          setPin("");
          console.error("Airtime Purchase Failed:", response);
          toast.showToast(
            response.message || cowrieRes.message || "Airtime Purchase Failed",
            "error",
          );
        }
      } else {
        setPin("");
        toast.showToast(cowrieRes.message || "Airtime Purchase Failed", "error");
      }
    } catch (error: any) {
      console.error("Error purchasing airtime:", error);
      toast.showToast(`${error?.data?.message || error?.message || "Airtime purchase failed"}`, "error");
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
          await PurchaseAirtime();
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

  // Use selectedBeneficiary if it exists, otherwise use the first beneficiary
  const displayBeneficiary = selectedBeneficiary.id
    ? selectedBeneficiary
    : phoneBeneficiaries.length > 0
      ? phoneBeneficiaries[0]
      : ({} as bentypes);
  const BeneficiaryIcon = getIconsForBeneficiary(displayBeneficiary as any);

  // console.log("", amount);

  const handleAmountSelect = (amount: string) => {
    setSelectedAmount(amount);
    setAmount(amount);
    setFormData((prev) => ({ ...prev, amount }));
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
        if (identifiedNetwork && identifiedNetwork.id !== activeNetwork?.id) {
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

  const handleChangeAmount = (text: string) => {
    setFormData((prev) => ({ ...prev, amount: text }));

    if (errors.number) {
      setErrors((prev) => ({ ...prev, number: "" }));
    }
  };

  const handleSelectBeneficiary = (item: bentypes) => {
    setSelectedBeneficiary(item);
    setShowBeneficiaryModal(false);

    if (errors.number) {
      setErrors((prev) => ({ ...prev, number: "" }));
    }

    // Find and set the active network for the beneficiary
    const network = networkTypes.find(
      (n) => n.id.toLowerCase() === item.network?.toLowerCase()
    );
    if (network) {
      setActiveNetwork(network);
    } else {
      setActiveNetwork(null);
    }

    // Update form data with beneficiary data
    setFormData((prev) => ({
      ...prev,
      number: item.number ?? "",
      network: item.network ?? "",
    }));
    setIsBeneficiaryExpanded(false);
  };


  return (
    <>
      <ThemedView className="flex-1">
        {/* Custom Header */}
        <SettingsHeader title="Buy Airtime" />

        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
          accessible={false}
        >
          <View
            style={{
              flex: 1,
              paddingHorizontal: 20,
            }}
          >


            {/* Phone Number Input with Network Selector */}
            <View className={`mt-6 z-50 p-2 rounded-[30px] bg-[#FFFFFF] dark:bg-[#111111] border ${errors.number ? "border-red-500" : "border-border-light dark:border-border-dark"}`}>
              <View
                className="relative bg-[#FFFFFF] dark:bg-[#0C0C0C]  border border-border-light dark:border-border-dark rounded-[20px]">
                {/* Network Selector (Leading Icon) */}
                <View className="absolute left-1 top-1 z-30 ">
                  <Pressable
                    className="flex-row items-center gap-1 bg-gray-100 dark:bg-dark-600 px-2 py-1 rounded-[18px]"
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setShowNetworkDropdown(!showNetworkDropdown)
                    }}
                  >
                    {activeNetwork ? (
                      <activeNetwork.icon width={36} height={36} />
                    ) : (
                      // Default to first network icon if none selected
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
                  placeholder="Enter beneficiary phone number"
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
                      setIsBeneficiaryExpanded(!isBeneficiaryExpanded)
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

            {/* Amount Section */}
            <View
              className="bg-[#FFFFFF] dark:bg-[#111111] mt-6 rounded-[20px] p-[8px] border border-border-light dark:border-border-dark"
            >
              {/* Custom Amount Input */}
              <View className="">
                {/* <Input
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChangeText={handleChangeAmount}
                  keyboardType="numeric"
                  className="!py-3 rounded-[20px] dark!bg-dark-900"
                  error={errors.amount}
                /> */}
                <TextInput
                  placeholder="Enter amount"
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  value={formData.amount}
                  onChangeText={handleChangeAmount}
                  keyboardType="numeric"
                  className="bg-white dark:bg-[#0C0C0C] rounded-[20px] px-3 py-3 text-black dark:text-white font-primary-medium border border-border-light dark:border-border-dark focus:border-primary-500 "
                />
              </View>

              {/* Amount Grid */}
              <View className="flex-row flex-wrap gap-2 justify-between mt-3">
                {smallAmounts.map((amt, index) => (
                  <Pressable
                    key={index}
                    className={`items-center justify-center py-[12px] px-[12px] rounded-[12px] bg-[#F5F5F5] dark:bg-dark-900 ${selectedAmount === amt ? "border-2 border-primary-500" : "border border-border-light dark:border-border-dark"
                      }`}
                    // Width calculation: (Screen - ScreenPadding(40) - ContainerPadding(16) - Gaps(16) - SafetyMargin(4)) / 3
                    style={{ width: (deviceWidth - 76) / 3 }}
                    onPress={() => handleAmountSelect(amt)}
                  >
                    <ThemedText
                      className={`text-b2 font-primary-bold text-center ${selectedAmount === amt ? "text-primary-500" : ""
                        }`}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      ₦{amt}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              {/* Original Amount Buttons Code (Commented Out as requested) */}
              {/* <View className="flex-row mt-6">
                {smallAmounts.map((amount, index) => (
                  <Pressable
                    key={index}
                    className={`bg-[#F5F5F5] flex-row items-center justify-center flex-wrap dark:bg-dark-700 py-[8px] p-[12px] rounded-[30px] mr-2 ${selectedAmount === amount ? "border-2 border-primary-500" : ""}`}
                    onPress={() => {
                      handleAmountSelect(amount);
                    }}
                    style={{ width: deviceWidth / 4 - 16 }}
                  >
                    <ThemedText
                      family="primary"
                      variant="primary"
                      weight="medium"
                      className="text-b2 text-center"
                    >
                      ₦{amount}
                    </ThemedText>
                  </Pressable>
                ))}
              </View> */}

              <View className="pt-[10px]">
                <Button
                  onPress={() => {
                    Keyboard.dismiss();
                    if (validateForm()) {
                      const amount = Number(formData.amount);
                      const balance = Number(userInfo?.bal || 0);

                      if (balance < amount) {
                        toast.showToast("Insufficient balance to perform this transaction", "error");
                        return;
                      }
                      setShowAirtimeModal(true);
                    }
                  }}
                  className="rounded-full py-4 bg-primary-500"
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


          </View>
        </TouchableWithoutFeedback>
      </ThemedView>

      {shpwAirtimeModal && (
        <BuyAirtimeModal
          visible={shpwAirtimeModal}
          setVisible={setShowAirtimeModal}
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
            if (cowrieReceiptData) {
              router.push({
                pathname: paths.detailtransaction,
                params: {
                  transId: transactionId,
                  type: "airtime",
                  receiptData: JSON.stringify(cowrieReceiptData),
                },
              });
            } else {
              router.push({
                pathname: paths.detailtransaction,
                params: { transId: transactionId, type: "airtime" },
              });
            }
          }}
          billType="airtime"
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
        <BeneficiaryModal
          visible={showBeneficiaryModal}
          setVisible={setShowBeneficiaryModal}
          beneficiaryType={"phone"}
          selectedBeneficiary={selectedBeneficiary}
          setSelectedBeneficiary={setSelectedBeneficiary}
          handleSelectBeneficiary={handleSelectBeneficiary}
          formData={formData}
        />
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
        visible={isBuyingAirtime || isCowrieLoading}
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
            {/* <icons.warning width={48} height={48} color="orange" /> */}

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
                  // let them continue anyway
                  setShowNetworkMismatchModal(false);
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

      <PlanType visible={showPlanTypeModal} setVisible={setShowPlanTypeModal} />
    </>
  );
};

export default Airtime;
