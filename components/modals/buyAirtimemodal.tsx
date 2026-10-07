import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import {
  addPhoneBeneficiary,
  removePhoneBeneficiary,
} from "@/redux/beneficiary/bene_slice";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { getIcons } from "@/utils/bills";
import { app_config } from "@/utils/config";
import { formatNumber, parseAmount } from "@/utils/formatamount";
import React from "react";
import { View } from "react-native";
import { ThemedText } from "../theme/themeText";
import { Button } from "../ui/button";
import { CustomSwitch } from "../ui/customSwitch";
import { CustomModal } from "../ui/modal";

interface AirtimeModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  formData: {
    number: string;
    amount: string;
    network: string;
  };
  setShowPinModal: (show: boolean) => void;
}

const BuyAirtimeModal = ({
  visible,
  setVisible,
  formData,
  setShowPinModal,
}: AirtimeModalProps) => {
  const { isDark } = useTheme();
  // const router = useRouter();
  const [isEnabled, setIsEnabled] = React.useState(false);
  const dispatch = useAppDispatch();
  const { phoneBeneficiaries } = useAppSelector((state) => state.beneficiary);
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};

  React.useEffect(() => {
    if (formData?.number) {
      const existingBeneficiary = phoneBeneficiaries.find(
        (bene) => bene.number === formData.number
      );
      setIsEnabled(!!existingBeneficiary);
    }
  }, [formData, phoneBeneficiaries]);

  const toggleSwitch = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    if (!isEnabled) {
      // ADD
      dispatch(
        addPhoneBeneficiary({
          id: formData.number,
          number: formData.number,
          network: formData.network,
          name: formData.network,
        })
      );
    } else {
      // REMOVE
      dispatch(
        removePhoneBeneficiary({
          id: formData.number,
          number: formData.number,
          network: formData.network,
          name: formData.network,
        })
      );
    }
  };

  const BeneficiaryIcon = getIcons(formData.network);

  return (
    <CustomModal
      visible={visible}
      onClose={() => setVisible(false)}
      closebutton={true}
      height={'auto'}
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
          ₦{formatNumber(Number(formData.amount))}
        </ThemedText>
      </View>

      {/*  */}
      <View className="flex-1 mt-4 bg-[#FCFCFC] rounded-[30px] p-2 dark:bg-[#111111] border border-border-light dark:border-border-dark">
        {/* 1st row */}
        <View
          className="bg-[#F5F5F5] dark:bg-[#0C0C0C] rounded-[18px] p-[14px] border border-border-light dark:border-border-dark"

        >
          <View className="flex-row items-center justify-between mb-2">
            <ThemedText
              family="primary"
              variant="secondary"
              weight="medium"
              className="text-b2 text-left mb-2"
            >
              To
            </ThemedText>
            <View className="flex-row items-center gap-2">
              {BeneficiaryIcon && <BeneficiaryIcon width={20} height={20} />}
              <ThemedText
                family="primary"
                weight="medium"
                className="text-b2 uppercase"
              >
                {formData.network}
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
              Airtime
            </ThemedText>
          </View>

          <View className="flex-row items-center justify-between">
            <ThemedText
              family="primary"
              variant="secondary"
              weight="medium"
              className="text-b2"
            >
              Phone Number
            </ThemedText>
            <ThemedText family="primary" weight="medium" className="text-b2">
              {formData.number}
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
                className="text-b3 text-primary-500"
              >
                ₦{formatNumber(userInfo?.bal || 0)}
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
              Balance after
            </ThemedText>
            <ThemedText family="primary" weight="medium" className="text-b2">
              ₦{formatNumber(parseAmount(userInfo?.bal || "0") - parseAmount(formData.amount || "0"))}
            </ThemedText>
          </View>

          <View className="flex-row items-center justify-between">
            <ThemedText
              family="primary"
              variant="secondary"
              weight="medium"
              className="text-b2"
            >
              Transaction Fee
            </ThemedText>
            <ThemedText family="primary" weight="medium" className="text-b2">₦0.00</ThemedText>
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
          }, 300);
        }}
      >
        <ThemedText weight="bold" className="text-white text-b1">Pay Now</ThemedText>
      </Button>
    </CustomModal>
  );
};

export default BuyAirtimeModal;
