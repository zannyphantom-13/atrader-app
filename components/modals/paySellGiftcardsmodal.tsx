import { useTheme } from "@/context/ThemeProvider";
import { formatNumber } from "@/utils/formatamount";
import { useRouter } from "expo-router";
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
    referral: string;
    amount: string;
    country: string;
    note: string;
    quantity: number;
    planType: string;
    speed: string;
  };
  image: any;
  showPinModal: boolean;
  setShowPinModal: (show: boolean) => void;
  totalReceived: number;
  selectedSubCategory: any;
  onSubmit: () => Promise<void>;
  paywithoutPin: () => Promise<void>;
  isLoading?: boolean;
  cardName?: string;
}

const PaySellGiftCardsModal = ({
  visible,
  setVisible,
  showPinModal,
  setShowPinModal,
  formData,
  image,
  rate,
  totalReceived,
  selectedSubCategory,
  onSubmit,
  paywithoutPin,
  isLoading,
  cardName,
}: PayGcModalProps) => {
  const { isDark } = useTheme();
  const router = useRouter();

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
        <View className="items-center my-2">
          <ThemedText
            family="secondary"
            weight="medium"
            className="text-b2 text-gray-500 mb-1 text-center"
          >
            {"Settlement amount"}
          </ThemedText>
          <ThemedText
            family="primary"
            weight="bold"
            className="text-h4"
          >
            ₦{formatNumber(Number(totalReceived.toFixed(2)))}
          </ThemedText>
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
                    source={typeof image === "string" && image.startsWith("http") ? { uri: image } : image}
                    style={{ width: 24, height: 24 }}
                    className="rounded-full"
                  />
                ) : null}
                <ThemedText family="primary" weight="medium" className="text-b2">
                  {cardName || (typeof selectedSubCategory === 'object' ? selectedSubCategory?.subcategory : selectedSubCategory)}
                </ThemedText>
              </View>
            </View>

            {/* Type row */}
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Type
              </ThemedText>
              <ThemedText family="primary" weight="medium" className="text-b2 capitalize">
                {formData.planType}
              </ThemedText>
            </View>

            {/* Speed row */}
            {formData.speed ? (
              <View className="flex-row items-center justify-between mb-4">
                <ThemedText
                  family="primary"
                  variant="secondary"
                  weight="medium"
                  className="text-b2"
                >
                  Speed
                </ThemedText>
                <ThemedText family="primary" weight="medium" className="text-b2 capitalize">
                  {formData.speed}
                </ThemedText>
              </View>
            ) : null}

            {/* Value row */}
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Unit Value
              </ThemedText>
              <ThemedText family="primary" weight="medium" className="text-b2">
                ${formData.amount}
              </ThemedText>
            </View>

            {/* Country row */}
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

            <View>
              <View className="items-center flex-row justify-between mb-4">
                <ThemedText
                  family="primary"
                  variant="secondary"
                  weight="medium"
                  className="text-b2"
                >
                  {"Current rate:"}
                </ThemedText>
                <ThemedText
                  family="primary"
                  weight="medium"
                  className="text-b2"
                >
                  $1 ~ ₦{formatNumber(Number(rate.rate || 0))}
                </ThemedText>
              </View>
            </View>


            {/* Quantity row */}
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
                {formData.quantity} Qty
              </ThemedText>
            </View>
          </View>

          <View className="bg-white dark:bg-dark-900 rounded-[20px] mt-2 p-4 border border-border-light dark:border-border-dark">
            <View className="flex-row items-center justify-between">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Settlement amount
              </ThemedText>
              <ThemedText family="primary" weight="bold" className="text-b2 text-primary-500">
                ₦{formatNumber(Number(totalReceived.toFixed(2))) || "0.00"}
              </ThemedText>
            </View>
          </View>
        </View>

        <Button
          className="w-full py-4 mt-2"
          onPress={paywithoutPin}
          loading={isLoading}
        >
          <ThemedText weight="bold" className="text-white text-b1">Confirm Trade</ThemedText>
        </Button>
      </CustomModal>
    </>
  );
};

export default PaySellGiftCardsModal;
