import { SettingsHeader } from "@/components/customs/settingsHeader";
import BeneficiaryModal, {
  bentypes,
} from "@/components/modals/beneficiarymodals";
import BillsSuccessModal from "@/components/modals/BillsSuccessModal";
import BuyCableModal from "@/components/modals/buyCablemodal";
import CablePackageModal from "@/components/modals/cablepackage";
import { PinEntryModal } from "@/components/modals/pinmodal";
import SelectCableProviderModal from "@/components/modals/selectCableProviderModal";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import {
  addCableBeneficiary,
  removeCableBeneficiary,
} from "@/redux/beneficiary/bene_slice";
import {
  useBuyCableMutation,
  useGetCableNameMutation,
} from "@/redux/bills/bills_api";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { getIcons, getIconsForBeneficiary } from "@/utils/bills";
import { app_config } from "@/utils/config";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const cableFormSchema = z.object({
  cablenumber: z
    .string()
    .min(10, "Smart card number must be at least 10 digits")
    .max(11, "Smart card number must not exceed 11 digits")
    .regex(/^\d+$/, "Smart card number must contain only numbers"),
  cableNetwork: z.string().min(1, "Please select a cable provider"),
  cableplan: z.string().min(1, "Please select a cable package"),
  accountName: z.string().min(1, "Account name is required"),
});

const Cable = () => {
  const [selectedBeneficiary, setSelectedBeneficiary] =
    React.useState<bentypes>({
      id: "",
      cablenumber: "",
      name: "",
      cableNetwork: "",
    });
  const { cableNetwork, cablenumber } = useLocalSearchParams();
  const [showCablePackageModal, setShowCablePackageModal] =
    React.useState(false);
  const [showProviderModal, setShowProviderModal] = React.useState(false);
  const router = useRouter();
  const { isDark } = useTheme();
  const [showBuyModal, setShowBuyModal] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [transactionId, setTransactionId] = React.useState<string>("");
  const [showBeneficiaryModal, setShowBeneficiaryModal] = React.useState(false);
  const [isBeneficiaryExpanded, setIsBeneficiaryExpanded] = React.useState(false);

  const [formData, setFormData] = React.useState({
    cablenumber: "",
    cableNetwork: "",
    cableImage: "",
    amount: "",
    accountName: "",
    cableplan: "",
    cablePlanId: "",
    unique_identifier: "",
  });
  const [errors, setErrors] = React.useState<{ [k: string]: string }>({});
  const maxLength = 4;
  const { cableBeneficiaries } = useAppSelector(
    (state) => state.beneficiary,
  ) as { cableBeneficiaries: bentypes[] };
  const dispatch = useAppDispatch();
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [pin, setPin] = React.useState<string>("");
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};
  const toast = useToast();

  console.log('form', formData)

  const [getCableName, { isLoading: isLoadingCableName }] =
    useGetCableNameMutation();

  const [buyCable, { isLoading: isBuyingCable }] = useBuyCableMutation();

  const getCableNameData = async (network: string) => {
    try {
      const atex = await TokenManager.getToken();
      const response: any = await getCableName({
        data: {
          token: atex,
          cable: network,
          iuc: formData.cablenumber,
          unique_identifier: formData.unique_identifier,
        },
      }).unwrap();
      if (response.status === "success") {
        setFormData((prev) => ({
          ...prev,
          accountName: response.customer_name,
        }));
        toast.showToast("Customer verified successfully", "success");
      } else {
        toast.showToast(`${response.message}`, "error");
      }
    } catch (error: any) {
      toast.showToast(
        `${error?.data?.message || error?.message || ""}`,
        "error",
      );
    }
  };

  const validateForm = (): boolean => {
    try {
      cableFormSchema.parse(formData);
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
        const firstError = error.issues[0];
        toast.showToast(firstError.message, "error");
        return false;
      }
      return false;
    }
  };

  useEffect(() => {
    if (formData.cableNetwork && formData.cablenumber.length >= 10) {
      if (errors.accountName) {
        setErrors((prev) => ({ ...prev, accountName: "" }));
      }
      getCableNameData(formData.cableNetwork);
    }
  }, [formData.cableNetwork, formData.cablenumber, formData.unique_identifier]);

  const PurchaseCable = async () => {
    try {
      const atex = await TokenManager.getToken();
      const response: any = await buyCable({
        data: {
          token: atex,
          cable_name: formData.cableNetwork,
          iuc: formData.cablenumber,
          pin: pin,
          cable_plan: formData.unique_identifier,
        },
      }).unwrap();
      if (response.status === "success") {
        toast.showToast(`${response.message}`, "success");
        setShowBuyModal(false);
        setPin("");
        setTransactionId(response?.data?.transid || response?.transid);
        setShowSuccessModal(true);
      } else {
        toast.showToast(`${response.message}`, "error");
        setPin("");
      }
    } catch (error) {
      toast.showToast(`An error occurred. Please try again.`, "error");
      setPin("");
    }
  };

  React.useEffect(() => {
    const processTrade = async () => {
      if (pin && pin.length === maxLength) {
        try {
          setShowPinModal(false);
          await PurchaseCable();
        } catch (error) {
          setPin("");
        }
      }
    };
    processTrade();
  }, [pin]);

  const handlePinSubmit = (enteredPin: string) => {
    setPin(enteredPin);
    if (enteredPin.length === maxLength) {
      setShowPinModal(false);
    }
  };

  useEffect(() => {
    if (cableNetwork || cablenumber) {
      setFormData((prev) => ({
        ...prev,
        cableNetwork: String(cableNetwork || prev.cableNetwork),
        cablenumber: String(cablenumber || prev.cablenumber),
      }));
    }
  }, [cableNetwork, cablenumber]);

  const getFirstChar = (text: string) => {
    return text.charAt(0).toUpperCase();
  };
  const theFirstBeneficiary =
    cableBeneficiaries.length > 0 ? cableBeneficiaries[0] : ({} as bentypes);
  const Cabic = getIcons(String(formData.cableNetwork));

  const hnadleChangeCardNumber = (text: string) => {
    setFormData((prev) => ({
      ...prev,
      cablenumber: text,
    }));
    if (errors.cablenumber) {
      setErrors((prev) => ({ ...prev, cablenumber: "" }));
    }
  };

  const handleAccountNameChange = (text: string) => {
    setFormData((prev) => ({
      ...prev,
      accountName: text,
    }));
    if (errors.accountName) {
      setErrors((prev) => ({ ...prev, accountName: "" }));
    }
  };

  const handleSelectBeneficiary = (item: bentypes) => {
    setSelectedBeneficiary(item);
    setShowBeneficiaryModal(false);
    setFormData((prev) => ({
      ...prev,
      cablenumber: item.cablenumber ?? "",
      cableNetwork: item.cableNetwork ?? "",
      cableImage: "",
      accountName: "",
    }));
    setIsBeneficiaryExpanded(false);
  };

  const handleChangeCablePlan = (
    network: string,
    amt: string,
    planId: string,
    unique_identifier: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      cableplan: network,
      amount: amt,
      cablePlanId: planId,
      unique_identifier: unique_identifier,
    }));
    setShowCablePackageModal(false);
  };

  return (
    <>
      <SettingsHeader title="Cable subscription" />
      <ThemedView
        className={`flex-1 ${Platform.OS === "ios" ? "" : ""}   px-[24px]`}
        style={{ height: "100%" }}
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
              <View className="bg-[#FFFFFF] dark:bg-[#111111] mt-8 rounded-[20px] px-[6px] border border-border-light dark:border-border-dark">
                {/* selected provider */}
                <View className="mt-2">
                  <Pressable
                    className={`border ${errors.cableNetwork ? "border-red-500" : "border-border-light dark:border-border-dark"} flex-row justify-between items-center rounded-[20px] p-3 mt-2 bg-[#FCFCFC] dark:bg-dark-900`}
                    onPress={() => {
                      setShowProviderModal(true);
                    }}
                  >
                    <View className="flex-row items-center gap-2">
                      {formData.cableImage ? (
                        <Image
                          source={{ uri: formData.cableImage }}
                          style={{ width: 28, height: 28, borderRadius: 14 }}
                          resizeMode="contain"
                        />
                      ) : Cabic ? (
                        <Cabic width={28} height={28} />
                      ) : (
                        // <View className="bg-white dark:bg-dark-500 w-8 h-8 items-center justify-center rounded-full">
                        //   <ThemedText className="text-xs">
                        //     {getFirstChar(String(formData.cableNetwork) || "C")}
                        //   </ThemedText>
                        // </View>
                        <></>
                      )}
                      <ThemedText
                        family="primary"
                        variant="primary"
                        weight="medium"
                        className="text-b2"
                      >
                        {formData.cableNetwork || "Select Cable Provider"}
                      </ThemedText>
                    </View>
                    <ChevronRight width={20} height={20} color={isDark ? "white" : "black"} />
                  </Pressable>
                </View>



                {/* Choose package */}
                <View className="mt-2 mb-3">
                  <Pressable
                    className={`border ${errors.cableplan ? "border-red-500" : "border-border-light dark:border-border-dark"} flex-row justify-between items-center rounded-[20px] p-3 mt-2 bg-[#FCFCFC] dark:bg-dark-900`}
                    onPress={() => {
                      setShowCablePackageModal(true);
                    }}
                  >
                    <View className="flex-row items-center gap-2">
                      <ThemedText
                        family="primary"
                        variant="secondary"
                        weight="medium"
                        className="text-b2"
                      >
                        {formData.cableplan
                          ? `${formData.cableplan} - ₦${formData.amount}`
                          : "Choose Package"}
                      </ThemedText>
                    </View>
                    <ChevronRight width={20} height={20} color={isDark ? "white" : "black"} />
                  </Pressable>
                  {errors.cableplan && (
                    <ThemedText className="!text-red-500 text-xs px-2 mt-1">
                      {errors.cableplan}
                    </ThemedText>
                  )}
                </View>

                {/* Animated Beneficiary Accordion */}
                {cableBeneficiaries.length > 0 && (
                  <View className="relative px-2 bg-[#FFFFFF] dark:bg-[#0C0C0C] border border-border-light dark:border-border-dark rounded-[18px] mb-3">
                    <Pressable
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setIsBeneficiaryExpanded(!isBeneficiaryExpanded);
                      }}
                      className="flex-row items-center justify-between py-2"
                    >
                      <ThemedText family="primary" variant="secondary" weight="regular" className="text-b2">
                        Recent beneficiary
                      </ThemedText>
                      <Ionicons
                        name={isBeneficiaryExpanded ? "chevron-up" : "chevron-down"}
                        size={15}
                        color={isDark ? "#ffffff" : "#232323"}
                      />
                    </Pressable>

                    {isBeneficiaryExpanded && (
                      <View className="mt-2 gap-y-2 mb-2">
                        {cableBeneficiaries.slice(0, 3).map((bene, index) => {
                          const BeneIcon = getIconsForBeneficiary(bene as any);
                          return (
                            <Pressable
                              key={index}
                              className={`flex-row items-center gap-3 p-1 rounded-[30px] border ${formData.cablenumber === bene.cablenumber
                                ? "border-primary-500 bg-[#FCFCFC] dark:bg-primary-900"
                                : "border-border-light dark:border-border-dark bg-white dark:bg-dark-600"
                                }`}
                              onPress={() => handleSelectBeneficiary(bene)}
                            >
                              {BeneIcon ? (
                                <BeneIcon width={24} height={24} />
                              ) : (
                                <View className="w-6 h-6 rounded-full bg-gray-200 items-center justify-center">
                                  <ThemedText className="text-xs">
                                    {getFirstChar(bene?.cableNetwork || "C")}
                                  </ThemedText>
                                </View>
                              )}
                              <ThemedText className="text-b2 font-primary-medium">
                                {bene.cablenumber}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                        <Pressable className="items-center py-2" onPress={() => setShowBeneficiaryModal(true)}>
                          <ThemedText className="text-primary-500 text-b3 font-primary-medium">
                            View all
                          </ThemedText>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}

                {/* smart card number */}
                <View className="mt-2">
                  <Input
                    placeholder="Your 11 digit smart card number"
                    value={formData.cablenumber}
                    onChangeText={hnadleChangeCardNumber}
                    keyboardType="phone-pad"
                    className="rounded-[20px] bg-[#FCFCFC] dark:!bg-dark-900"
                    error={errors.cablenumber}
                  />
                </View>

                {/* account name  */}
                {(isLoadingCableName || formData.accountName) && (
                  <View className="mt-2">
                    <Input
                      placeholder="Account name will appear here"
                      value={formData.accountName}
                      onChangeText={handleAccountNameChange}
                      className="rounded-[20px] !bg-[#FCFCFC] dark:!bg-dark-900"
                      error={errors.accountName}
                      disabled={true}
                      trailingIcon={isLoadingCableName ? <ActivityIndicator /> : undefined}
                    />
                  </View>
                )}
              </View>

              <View className="mt-6">
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
                      setShowBuyModal(true);
                    }
                  }}
                >
                  <ThemedText family="primary" variant="primary" weight="bold" className="text-b1 text-center text-white">
                    Continue
                  </ThemedText>
                </Button>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </ThemedView>

      {showProviderModal && (
        <SelectCableProviderModal
          visible={showProviderModal}
          onClose={() => setShowProviderModal(false)}
          onSelect={(cable: any) => {
            setFormData((prev) => ({
              ...prev,
              cableNetwork: cable.name,
              cableImage: cable.image || "",
              cableplan: "",
              cablePlanId: "",
              amount: "",
              accountName: "",
            }));
            setShowProviderModal(false);
          }}
          selectedId={formData.cableNetwork}
        />
      )}

      {showBuyModal && (
        <BuyCableModal
          visible={showBuyModal}
          setVisible={setShowBuyModal}
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
            router.push({
              pathname: paths.detailtransaction,
              params: { transId: transactionId, type: "cable" },
            });
          }}
          billType="cable"
          amount={formData.amount}
          recipient={formData.cablenumber}
          recipientName={formData.cableNetwork}
          onSaveBeneficiaryChange={(value) => {
            if (value) {
              dispatch(addCableBeneficiary({
                id: formData.cablenumber,
                cablenumber: formData.cablenumber,
                cableNetwork: formData.cableNetwork,
              }));
            } else {
              dispatch(removeCableBeneficiary({
                id: formData.cablenumber,
                cablenumber: formData.cablenumber,
                cableNetwork: formData.cableNetwork,
              }));
            }
          }}
        />
      )}

      {showBeneficiaryModal && (
        <BeneficiaryModal
          visible={showBeneficiaryModal}
          setVisible={setShowBeneficiaryModal}
          beneficiaryType={"cable"}
          selectedBeneficiary={selectedBeneficiary}
          setSelectedBeneficiary={setSelectedBeneficiary}
          handleSelectBeneficiary={handleSelectBeneficiary}
          formData={formData}
        />
      )}

      {showCablePackageModal && (
        <CablePackageModal
          visible={showCablePackageModal}
          setVisible={setShowCablePackageModal}
          formData={formData}
          setFormData={setFormData}
          handleChangeCablePlan={handleChangeCablePlan}
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

      <Modal visible={isBuyingCable} transparent={true} animationType="fade" statusBarTranslucent={true}>
        <View className="flex-1 bg-black/70 justify-center items-center">
          <View className="bg-white dark:bg-dark-700 p-6 rounded-xl items-center mx-4">
            <ActivityIndicator size="large" color={colorThemes[app_config.theme][500]} />
            <ThemedText className="mt-4 text-b2">Processing your purchase...</ThemedText>
            <ThemedText className="mt-2 text-b3 text-center text-gray-500">
              Please wait, do not leave this screen
            </ThemedText>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Cable;
