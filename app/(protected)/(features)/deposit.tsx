import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Copy, Info } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatDepositLimit = (limit: string | number | undefined | null): string => {
  if (limit === undefined || limit === null || limit === "") return "";

  const limitStr = String(limit).trim();

  // If there are no digits in the string, return as is (e.g. "Unlimited")
  if (!/\d/.test(limitStr)) {
    return limitStr;
  }

  const formatNumberWithCommas = (numStr: string) => {
    const num = parseFloat(numStr);
    if (isNaN(num)) return numStr;
    const hasDecimals = numStr.includes(".");
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0,
    }).format(num);
  };

  if (limitStr.includes("-")) {
    return limitStr
      .split("-")
      .map((part) => {
        const trimmed = part.trim();
        if (!/\d/.test(trimmed)) return trimmed;
        const currencySymbol = trimmed.includes("$") ? "$" : "₦";
        const rawNumStr = trimmed.replace(/[^0-9.]/g, "");
        return `${currencySymbol}${formatNumberWithCommas(rawNumStr)}`;
      })
      .join(" - ");
  } else {
    const currencySymbol = limitStr.includes("$") ? "$" : "₦";
    const rawNumStr = limitStr.replace(/[^0-9.]/g, "");
    return `${currencySymbol}${formatNumberWithCommas(rawNumStr)}`;
  }
};

const Deposit = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  // Hardcoded verification state as requested for dummy implementation
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};
  const isVerified = userInfo?.verify_account === 1;
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async (text: string, label: string) => {
    if (!text || text === '----------') return;
    await Clipboard.setStringAsync(text);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(`${label} copied to clipboard`, "success");
  };

  console.log('userInfo', userInfo);
  useEffect(() => {
    if (!isVerified) {
      setShowModal(true);
    }
  }, [isVerified]);

  // const dummyData = {
  //   accountNumber: "9052950204",
  //   bankName: "Wema Bank",
  //   accountName: "Chioma Kehinde",
  //   fee: "₦100",
  //   depositLimit: "₦1,000 - ₦50,000,000",
  // };

  const renderInfoItem = (label: string, value: string, isMain?: boolean) => (
    <View
      className={`mb-3 py-2 px-2 rounded-[20px] bg-[#F5F5F5] dark:bg-[#0C0C0C] border-[1px] border-[#EFEFEF] dark:border-[#232323] ${isMain ? "items-center py-4" : ""
        }`}
    >
      <ThemedText
        variant="secondary"
        family="primary"
        weight="medium"
        className="text-b3 mb-1 text-gray-500 dark:text-gray-400"
      >
        {label}
      </ThemedText>
      <ThemedText
        variant="primary"
        family="primary"
        weight={isMain ? "semibold" : "medium"}
        className={`${isMain ? "text-h7" : "text-b1"}`}
      >
        {!isVerified && label !== "Fee" && label !== "Deposit limit"
          ? "----------"
          : value}
      </ThemedText>
      {isVerified && (label === "Account number" || label === "Bank name" || label === "Account name") && (
        <Pressable
          onPress={() => handleCopy(value, label)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2"
        >
          <Copy size={16} color={isDark ? "#697586" : "#697586"} />
        </Pressable>
      )}
    </View>
  );

  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Deposit"
        showTitle={false} />
      <SafeAreaView className="flex-1 px-[24px]" edges={["bottom"]}>
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <ThemedText family="primary" weight="medium" className="text-[18px] mt-4">
            Deposit NGN
          </ThemedText>
          <ThemedText
            variant="secondary"
            family="secondary"
            weight="medium"
            className="text-b2 mb-6 pt-1 text-gray-500 dark:text-gray-400"
          >
            Make a transfer to your account details below.
          </ThemedText>
          <View className="mb-4 bg-light-150 dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] p-2">
            {renderInfoItem("Account number", userInfo?.unique_account || '----------', true)}
            {renderInfoItem("Bank name", userInfo?.unique_account_bank || '----------')}
            {renderInfoItem("Account name", userInfo?.unique_account_name || '----------')}
            {renderInfoItem("Fee", userInfo?.fee)}
            {renderInfoItem("Deposit limit", formatDepositLimit(userInfo?.deposit_limit))}
          </View>

          <View className="flex-col p-4 rounded-[20px] bg-light-150 dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] mb-6 gap-3">
            <View className="flex-row items-start gap-3">
              <View className="pt-1">
                <Info size={16} color="#697586" />
              </View>
              <ThemedText
                variant="secondary"
                family="primary"
                weight="medium"
                className="flex-1 text-b3 leading-5 text-gray-500 dark:text-gray-400"
              >
                Make your deposit from a bank account that shows your legal name
                as provided to us during your KYC prevent fund reversal or
                withholding of funds.
              </ThemedText>
            </View>

            <View className="flex-row items-start gap-3">
              <View className="pt-1">
                <Info size={16} color="#697586" />
              </View>
              <ThemedText
                variant="secondary"
                family="primary"
                weight="medium"
                className="flex-1 text-b3 leading-5 text-gray-500 dark:text-gray-400"
              >
                Third-party transactions are not permitted.
              </ThemedText>
            </View>
          </View>
        </ScrollView>

        <View className="mb-4">
          <Button
            className={`w-full h-14 rounded-full ${isVerified ? "bg-primary-500" : "bg-primary-500/50"
              }`}
            disabled={!isVerified}
            onPress={() => {
              handleCopy(userInfo?.unique_account || '', "Account number");
            }}
          >
            <View className="flex-row items-center gap-2">
              <ThemedText
                className="text-white font-bold text-b1"
                family="primary"
                weight="bold"
              >
                Copy account number
              </ThemedText>
              <Copy size={18} color="white" />
            </View>
          </Button>
        </View>

        {/* Verification Modal */}
        <Modal
          visible={showModal}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
        >
          <View className="flex-1 bg-black/70 justify-center items-center px-4">
            <ThemedView className="bg-white dark:bg-[#0C0C0C] border border-[#EFEFEF] dark:border-[#232323] p-5 rounded-[30px] w-full items-center relative">
              {/* <Pressable
                onPress={() => setShowModal(false)}
                className="absolute top-6 right-6 p-2"
              >
                <X size={24} color={isDark ? "white" : "black"} />
              </Pressable> */}

              <View className="mb-6 mt-8">
                <Image source={img.verified} style={{ width: 82, height: 82 }} resizeMode="contain" />
              </View>

              <ThemedText
                family="primary"
                weight="bold"
                className="text-h7 text-center mb-2 px-4"
              >
                Verify your account to deposit Naira.
              </ThemedText>
              <ThemedText
                variant="secondary"
                family="primary"
                weight="medium"
                className="text-b2 text-center mb-8 px-4 text-gray-500 dark:text-gray-400 leading-6"
              >
                Account verification is required to enable naira deposit
                functionality. Complete KYC for more freedom and flexibility.
              </ThemedText>

              <Button
                className="w-full bg-primary-500 rounded-full h-14"
                onPress={() => {

                  router.replace(paths.setting.kyc);
                  setShowModal(false);
                }}
              >
                <ThemedText
                  className="text-white font-bold text-b1"
                  family="primary"
                  weight="bold"
                >
                  Verify account
                </ThemedText>
              </Button>
            </ThemedView>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
};

export default Deposit;

/**
 * PREVIOUS CODE (Used for checkouts)
 * 
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import { ChevronRightIcon } from "lucide-react-native";
import React from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";

const DepositOld = () => {
  const { isDark } = useTheme();

  return (
    <ThemedView className="flex-1 pt-6 pb-14 px-[24px]">
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
        }}
        accessible={false}
      >
        <View className="flex-1  mb-6">
          <Input
            className="w-full mb-4"
            label="Enter Amount"
            placeholder="Enter amount to deposit"
            keyboardType="numeric"
            autoCapitalize="none"
            leadingIcon={
              <ThemedText className="text-h7 font-bold ">₦</ThemedText>
            }
          />

          <View className="flex-row items-center justify-between mb-3">
            <ThemedText
              className="text-b2"
              variant="primary"
              family="primary"
              weight="medium"
            >
              Payment method
            </ThemedText>
          </View>

          <View className="rounded-xl flex-row items-center justify-between py-3 dark:bg-dark-700 px-3 bg-light-150 border border-light-300 dark:border-dark-600">
            <ThemedText
              className="text-b2  py-2"
              variant="secondary"
              family="primary"
              weight="bold"
            >
              <icons.nectpoint />
            </ThemedText>

            <ChevronRightIcon
              width={20}
              height={20}
              color={isDark ? "#697586" : "black"}
            />
          </View>
          <ThemedText
            className="text-b2 pt-2"
            variant="secondary"
            family="primary"
            weight="medium"
          >
            You will be redirected to Nect Point gateway to complete your
            deposit payment
          </ThemedText>
        </View>
      </TouchableWithoutFeedback>

      <Button
        className="w-full bg-secondary-500"
        onPress={() => {
          // Handle deposit via bank transfer
        }}
      >
        <ThemedText
          className="text-white font-bold"
          variant="primary"
          family="primary"
          weight="bold"
        >
          Continue
        </ThemedText>
      </Button>
    </ThemedView>
  );
};
*/
