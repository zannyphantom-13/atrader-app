import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import {
  addCableBeneficiary,
  removeCableBeneficiary,
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

interface BuyCableModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  formData: {
    cablenumber: string;
    amount: string;
    cableNetwork: string;
    accountName: string;
    cableplan: string;
  };
  showPinModal: boolean;
  setShowPinModal: (show: boolean) => void;
}

const BuyCableModal = ({
  visible,
  setVisible,
  showPinModal,
  setShowPinModal,
  formData,
}: BuyCableModalProps) => {
  const { isDark } = useTheme();
  const [isEnabled, setIsEnabled] = React.useState(false);
  const dispatch = useAppDispatch();
  const { cableBeneficiaries } = useAppSelector((state) => state.beneficiary);
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};

  const Cabic = getIcons(String(formData.cableNetwork)) || null;

  React.useEffect(() => {
    if (formData?.cablenumber) {
      const existingBeneficiary = cableBeneficiaries.find(
        (bene) => bene.id === formData.cablenumber
      );
      setIsEnabled(!!existingBeneficiary);
    }
  }, [formData, cableBeneficiaries]);

  const toggleSwitch = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);

    if (newValue) {
      dispatch(
        addCableBeneficiary({
          id: formData.cablenumber,
          cablenumber: formData.cablenumber,
          cableNetwork: formData.cableNetwork,
        })
      );
    } else {
      dispatch(
        removeCableBeneficiary({
          id: formData.cablenumber,
          cablenumber: formData.cablenumber,
          cableNetwork: formData.cableNetwork,
        })
      );
    }
  };

  return (
    <CustomModal
      visible={visible}
      onClose={() => setVisible(false)}
      // title="Review Transaction"
      closebutton={true}
      showHandle={false}
      height="auto"
    >
      <View className="items-center mb-6">
        <ThemedText family="secondary" weight="medium" className="text-b2 text-gray-500 mb-1">
          {"You're paying"}
        </ThemedText>
        <ThemedText family="primary" weight="bold" className="text-h4">
          ₦{formatNumber(formData.amount)}
        </ThemedText>
      </View>

      <View className="bg-light-150 dark:bg-dark-900 rounded-[30px] p-2 border border-border-light dark:border-border-dark mb-4">
        <View className="bg-white dark:bg-dark-700 rounded-[20px] p-4 border border-border-light dark:border-border-dark">
          <View className="flex-row items-center justify-between mb-4">
            <ThemedText family="primary" variant="secondary" className="text-b2">To</ThemedText>
            <View className="flex-row items-center gap-2">
              {Cabic && <Cabic width={20} height={20} />}
              <ThemedText family="primary" weight="medium" className="text-b2">
                {formData.cableNetwork || "Cable Network"}
              </ThemedText>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <ThemedText family="primary" variant="secondary" className="text-b2">Service</ThemedText>
            <ThemedText family="primary" weight="medium" className="text-b2">Cable TV</ThemedText>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <ThemedText family="primary" variant="secondary" className="text-b2">Plan</ThemedText>
            <ThemedText family="primary" weight="medium" className="text-b2 text-right flex-1 ml-4" numberOfLines={1}>
              {formData.cableplan || "Select Plan"}
            </ThemedText>
          </View>

          <View className="flex-row items-center justify-between">
            <ThemedText family="primary" variant="secondary" className="text-b2">Account Name</ThemedText>
            <ThemedText family="primary" weight="medium" className="text-b2 text-right flex-1 ml-4" numberOfLines={1}>
              {formData.accountName || "N/A"}
            </ThemedText>
          </View>
        </View>

        <View className="bg-white dark:bg-dark-700 rounded-[20px] p-4 border border-border-light dark:border-border-dark mt-2">
          <View className="flex-row items-center justify-between mb-4">
            <ThemedText family="primary" variant="secondary" className="text-b2">Payment from</ThemedText>
            <View className="flex-row items-center bg-light-200 dark:bg-dark-500 gap-2 px-3 py-1.5 rounded-full">
              <icons.wallet width={16} height={16} color={isDark ? "white" : "#696969"} />
              <ThemedText family="primary" weight="semibold" className="text-b3 text-primary-500">
                ₦{formatNumber(userInfo?.bal || 0)}
              </ThemedText>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <ThemedText family="primary" variant="secondary" className="text-b2">Balance after</ThemedText>
            <ThemedText family="primary" weight="medium" className="text-b2">
              ₦{formatNumber(parseAmount(userInfo?.bal || "0") - parseAmount(formData.amount || "0"))}
            </ThemedText>
          </View>

          <View className="flex-row items-center justify-between">
            <ThemedText family="primary" variant="secondary" className="text-b2">Transaction Fee</ThemedText>
            <ThemedText family="primary" weight="medium" className="text-b2">₦0.00</ThemedText>
          </View>
        </View>

        <View className="flex-row items-center justify-between bg-white dark:bg-dark-700 rounded-[20px] p-4 border border-border-light dark:border-border-dark mt-2">
          <ThemedText family="primary" weight="medium" className="text-b2">Save beneficiary</ThemedText>
          <CustomSwitch
            value={isEnabled}
            onValueChange={toggleSwitch}
            trackWidth={40}
            trackHeight={22}
            thumbSize={14}
            activeTrackColor={colorThemes[app_config.theme][150]}
            inactiveTrackColor={isDark ? "#333333" : "#EFEFEF"}
            activeThumbColor={colorThemes[app_config.theme][500]}
            inactiveThumbColor={isDark ? "#B5B5B5" : "#7E7E7E"}
          />
        </View>
      </View>

      <Button
        className="w-full py-4 mt-2"
        onPress={() => {
          setVisible(false);
          setTimeout(() => setShowPinModal(true), 300);
        }}
      >
        <ThemedText weight="bold" className="text-white text-b1">Pay Now</ThemedText>
      </Button>
    </CustomModal>
  );
};

export default BuyCableModal;
