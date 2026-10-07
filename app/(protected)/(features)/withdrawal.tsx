import BankModal from "@/components/modals/banksmodal";
import ConfirmWithdrawal from "@/components/modals/confirmWithdrawal";
import { PinEntryModal } from "@/components/modals/pinmodal";
import { WithdrawalSuccessModal } from "@/components/modals/WithdrawalSuccessModal";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form-fields";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { addRecentWithdrawal } from "@/redux/recent/recent_withdrawal_slice";
import {
  useGetAccountNameMutation,
  useSaveBanksMutation,
  useWithdrawMutation,
} from "@/redux/settings/settings";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { getFirstChar } from "@/utils/bills";
import { app_config } from "@/utils/config";
import { paths } from "@/utils/paths";
import { useRouter } from "expo-router";
import { CheckIcon, ChevronDown, ChevronRightIcon } from "lucide-react-native";
import React from "react";
import { z } from "zod";

import { SettingsHeader } from "@/components/customs/settingsHeader";
import { formatNumber } from "@/utils/formatamount";
import { TokenManager } from "@/utils/secure-store-adapter";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
  View,
} from "react-native";
// import Animated from "react-native-reanimated";
import { icons } from "@/constant/icon";

const withdrawalSchema = z.object({
  accountNumber: z
    .string()
    .min(10, "Account number must be 10 digits")
    .max(10, "Account number must be 10 digits")
    .regex(/^\d+$/, "Account number must contain only numbers"),
  accountName: z
    .string()
    .min(3, "Account name is required")
    .max(100, "Account name is too long"),
  bankName: z.string().min(1, "Please select a bank"),
  // bankCode: z.string().min(1, "Bank code is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be greater than 0",
    }),
  // .refine((val) => Number(val) >= 100, {
  //   message: "Minimum withdrawal amount is ₦100",
  // }),
  // description: z
  //   .string()
  //   .min(1, "Description is required")
  //   .max(500, "Description is too long"),
  bankUrl: z.string().optional(),
});

const firstStepSchema = z.object({
  accountNumber: z
    .string()
    .min(10, "Account number must be 10 digits")
    .max(10, "Account number must be 10 digits")
    .regex(/^\d+$/, "Account number must contain only numbers"),
  accountName: z
    .string()
    .min(3, "Account name is required")
    .max(100, "Account name is too long"),
  bankName: z.string().min(1, "Please select a bank"),
  bankUrl: z.string().optional(),
});

const secondStepSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be greater than 0",
    }),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

export const AccountItem = ({ item, onPress, isSelected }: any) => {
  const { isDark } = useTheme();

  return (
    <Pressable
      onPress={() => onPress && onPress(item)}
      className={`flex-row items-center justify-between my-1 rounded-[20px] p-2 ${isSelected
        ? "bg-primary-500 border-2 border-primary-600"
        : "bg-light-150 dark:bg-[#0C0C0C] border border-[#EFEFEF] dark:border-[#232323]"
        }`}
    >
      <View className="flex-row items-center gap-2 flex-1">
        {/* Icon */}
        {(item.image || item.bankUrl) ? (
          <Image
            source={{
              uri: (item.image || item.bankUrl)?.startsWith("http") ? (item.image || item.bankUrl) : ``,
            }}
            style={{ width: 32, height: 32 }}
            className="rounded-full"
          />
        ) : (
          <ThemedText
            className={`${isSelected
              ? "bg-white !text-primary-500"
              : "bg-white dark:bg-dark-500"
              } w-8 h-8 text-center leading-8 rounded-full text-xs`}
          >
            {getFirstChar(item.account_name || item.accountName || "B")}
          </ThemedText>
        )}

        {/* Content */}
        <View className="flex-col gap-1 flex-1">
          <ThemedText
            family="primary"
            variant="secondary"
            weight="medium"
            className={`text-[12px] ${isSelected ? "!text-white" : ""}`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item?.account_name || item?.accountName}
          </ThemedText>
          <ThemedText
            family="primary"
            variant="primary"
            weight="medium"
            className={`text-b2 pt-1 ${isSelected ? "!text-white" : ""}`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {`${item?.bank_name || item?.bankName} | ${item?.account_number || item?.accountNumber}`}
          </ThemedText>
        </View>
      </View>

      {/* Right Icon */}
      <View>
        {isSelected ? (
          <CheckIcon width={24} height={24} color="white" />
        ) : (
          <ChevronRightIcon
            width={24}
            height={24}
            color={isDark ? "white" : "black"}
          />
        )}
      </View>
    </Pressable>
  );
};

type accountAction = "recent" | "saved";

const Withdrawal = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [formData, setFormData] = React.useState({
    accountNumber: "",
    accountName: "",
    bankName: "",
    bankCode: "",
    bankUrl: "",
    amount: "",
    description: "",
  });
  const [visible, setVisible] = React.useState(false);
  const [action, setAction] = React.useState<accountAction>("recent");
  const toast = useToast();
  const [showBanks, setShowBanks] = React.useState(false);
  const { user } = useAppSelector((state) => state.auth);
  // const { atex } = useAppSelector((state) => state.session);

  const { beneficiaries, user: userInfo } = user || {};
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [continueState, setContinueState] = React.useState<string>("first");
  const dispatch = useAppDispatch();
  const maxLength = 4;
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [selectedAmount, setSelectedAmount] = React.useState("");
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [transId, setTransId] = React.useState("");
  const [saveBanks] = useSaveBanksMutation();

  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const listAmount = ["1000", "2000", "3000", "4000"];
  const { width: deviceWidth } = Dimensions.get("window");
  // const { atex } = useAuthToken();

  const animateTransition = (toStep: "first" | "second") => {
    const toValue = toStep === "second" ? -1 : 0;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setContinueState(toStep);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Update your back button handler
  const handleBackPress = () => {
    if (continueState === "second") {
      animateTransition("first");
    } else {
      router.back();
    }
  };

  // Calculate slide transform
  const slideTransform = slideAnim.interpolate({
    inputRange: [-1, 0],
    outputRange: [300, 0], // Slide from right
  });

  const [getAccountName, { isLoading: isGettingBankName }] =
    useGetAccountNameMutation();

  const { recentBeneficiariesByUser } = useAppSelector((state) => state.recent_withdrawal);
  const userEmail = userInfo?.email || "";
  const recentBeneficiaries = recentBeneficiariesByUser[userEmail] || [];

  // Handle account press
  const handleAccountPressRecent = (account: any) => {
    setFormData({
      accountNumber: account.accountNumber || "",
      accountName: account.accountName || "",
      bankName: account.bankName || "",
      bankCode: account.bankCode || "",
      bankUrl: account.bankUrl || "",
      amount: "",
      description: "",
    });
  };


  const [withdraw, { isLoading: isWithdrawing }] = useWithdrawMutation();
  const handleGlobalChange = (value: any) => {
    if (formData?.bankName !== value?.bankname) {
      setFormData((prev) => ({
        ...prev,
        bankName: value?.bankname || "",
        bankCode: value?.bankcode || "",
        bankUrl: value?.bankurl || "",
      }));

      if (errors.bankName) {
        setErrors((prev) => ({ ...prev, bankName: "" }));
      }
    }
  };


  const validateForm = () => {
    try {
      withdrawalSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleAmountSelect = (amount: string) => {
    setSelectedAmount(amount);
    setFormData((prev) => ({ ...prev, amount }));
  };

  const validateFirstStep = () => {
    try {
      firstStepSchema.parse({
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        bankName: formData.bankName,
        bankUrl: formData.bankUrl,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const validateSecondStep = () => {
    try {
      secondStepSchema.parse({
        amount: formData.amount,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  React.useEffect(() => {
    const fetchBankName = async () => {
      if (formData?.accountNumber.length === 10 && formData?.bankCode) {
        try {
          const atex = await TokenManager.getToken();
          const response: any = await getAccountName({
            data: {
              token: atex,
              bankCode: formData?.bankCode,
              bankName: formData?.bankName,
              account_number: formData?.accountNumber,
            },
          }).unwrap();

          if (response?.status === "success") {
            setFormData((prev) => ({
              ...prev,
              accountName:
                response?.data?.account_name || response?.account_name || "",
            }));
          } else {
            toast.showToast(
              `${response?.message || "Failed to fetch account name"}`,
              "error",
            );
          }
        } catch (error) {
          toast.showToast("Error fetching account name", "error");
          console.error("Error fetching account name:", error);
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          accountName: "",
        }));
      }
    };

    fetchBankName();
  }, [formData?.accountNumber, formData?.bankCode, formData?.bankName]);

  const handleChangePhoneNumber = (text: string) => {
    setFormData((prev) => ({ ...prev, accountNumber: text }));
    if (errors.accountNumber) {
      setErrors((prev) => ({ ...prev, accountNumber: "" }));
    }
  };

  const handleChangeAmount = (text: string) => {
    setFormData((prev) => ({ ...prev, amount: text }));
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: "" }));
    }
  };
  const handleChangeDesc = (text: string) => {
    setFormData((prev) => ({ ...prev, description: text }));
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: "" }));
    }
  };

  const handleAccountPress = (account: any) => {
    setFormData({
      accountNumber: account.account_number || "",
      accountName: account.account_name || "",
      bankName: account.bank_name || "",
      bankCode: account.bank_code || "",
      bankUrl: account.image || "",
      amount: "",
      description: "",
    });
  };

  const handleSaveBeneficiary = async (shouldSave: boolean) => {
    if (!shouldSave) return;
    try {
      const token = await TokenManager.getToken();
      await saveBanks({
        data: {
          token,
          account_number: formData.accountNumber,
          bank_code: formData.bankCode,
          bank_name: formData.bankName,
          account_name: formData.accountName,
        }
      }).unwrap();
      toast.showToast("Beneficiary saved successfully", "success");
    } catch (e: any) {
      console.error("Failed to save beneficiary:", e);
    }
  };

  // console.log("Withdrawal response:", formData);

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.showToast("Please fix the errors in the form", "error");
      return;
    }

    try {
      const atex = await TokenManager.getToken();
      const response: any = await withdraw({
        data: {
          token: atex,
          amount: formData.amount,
          bankCode: formData.bankCode,
          account_number: formData.accountNumber,
          account_name: formData.accountName,
          bankName: formData.bankName,
          description: formData.description || "Nil",
        },
      }).unwrap();

      if (response?.status === "success") {
        toast.showToast("Withdrawal successful", "success");
        // router.push(paths.setting);

        dispatch(addRecentWithdrawal({
          userEmail,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
          bankName: formData.bankName,
          bankCode: formData.bankCode,
          bankUrl: formData.bankUrl,
        }));

        setPin("");
        setVisible(false);
        setTransId(response?.data?.transid || response?.transid || "");
        setShowSuccessModal(true);
      } else {
        setPin("");
        toast.showToast(
          `${response?.message || response?.data?.message || "Failed to process withdrawal"}`,
          "error",
        );
      }
    } catch (error: any) {
      toast.showToast(
        `${error?.message || error?.data?.message || "Failed to process withdrawal"}`,
        "error",
      );
      console.error("Error processing withdrawal:", error);
      setPin("");
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
          await handleSubmit();
        } catch (error) {
          setPin("");
          console.log("Error processing trade:", error);
        }
      }
    };

    processTrade();
  }, [pin]);

  const isMobile = Platform.OS === "ios" ? false : true;
  const handleLeftPress = () => {
    return (
      <Pressable
        onPress={() => router.back()}
        style={{
          marginLeft: Platform.OS === "ios" ? -4 : -8,
          padding: 8,
        }}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={isDark ? "#ffffff" : "#000000"}
        />
      </Pressable>
    );
  };

  return (
    <>
      <ThemedView
        className={`flex-1 `}
      >
        <SettingsHeader
          title='Withdraw'
        />

        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
          accessible={false}
        >
          <View style={{ flex: 1 }}>
            <Animated.View
              style={{
                flex: 1,
                opacity: fadeAnim,
                transform: [{ translateX: slideTransform }],
              }}
            >
              <View className=" px-[20px] pt-[24px]">
                {continueState === "first" && (
                  <View
                  >
                    <View
                      className="bg-[#FFFFFF] dark:bg-[#111111] px-2 pt-2 rounded-[30px] border-[#EFEFEF] dark:border-[#232323] border"
                    >
                      <Input
                        // label="Account number"
                        placeholder="Enter 11 digit account number"
                        value={formData.accountNumber}
                        onChangeText={handleChangePhoneNumber}
                        leadingIconActive={true}
                        showLeadingIcon={true}
                        // leadingIcon={<icons.contact width={24} height={24} />}
                        keyboardType="phone-pad"
                        className="!bg-[#FCFCFC] dark:!bg-[#0C0C0C] rounded-[30px]"
                        error={errors.accountNumber}
                      />

                      <View>
                        {/* <ThemedText
                        variant="primary"
                        weight="bold"
                        className="mt-[10px]"
                      >
                        Bank
                      </ThemedText> */}
                        <Pressable
                          // className="border border-border-light dark:border-border-dark flex-row justify-between items-center rounded-xl p-4 mt-2 mb-4"
                          className={`border ${errors.bankName ? "border-danger-500" : "border-border-light dark:border-border-dark"} bg-[#FFFFFF] dark:!bg-[#0C0C0C] flex-row justify-between items-center rounded-[30px] p-3 mt-2 mb-4`}
                          onPress={() => setShowBanks(true)}
                        >
                          <View className="flex-row items-center gap-2 flex-1 mr-2">
                            {formData.bankUrl ? (
                              <Image
                                source={{
                                  uri: formData.bankUrl.startsWith("http")
                                    ? formData.bankUrl
                                    : ``,
                                }}
                                style={{ width: 32, height: 32 }}
                                className="rounded-full"
                              />
                            ) : (
                              <icons.bankAt width={24} height={24} />

                            )}

                            <ThemedText
                              className="flex-1"
                              variant="primary"
                              family="primary"
                              weight="regular"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {formData.bankName
                                ? formData.bankName
                                : "Select Bank"}
                            </ThemedText>
                          </View>

                          <ChevronDown
                            width={20}
                            height={20}
                            color={isDark ? "white" : "black"}
                          />
                        </Pressable>
                        {errors.bankName && (
                          <ThemedText className="!text-danger-500 text-b3 -mt-3 mb-2">
                            {errors.bankName}
                          </ThemedText>
                        )}
                      </View>

                    </View>

                    {/* account name */}
                    {(isGettingBankName || formData.accountName) && (
                      <View className="flex-row items-center justify-start gap-2 bg-success-200  py-1 px-2 rounded-xl  ">
                        {isGettingBankName ? (
                          <ActivityIndicator size="small" color="#11A887" />
                        ) : (
                          <View className="bg-[#11A887] p-1 rounded-full">
                            <CheckIcon color={"white"} size={14} />
                          </View>
                        )}
                        <ThemedText
                          family="primary"
                          variant="primary"
                          weight="bold"
                          className="text-b2 text-center uppercase !text-[#11A887]"
                        >
                          {formData.accountName
                            ? `${formData.accountName}`
                            : ""}
                        </ThemedText>
                      </View>
                    )}

                    {formData.accountName &&
                      (<Button
                        className="bg-primary-500 py-[16px] mt-6 rounded-[30px]"
                        disabled={isGettingBankName || !formData.accountName}
                        onPress={() => {
                          Keyboard.dismiss();
                          if (validateFirstStep()) {
                            router.push({
                              pathname: "/(protected)/(features)/withdrawalcontinue",
                              params: {
                                accountNumber: formData.accountNumber,
                                accountName: formData.accountName,
                                bankName: formData.bankName,
                                bankCode: formData.bankCode,
                                bankUrl: formData.bankUrl,
                              },
                            });
                          } else {
                            toast.showToast(
                              "Please fill all required fields correctly",
                              "error",
                            );
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
                      </Button>)}
                  </View>
                )}

                {continueState === "second" && (
                  <>
                    <View style={{ marginTop: 5 }}>
                      <Input
                        label="Amount"
                        placeholder="Enter amount"
                        value={formData.amount}
                        onChangeText={handleChangeAmount}
                        keyboardType="numeric"
                        className=" rounded-xl"
                        error={errors.amount}
                      />
                      <ThemedText
                        family="primary"
                        variant="secondary"
                        weight="regular"
                        className="text-b3 mt-2"
                      >
                        Available balance: ₦
                        {userInfo?.bal ? formatNumber(userInfo.bal) : "0.00"}
                      </ThemedText>
                    </View>

                    <View className="flex-row mt-6">
                      {listAmount.map((amount: string, index: number) => (
                        <Pressable
                          key={index}
                          className={`bg-light-150 dark:bg-dark-700 py-[8px] px-[12px] rounded-full mr-2 ${selectedAmount === amount ? "border-2 border-primary-500" : ""}`}
                          onPress={() => {
                            handleAmountSelect(amount);
                          }}
                          style={{ width: deviceWidth / 4 - 16 }}
                        >
                          <ThemedText
                            family="primary"
                            variant="primary"
                            weight="medium"
                            className="text-b2  text-center"
                          >
                            ₦{formatNumber(amount)}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>

                    {/* Description */}
                    <View style={{ marginTop: 20 }}>
                      <Textarea
                        label="Description (Optional)"
                        placeholder="Enter description"
                        value={formData.description}
                        onChangeText={handleChangeDesc}
                        className=" rounded-xl"
                        error={errors.description}
                        rows={3}
                      />
                    </View>

                    <View className="flex-row justify-between pt-6 items-center gap-3">
                      <Button
                        variant="outline"
                        className="bg-primary-500 border-2 flex-1 border-primary-500 py-[16px] mt-2 rounded-xl"
                        disabled={isWithdrawing || isGettingBankName}
                        onPress={() => {
                          Keyboard.dismiss();
                          setContinueState("first");
                        }}
                        loading={isWithdrawing}
                      >
                        <ThemedText
                          family="primary"
                          variant="primary"
                          weight="bold"
                          className="text-b2 text-center "
                        >
                          Back
                        </ThemedText>
                      </Button>

                      <Button
                        className="bg-primary-500 flex-1 py-[16px] mt-2 rounded-xl"
                        disabled={isWithdrawing || isGettingBankName}
                        onPress={() => {
                          Keyboard.dismiss();
                          if (validateSecondStep()) {
                            setVisible(true);
                          } else {
                            toast.showToast(
                              "Please fix the errors in the form",
                              "error",
                            );
                          }
                        }}
                        loading={isWithdrawing}
                      >
                        <ThemedText
                          family="primary"
                          variant="primary"
                          weight="bold"
                          className="text-b2 text-center text-white"
                        >
                          Confirm
                        </ThemedText>
                      </Button>
                    </View>
                  </>
                )}
              </View>

              {/* Tabs to show recent and saved banks */}
              {continueState === "first" && (
                <View
                  className="bg-[#FFFFFF] dark:bg-[#111111] rounded-[30px] border border-[#EFEFEF] dark:border-[#232323] mx-[24px] mt-6 flex-1 mb-8"
                >
                  <View className="flex-row justify-between items-center bg-[#F5F5F5] dark:bg-[#0C0C0C] m-2 rounded-full ">
                    <Pressable
                      className={`flex-1 py-3 ${action === "recent" ? "bg-[#FFFFFF] dark:bg-[#111111] rounded-full m-1 " : ""}`}
                      onPress={() => setAction("recent")}
                    >
                      <ThemedText
                        family="primary"
                        weight="medium"
                        className={`text-b2 text-center ${action === "recent" ? "!text-primary-500" : "!text-light-600"}`}
                      >
                        Recent
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      className={`flex-1 py-3 ${action === "saved" ? "bg-[#FFFFFF] dark:bg-[#111111] rounded-full m-1 " : ""}`}
                      onPress={() => setAction("saved")}
                    >
                      <ThemedText
                        family="primary"
                        weight="medium"
                        className={`text-b2 text-center ${action === "saved" ? "!text-primary-500" : "!text-light-600"}`}
                      >
                        Saved
                      </ThemedText>
                    </Pressable>
                  </View>

                  {action === "recent" && (
                    <>
                      <FlatList
                        data={recentBeneficiaries || []}
                        renderItem={({ item }) => (
                          <AccountItem
                            item={item}
                            onPress={handleAccountPressRecent}
                            isSelected={
                              formData.accountNumber === item.accountNumber &&
                              formData.bankCode === item.bankCode
                            }
                          />
                        )}
                        keyExtractor={(item, index) => `${item.accountNumber}_${item.bankCode}_${index}`}
                        className="flex-1"
                        contentContainerStyle={{
                          paddingHorizontal: 8,
                          paddingVertical: 8,
                        }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                          <View className="py-10 items-center">
                            <icons.bankAt width={40} height={40} style={{ opacity: 0.5 }} />
                            <ThemedText
                              className="text-center text-b2 mt-4"
                              variant="secondary"
                              family="primary"
                              weight="medium"
                            >
                              No recent accounts found
                            </ThemedText>
                          </View>
                        )}
                      />
                    </>
                  )}

                  {action === "saved" && (
                    <FlatList
                      data={beneficiaries || []}
                      renderItem={({ item }) => (
                        <AccountItem
                          item={item}
                          onPress={handleAccountPress}
                          isSelected={
                            formData.accountNumber === item.account_number &&
                            formData.bankCode === item.bank_code
                          }
                        />
                      )}
                      keyExtractor={(item, index) => index.toString()}
                      className="flex-1"
                      contentContainerStyle={{
                        paddingHorizontal: 8,
                        paddingVertical: 8,
                      }}
                      showsVerticalScrollIndicator={false}
                      ListEmptyComponent={() => (
                        <View className="py-10 items-center">
                          <icons.bankAt width={120} height={120} style={{ opacity: 0.5 }} />
                          <ThemedText
                            className="text-center text-b2 mt-4"
                            variant="secondary"
                            family="primary"
                            weight="medium"
                          >
                            No saved accounts found
                          </ThemedText>
                        </View>
                      )}
                    />
                  )}
                </View>
              )}
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>

        {/* <FlatList
          data={accountsData}
          renderItem={({ item }) => (
            <AccountItem item={item} onPress={handleAccountPress} />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <ThemedText
              className="text-center text-b2"
              variant="secondary"
              family="primary"
              weight="medium"
            >
              No accounts found
            </ThemedText>
          )}
        /> */}
      </ThemedView>
      {showBanks && (
        <>
          <BankModal
            visible={showBanks}
            setVisible={setShowBanks}
            handleChangeBankInfo={handleGlobalChange}
          />
        </>
      )}

      {visible && (
        <>
          <ConfirmWithdrawal
            visible={visible}
            setVisible={setVisible}
            formData={formData}
            setShowPinModal={setShowPinModal}
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
        visible={isWithdrawing}
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
              Processing your withdrawal...
            </ThemedText>
            <ThemedText className="mt-2 text-b3 text-center text-gray-500">
              Please wait, do not leave this screen
            </ThemedText>
          </View>
        </View>
      </Modal>

      <WithdrawalSuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setFormData({
            accountNumber: "",
            accountName: "",
            bankName: "",
            bankCode: "",
            amount: "",
            description: "",
            bankUrl: "",
          });
          router.replace(paths.tabs.home);
        }}
        onViewReceipt={() => {
          setShowSuccessModal(false);
          setFormData({
            accountNumber: "",
            accountName: "",
            bankName: "",
            bankCode: "",
            amount: "",
            description: "",
            bankUrl: "",
          });
          router.push({
            pathname: paths.detailtransaction,
            params: {
              transId: transId,
              type: "withdrawal",
            }
          });
        }}
        amount={formData.amount}
        bankName={formData.bankName}
        accountNumber={formData.accountNumber}
        accountName={formData.accountName}
        onSaveBeneficiaryChange={handleSaveBeneficiary}
      />
    </>
  );
};

export default Withdrawal;
