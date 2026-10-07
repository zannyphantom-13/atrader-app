import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import { useAppSelector } from "@/redux/store";
import { formatNumber, parseAmount } from "@/utils/formatamount";
import React from "react";
import { Image, View } from "react-native";
import { ThemedText } from "../theme/themeText";
import { Button } from "../ui/button";
import { CustomModal } from "../ui/modal";

interface PayGcModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  rate: any;
  formData: {
    name: string;
    amount: string;
    quantity: number;
    email: string;
    country: string;
  };
  productName: string; // Added productName
  image: string;
  showPinModal: boolean;
  setShowPinModal: (show: boolean) => void;
  totalReceived: number;
  activeRecipientTab: "myself" | "someone";
}

const PayBuyGiftCardsModal = ({
  visible,
  setVisible,
  showPinModal,
  setShowPinModal,
  formData,
  productName,
  image,
  rate,
  totalReceived,
  activeRecipientTab,
}: PayGcModalProps) => {
  const { isDark } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};

  return (
    <>
      <CustomModal
        visible={visible}
        onClose={() => setVisible(false)}
        closebutton={true}
        height="auto"
        showHandle={false}
        showHeader={false}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View className="items-center mb-1">
          <ThemedText
            family="secondary"
            weight="medium"
            className="text-b2 text-gray-500 mb-1 text-center"
          >
            {"You’re paying"}
          </ThemedText>
          <ThemedText
            family="primary"
            weight="bold"
            className="text-h4"
          >
            ${formatNumber(formData.amount || 0)}
          </ThemedText>
        </View>

        <View>
          <View className="items-center flex-row justify-center mb-6">
            <ThemedText
              family="secondary"
              weight="regular"
              className="text-b3 text-gray-500 mb-1 text-center"
            >
              {"Current rate:"}
            </ThemedText>
            <ThemedText
              family="primary"
              weight="medium"
              className="text-b2"
            >
              {/* $1 ~ ₦{formatNumber(formData.amount || 0)} */}
              $1 ~ ₦{formatNumber(rate || 0)}
            </ThemedText>
          </View>

        </View>

        <View className="bg-[#FCFCFC] dark:bg-[#111111] rounded-[30px] p-2 border border-border-light dark:border-border-dark mb-4">
          <View
            className="bg-white dark:bg-dark-900 rounded-[20px] p-4 border border-border-light dark:border-border-dark"
          >
            {/* 1st row */}
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Card name
              </ThemedText>
              <View className="flex-row items-center gap-2">
                {image ? (
                  <Image
                    source={{
                      uri: image,
                    }}
                    style={{ width: 24, height: 24 }}
                    className="rounded-full"
                  />
                ) : null}
                <ThemedText family="primary" weight="medium" className="text-b2">
                  {productName}
                </ThemedText>
              </View>
            </View>

            {/* Value row */}
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Value
              </ThemedText>
              <ThemedText family="primary" weight="medium" className="text-b2">
                ${formData.amount || "0"}
              </ThemedText>
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Country
              </ThemedText>
              <ThemedText family="primary" weight="medium" className="text-b2">
                {formData.country}
              </ThemedText>
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Recipient
              </ThemedText>
              <ThemedText family="primary" weight="medium" className="text-b2">
                {activeRecipientTab === "myself" ? "Myself" : 'Someone else'}
              </ThemedText>
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Recipient Email
              </ThemedText>
              <ThemedText
                family="primary"
                weight="medium"
                className="text-b2 flex-1 text-right ml-4"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formData.email}
              </ThemedText>
            </View>

            <View className="flex-row items-center justify-between">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Quantity
              </ThemedText>
              <ThemedText family="primary" weight="medium" className="text-b2">
                {formData.quantity || 1}
              </ThemedText>
            </View>
          </View>

          <View className="bg-white dark:bg-dark-900 rounded-[20px] mt-2 p-4 border border-border-light dark:border-border-dark">
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Wallet Balance
              </ThemedText>
              <View className="flex-row items-center bg-[#E8FFE4] dark:bg-dark-500 gap-2 px-3 py-1.5 rounded-full">
                <icons.wallet width={16} height={16} color={isDark ? "white" : "#696969"} />
                <ThemedText
                  family="primary"
                  weight="semibold"
                  className="text-b3 !text-primary-500"
                >
                  ₦{formatNumber(parseAmount(userInfo?.bal || 0))}
                </ThemedText>
              </View>
            </View>
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Total Payable
              </ThemedText>
              <ThemedText family="primary" weight="bold" className="text-b2">
                ₦{formatNumber(totalReceived) || "0.00"}
              </ThemedText>
            </View>
            <View className="flex-row items-center justify-between">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Balance After
              </ThemedText>
              <ThemedText family="primary" weight="bold" className="text-b2">
                ₦{formatNumber(parseAmount(userInfo?.bal || 0) - totalReceived) || "0.00"}
              </ThemedText>
            </View>
          </View>
        </View>

        <Button
          className="w-full py-4 mt-2"
          onPress={() => {
            setVisible(false);
            setTimeout(() => {
              setShowPinModal(true);
            }, 300);
          }}
        >
          <ThemedText weight="bold" className="text-white text-b1">Pay Now</ThemedText>
        </Button>
      </CustomModal>
    </>
  );
};

export default PayBuyGiftCardsModal;
