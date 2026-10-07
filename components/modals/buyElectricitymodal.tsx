import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import {
  addElectricityBeneficiary,
  removeElectricityBeneficiary,
} from "@/redux/beneficiary/bene_slice";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { getIcons } from "@/utils/bills";
import { app_config } from "@/utils/config";
import { parseImageUrl } from "@/utils/helper";
import { paths } from "@/utils/paths";
import React from "react";
import { Image, View } from "react-native";
import { formatNumber, parseAmount } from "../../utils/formatamount";
import { ThemedText } from "../theme/themeText";
import { Button } from "../ui/button";
import { CustomSwitch } from "../ui/customSwitch";
import { CustomModal } from "../ui/modal";

interface DepositModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  formData: {
    meternumber: string;
    amount: string;
    provider: string;
    metername: string;
    meterplan: string;
    image?: string;
  };
  showPinModal: boolean;
  setShowPinModal: (show: boolean) => void;
}

const depData = [
  {
    id: 1,
    title: "Naira",
    description: "Pay directly with Nectpoint",
    icon: icons.naira,
    iconLight: icons.nairaLight,
    route: `${paths.deposit}`,
  },
  {
    id: 2,
    title: "Crypto",
    description: "Send to a unique wallet address tie to your wallet account",
    icon: icons.cryptoDep,
    iconLight: icons.cryptoDepLight,
    route: `${paths.depositCrypto}`,
  },
];

const BuyElectricityModal = ({
  visible,
  setVisible,
  showPinModal,
  setShowPinModal,
  formData,
}: DepositModalProps) => {
  const { isDark } = useTheme();
  const [isEnabled, setIsEnabled] = React.useState(false);
  const dispatch = useAppDispatch();
  const { electricityBeneficiaries } = useAppSelector(
    (state) => state.beneficiary
  );
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};

  const Cabic = getIcons(String(formData.provider)) || null;

  // Check if current form data already exists as beneficiary
  React.useEffect(() => {
    if (formData?.meternumber) {
      const existingBeneficiary = electricityBeneficiaries.find(
        (bene) => bene.id === formData.meternumber
      );
      setIsEnabled(!!existingBeneficiary);
    }
  }, [formData, electricityBeneficiaries]);

  const toggleSwitch = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);

    if (!isEnabled) {
      // ADD
      dispatch(
        addElectricityBeneficiary({
          id: formData.meternumber,
          meternumber: formData.meternumber,
          provider: formData.provider,
          name: formData.metername || "No Meter Name",
        })
      );
    } else {
      // REMOVE
      dispatch(
        removeElectricityBeneficiary({
          id: formData.meternumber,
          meternumber: formData.meternumber,
          provider: formData.provider,
          name: formData.metername || "No Meter Name",
        })
      );
    }
  };

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
        <View className="items-center mb-6">
          <ThemedText
            family="secondary"
            weight="medium"
            className="text-b2 text-gray-500 mb-1"
          >
            {"You're paying"}
          </ThemedText>
          <ThemedText
            family="primary"
            weight="bold"
            className="text-h4"
          >
            ₦{formatNumber(formData.amount)}
          </ThemedText>
        </View>

        {/*  */}
        <View className="bg-light-150 dark:bg-dark-900 rounded-[30px] p-2 border border-border-light dark:border-border-dark mb-4">
          <View
            className="bg-white dark:bg-dark-700 rounded-[20px] p-4 border border-border-light dark:border-border-dark"
          >
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                To
              </ThemedText>
              <View className="flex-row items-center gap-2">
                {formData.image ? (
                  <Image
                    source={{ uri: parseImageUrl(formData.image) }}
                    style={{ width: 24, height: 24 }}
                    className="rounded-full"
                  />
                ) : Cabic && (
                  <Cabic width={20} height={20} />
                )}
                <ThemedText family="primary" weight="medium" className="text-b2">
                  {formData.provider || "Electricity Network"}
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
                Service
              </ThemedText>
              <ThemedText family="primary" weight="medium" className="text-b2">
                Electricity
              </ThemedText>
            </View>

            {/* 3rd row */}
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Plan
              </ThemedText>
              <ThemedText family="primary" weight="medium" className="text-b2 text-right flex-1 ml-4" numberOfLines={1}>
                {formData.meterplan || "N/A"}
              </ThemedText>
            </View>

            {/* 4th row */}
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Meter Number
              </ThemedText>
              <ThemedText family="primary" weight="medium" className="text-b2">
                {formData.meternumber}
              </ThemedText>
            </View>

            {/* 4th row */}
            <View className="flex-row items-center justify-between">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Meter name
              </ThemedText>
              <ThemedText family="primary" weight="medium" className="text-b2 text-right flex-1 ml-4" numberOfLines={1}>
                {formData.metername || "N/A"}
              </ThemedText>
            </View>
          </View>

          <View
            className="bg-white dark:bg-dark-700 rounded-[20px] mt-2 p-4 border border-border-light dark:border-border-dark"
          >
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Payment from
              </ThemedText>
              <View className="flex-row items-center bg-light-200 dark:bg-dark-500 gap-2 px-3 py-1.5 rounded-full">
                <icons.wallet width={16} height={16} color={isDark ? "white" : "#696969"} />
                <ThemedText
                  family="primary"
                  weight="semibold"
                  className="text-b3 !text-primary-500"
                >
                  ₦{formatNumber(userInfo?.bal || 0)}
                </ThemedText>
              </View>
            </View>

            {/* 5th row */}
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Balance after
              </ThemedText>
              <ThemedText family="primary" weight="medium" className="text-b2">
                ₦{formatNumber(parseAmount(userInfo?.bal || "0") - parseAmount(formData.amount || "0"))}
              </ThemedText>
            </View>

            {/* 7th row */}
            <View className="flex-row items-center justify-between">
              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2"
              >
                Transaction Fee
              </ThemedText>
              <ThemedText family="primary" weight="medium" className="text-b2">₦100.00</ThemedText>
            </View>
          </View>

          <View className="flex-row items-center justify-between bg-white dark:bg-dark-700 rounded-[20px] p-4 border border-border-light dark:border-border-dark mt-2">
            <ThemedText
              family="primary"
              weight="medium"
              className="text-b2"
            >
              Save as beneficiary
            </ThemedText>
            <CustomSwitch
              value={isEnabled}
              onValueChange={toggleSwitch}
              trackWidth={40}
              trackHeight={22}
              thumbSize={14}
              activeTrackColor={
                colorThemes[app_config.theme][150]
              }
              inactiveTrackColor={
                isDark ? "#E7E7E7" : "#EFEFEF"
              }
              activeThumbColor={colorThemes[app_config.theme][500]}
              inactiveThumbColor={isDark ? "#B5B5B5" : "#7E7E7E"}
            />
          </View>
        </View>
        {/* Button */}
        <Button
          className="w-full py-4 mt-2"
          onPress={() => {
            setVisible(false);
            setTimeout(() => {
              setShowPinModal(true);
            }, 400);
          }}
        >
          <ThemedText weight="bold" className="text-white text-b1">Pay Now</ThemedText>
        </Button>
      </CustomModal>
    </>
  );
};

export default BuyElectricityModal;
