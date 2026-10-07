import { SettingsHeader } from "@/components/customs/settingsHeader";
import BeneficiaryModal, {
  bentypes,
} from "@/components/modals/beneficiarymodals";
import BillsSuccessModal from "@/components/modals/BillsSuccessModal";
import BuyElectricityModal from "@/components/modals/buyElectricitymodal";
import { PinEntryModal } from "@/components/modals/pinmodal";
import SelectElectricityProviderModal from "@/components/modals/selectElectricityProviderModal";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import {
  addElectricityBeneficiary,
  removeElectricityBeneficiary,
} from "@/redux/beneficiary/bene_slice";
import {
  useGetCustomerNameMutation,
  usePayBillMutation
} from "@/redux/bills/bills_api";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { getIcons, getIconsForBeneficiary } from "@/utils/bills";
import { app_config } from "@/utils/config";
import { parseImageUrl } from "@/utils/helper";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";


const amountt = ["1000", "2000", "3000", "4000", "5000", "10000"];

const electricityFormSchema = z.object({
  meternumber: z
    .string()
    .min(10, { message: "Meter number must be at least 10 digits" })
    .max(12, { message: "Meter number must be at most 12 digits" }),
  provider: z.string().min(1, { message: "Provider is required" }),
  amount: z
    .string()
    .min(1, { message: "Amount is required" })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
  metername: z.string().min(1, { message: "Meter name is required" }),
  meterplan: z.string().min(1, { message: "Meter plan is required" }),
});

type ElectricityFormData = z.infer<typeof electricityFormSchema>;
const Electricity = () => {
  const [selectedBeneficiary, setSelectedBeneficiary] =
    React.useState<bentypes>({
      id: "",
      meternumber: "",
      name: "",
      provider: "",
    });
  const { provider: initialProvider, discoId: initialDiscoId } = useLocalSearchParams();
  const [discoId, setDiscoId] = React.useState<string>(String(initialDiscoId || ""));
  const router = useRouter();
  const { width: deviceWidth } = Dimensions.get("window");

  const { isDark } = useTheme();
  const [showElectricModal, setShowElectricModal] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showProviderModal, setShowProviderModal] = React.useState(false);
  const [transactionId, setTransactionId] = React.useState<string>("");
  const [showBeneficiaryModal, setShowBeneficiaryModal] = React.useState(false);
  const [planType, setPlanType] = React.useState("prepaid");
  const [isBeneficiaryExpanded, setIsBeneficiaryExpanded] = React.useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};

  const [formData, setFormData] = React.useState({
    meternumber: "",
    provider: "",
    amount: "",
    metername: "",
    meterplan: "prepaid",
    image: "",
  });
  const maxLength = 4;
  const { electricityBeneficiaries } = useAppSelector(
    (state) => state.beneficiary,
  ) as { electricityBeneficiaries: bentypes[] };
  const dispatch = useAppDispatch();
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [pin, setPin] = React.useState<string>("");
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const toast = useToast();
  const isMobile = Platform.OS === "ios" ? false : true;
  // const { atex } = useAuthToken();

  // Add state for manual verification
  const [isManualVerification, setIsManualVerification] = React.useState(false);
  const [hasVerifiedCustomer, setHasVerifiedCustomer] = React.useState(false);

  const handlePinSubmit = (enteredPin: string) => {
    setPin(enteredPin);
    if (enteredPin.length === maxLength) {
      setShowPinModal(false);
    }
  };

  const [getCustomerName, { isLoading: isLoadingCustomerName }] =
    useGetCustomerNameMutation();

  const [payBill, { isLoading: isBuyingBill }] = usePayBillMutation();

  const getCableNameData = useCallback(
    async () => {
      const atex = await TokenManager.getToken();
      try {
        const response: any = await getCustomerName({
          data: {
            token: atex,
            // cable: provider,
            meter_number: formData.meternumber,
            meter_type: planType,
            disco: discoId,
          },
        }).unwrap();

        if (response.status === "success") {
          // console.log("Cable Name Response:", response);
          setFormData((prev) => ({
            ...prev,
            metername: response.customer_name,
          }));
          setHasVerifiedCustomer(true); // Mark as verified on success
          toast.showToast("Customer verified successfully", "success");
        } else {
          console.error("Failed to fetch cable name:", response);
          setFormData((prev) => ({
            ...prev,
            metername: "",
          }));
          toast.showToast(`${response.message}`, "error");
        }
      } catch (error: any) {
        toast.showToast(`${error?.data?.message}`, "error");
        console.error("Error fetching cable name:", error);
        setFormData((prev) => ({
          ...prev,
          metername: "",
        }));
      } finally {
        setIsManualVerification(false);
      }
    },
    [formData.meternumber, planType, discoId, getCustomerName],
  );

  const handleVerifyCustomer = async () => {
    if (formData.meternumber.length >= 5 && formData.provider) {
      setIsManualVerification(true);
      await getCableNameData();
    }
  };

  const validateForm = (): boolean => {
    try {
      electricityFormSchema.parse(formData);
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

  // Remove the automatic useEffect that was causing issues

  const PurchaseElectricity = async () => {
    try {
      const atex = await TokenManager.getToken();
      const response: any = await payBill({
        data: {
          token: atex,
          meter_number: formData.meternumber,
          pin: pin,
          meter_type: planType,
          amount: formData.amount,
          disco: discoId,
        },
      }).unwrap();
      if (response.status === "success") {
        toast.showToast(`${response.message}`, "success");
        console.log("Buy Cable Response:", response);
        // setFormData({
        //   meternumber: "",
        //   provider: "",
        //   amount: "",
        //   metername: "",
        //   meterplan: "prepaid",
        // });
        setPin("");
        setShowPinModal(false);
        setHasVerifiedCustomer(false); // Reset verification state
        setShowElectricModal(false);
        setTransactionId(response?.data?.transid || response?.transid);
        setShowSuccessModal(true);

        // router.push({
        //   pathname: paths.bills.billReceipt,
        //   params: {
        //     transId: response?.data?.transid || response?.transid,
        //     type: "bill",
        //   },
        // });
      } else {
        toast.showToast(`${response.message}`, "error");
        console.error("Failed to buy cable:", response);
        setPin("");
      }
    } catch (error: any) {
      toast.showToast(`${error?.data?.message}`, "error");
      setPin("");
      console.error("Error buying cable:", error);
    }
  };

  React.useEffect(() => {
    const processTrade = async () => {
      if (pin && pin.length === maxLength) {
        try {
          setShowPinModal(false);
          await PurchaseElectricity();
        } catch (error) {
          setPin("");
          console.log("Error processing trade:", error);
        }
      }
    };

    processTrade();
  }, [pin]);

  React.useEffect(() => {
    if (initialProvider) {
      setFormData((prev) => ({
        ...prev,
        provider: String(initialProvider || prev.provider),
      }));
    }
    if (initialDiscoId) {
      setDiscoId(String(initialDiscoId));
    }
  }, [initialProvider, initialDiscoId]);

  // Reset verification when meter number changes
  const hnadleChangeCardNumber = (text: string) => {
    setFormData((prev) => ({
      ...prev,
      meternumber: text,
    }));

    // Reset verification state when user edits the number
    if (hasVerifiedCustomer && text !== formData.meternumber) {
      setHasVerifiedCustomer(false);
      setFormData((prev) => ({ ...prev, metername: "" }));
    }

    if (errors.meternumber) {
      setErrors((prev) => ({ ...prev, meternumber: "" }));
    }
  };

  const handleAccountNameChange = (text: string) => {
    setFormData((prev) => ({
      ...prev,
      metername: text,
    }));

    if (errors.metername) {
      setErrors((prev) => ({ ...prev, metername: "" }));
    }
  };

  const handleAmountChange = (text: string) => {
    setFormData((prev) => ({
      ...prev,
      amount: text,
    }));

    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: "" }));
    }
  };

  const handleSelectBeneficiary = (item: bentypes) => {
    setSelectedBeneficiary(item);
    setShowBeneficiaryModal(false);

    // Update form data with beneficiary data
    setFormData((prev) => ({
      ...prev,
      meternumber: item.meternumber ?? "",
      provider: item.provider ?? "",
    }));

    // Reset verification state when selecting beneficiary
    setHasVerifiedCustomer(false);
    setFormData((prev) => ({ ...prev, metername: "" }));
    setIsBeneficiaryExpanded(false);
  };

  // Show verify button when:
  // - Meter number has at least 5 digits
  // - Provider is selected
  // - Customer hasn't been verified yet
  const showVerifyButton =
    formData.meternumber.length >= 5 && formData.provider && !hasVerifiedCustomer;

  const getFirstChar = (text: string) => {
    return text.charAt(0).toUpperCase();
  };
  const theFirstBeneficiary =
    electricityBeneficiaries.length > 0
      ? electricityBeneficiaries[0]
      : ({} as bentypes);
  const CableBeneIcon = getIconsForBeneficiary(theFirstBeneficiary as any);
  const Cabic = getIcons(String(formData.provider));

  // console.log(
  //   "electricityBeneficiaries",
  //   selectedBeneficiary.id,
  //   formData.meternumber,
  // );

  return (
    <>
      <SettingsHeader
        title="Electricity"
      />
      <ThemedView
        className={`flex-1 ${Platform.OS === "ios" ? "" : ""}   px-[24px]`}
        style={{
          height: "100%",
        }}
      >
        <SafeAreaView className="flex-1" edges={["bottom"]}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
              showsVerticalScrollIndicator={false}
            >
              <View
                className="bg-[#FFFFFF] dark:bg-[#111111] mt-8 rounded-[20px] px-[6px] border border-border-light dark:border-border-dark"
              >
                {/* METER plan */}
                <View className="">
                  <View className="flex-row items-center gap-2 mt-2 bg-light-150 dark:bg-dark-900 p-1 rounded-[20px] border border-border-light dark:border-border-dark">
                    <Pressable
                      onPress={() => {
                        setPlanType("prepaid");
                        setFormData(prev => ({ ...prev, meterplan: "prepaid" }));
                      }}
                      className={`px-4 py-3 rounded-full flex-1  ${planType === "prepaid"
                        ? "bg-white dark:bg-[#111111]"
                        : ""
                        }`}
                    >
                      <ThemedText
                        family="primary"
                        variant="secondary"
                        weight="medium"
                        className={`text-b2 text-center ${planType === "prepaid"
                          ? "!text-primary-500"
                          : ""
                          }`}
                      >
                        Prepaid
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setPlanType("postpaid");
                        setFormData(prev => ({ ...prev, meterplan: "postpaid" }));
                      }}
                      className={`px-4 py-2 rounded-full flex-1  ${planType === "postpaid"
                        ? "bg-white dark:bg-[#111111] "
                        : ""
                        }`}
                    >
                      <ThemedText
                        family="primary"
                        variant="secondary"
                        weight="medium"
                        className={`text-b2 text-center ${planType === "postpaid"
                          ? "!text-primary-500"
                          : ""
                          }`}
                      >
                        Postpaid
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* selected provider */}
                <View className="">
                  {/* <View className="flex-1 mt-2"> */}
                  <Pressable
                    className="border  border-border-light dark:border-border-dark flex-row justify-between items-center rounded-[20px] p-3 mt-2 bg-light-150 dark:bg-dark-900"
                    onPress={() => {
                      setShowProviderModal(true);
                    }}
                  >
                    {/* this is for selected new provider or form the beneficiary */}
                    <View className="flex-row items-center gap-2">
                      {formData.image ? (
                        <Image
                          source={{ uri: parseImageUrl(formData.image) }}
                          style={{ width: 28, height: 28 }}
                          className="rounded-full"
                        />
                      ) : Cabic ? (
                        <Cabic width={28} height={28} />
                      ) : (
                        <View className="bg-white dark:bg-dark-500 w-8 h-8 items-center justify-center rounded-full">
                          <ThemedText className="text-xs">
                            {getFirstChar(String(formData.provider) || "C")}
                          </ThemedText>
                        </View>
                      )}
                      <ThemedText
                        family="primary"
                        variant="primary"
                        weight="medium"
                        className={`text-b2`}
                      >
                        {formData.provider || "Select Electricity Provider"}
                      </ThemedText>
                    </View>
                    <ChevronRight
                      width={20}
                      height={20}
                      color={isDark ? "white" : "black"}
                    />
                  </Pressable>
                  {/* </View> */}
                </View>

                {/* meter/account number */}
                <View className="mt-2">
                  <Input
                    // label="Meter/Account number"
                    placeholder="Your 11 digit smart card number"
                    value={formData.meternumber}
                    onChangeText={hnadleChangeCardNumber}
                    keyboardType="phone-pad"
                    className="rounded-[20px] bg-light-150 dark:!bg-dark-900"
                    error={errors.meternumber}
                    trailingIcon={
                      <>
                        {showVerifyButton && (
                          <Pressable
                            onPress={handleVerifyCustomer}
                            disabled={isManualVerification}
                            className=" bg-primary-500 px-2 py-1 rounded-full flex-row items-center justify-center"
                          >
                            {isManualVerification ? (
                              <>
                                <ActivityIndicator size="small" color="white" />
                                {/* <ThemedText className="text-white ml-2 text-b2">
                                Verifying...
                              </ThemedText> */}
                              </>
                            ) : (
                              <ThemedText className="text-white text-b2">
                                verify
                              </ThemedText>
                            )}
                          </Pressable>
                        )}
                      </>
                    }
                  />
                </View>
                {/* METTER Name */}
                {!isLoadingCustomerName && formData.metername && (
                  <View className="mt-2">
                    <Input
                      // label="Meter name"
                      placeholder="Customer name"
                      value={formData.metername}
                      onChangeText={handleAccountNameChange}
                      keyboardType="phone-pad"
                      className="rounded[20px] bg-light-150 dark:!bg-dark-900"
                      error={errors.metername}
                      disabled={true}
                      trailingIcon={
                        isLoadingCustomerName ? <ActivityIndicator /> : undefined
                      }
                    />
                  </View>
                )}

                {electricityBeneficiaries.length > 0 && (
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
                        {electricityBeneficiaries.slice(0, 3).map((bene, index) => {
                          const BeneIcon = getIconsForBeneficiary(bene as any);
                          return (
                            <Pressable
                              key={index}
                              className={`flex-row items-center gap-3 p-1 rounded-[30px] border ${formData.meternumber === bene.meternumber
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
                                    {getFirstChar(theFirstBeneficiary?.provider || "C")}
                                  </ThemedText>
                                </View>
                              )}
                              <ThemedText className="text-b2 font-primary-medium">
                                {bene.meternumber}
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

              {/* batch 2 */}
              <View
                className="bg-[#FFFFFF] dark:bg-[#111111] mt-6 rounded-[20px] p-[8px] border border-border-light dark:border-border-dark"
              >
                <View className="">
                  <TextInput
                    placeholder="Enter amount"
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={formData.amount}
                    onChangeText={handleAmountChange}
                    keyboardType="numeric"
                    className="bg-white dark:bg-[#0C0C0C] rounded-[20px] py-3 px-3 text-black dark:text-white font-primary-medium border border-border-light dark:border-border-dark focus:border-primary-500 "
                  />
                  {errors.amount && (
                    <ThemedText className="!text-red-500 text-b2 pt-2 pl-2">
                      {errors.amount}
                    </ThemedText>
                  )}
                </View>

                <View className="flex-row flex-wrap gap-2 mt-3">
                  {amountt.map((amt, index) => (
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

                <Button
                  className="mt-6"
                  onPress={() => {
                    Keyboard.dismiss();
                    if (validateForm()) {
                      const amount = Number(formData.amount.replace(/,/g, ""));
                      const balance = Number(userInfo?.bal || 0);

                      if (balance < amount) {
                        toast.showToast("Insufficient balance to perform this transaction", "error");
                        return;
                      }
                      setShowElectricModal(true);
                    }
                  }}
                >
                  <ThemedText
                    family="primary"
                    variant="primary"
                    weight="bold"
                    className="text-b1 text-center text-white"
                  >
                    Continue
                  </ThemedText>
                </Button>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </ThemedView>

      {showElectricModal && (
        <BuyElectricityModal
          visible={showElectricModal}
          setVisible={setShowElectricModal}
          formData={formData}
          setShowPinModal={setShowPinModal}
          showPinModal={showPinModal}
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
                type: "bill",
              },
            });
          }}
          billType="electricity"
          amount={formData.amount}
          recipient={formData.meternumber}
          recipientName={formData.provider}
          onSaveBeneficiaryChange={(value) => {
            if (value) {
              dispatch(
                addElectricityBeneficiary({
                  id: formData.meternumber,
                  meternumber: formData.meternumber,
                  provider: formData.provider,
                  name: formData.metername || "No Meter Name",
                })
              );
            } else {
              dispatch(
                removeElectricityBeneficiary({
                  id: formData.meternumber,
                  meternumber: formData.meternumber,
                  provider: formData.provider,
                  name: formData.metername || "No Meter Name",
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
            beneficiaryType={"electricity"}
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

      {showProviderModal && (
        <SelectElectricityProviderModal
          visible={showProviderModal}
          onClose={() => setShowProviderModal(false)}
          onSelect={(elect: any) => {
            setFormData((prev) => ({
              ...prev,
              provider: elect.name,
              image: elect.image || "",
            }));
            setDiscoId(elect.unique_identifier);
            setShowProviderModal(false);
          }}
          selectedId={discoId}
        />
      )}

      <Modal
        visible={isBuyingBill}
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
    </>
  );
};

export default Electricity;
