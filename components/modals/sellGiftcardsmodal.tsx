
import { icons } from "@/constant/icon";
import {
    addPhoneBeneficiary,
    removePhoneBeneficiary,
} from "@/redux/beneficiary/bene_slice";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import React from "react";
import { Pressable, Switch, View } from "react-native";
import { CustomModal } from "../ui/modal";
import { ThemedText } from "../theme/themeText";
import { Button } from "../ui/button";

interface SellGiftModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  formData: {
    number: string;
    amount: string;
    network: string | null;
  };
  setShowPinModal: (show: boolean) => void;
}

const SellGiftCardsModal = ({
  visible,
  setVisible,
  formData,
  setShowPinModal,
}: SellGiftModalProps) => {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const dispatch = useAppDispatch();
  const { phoneBeneficiaries } = useAppSelector((state) => state.beneficiary);

  // Check if current form data already exists as beneficiary
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

  return (
    <CustomModal
      visible={visible}
      onClose={() => setVisible(false)}
      title="Airtime"
      closebutton={true}
      height="60%"
      padding={24}
      topOffset={80}
      bottomOffset={0}
      modalStyle={{
        borderRadius: 12,
        paddingTop: 20,
        paddingBottom: 20,
      }}
      containerStyle={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderRadius: 10,
      }}
      showHandle={false}
      showHeader={false}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => {}}
      className="font-primary-bold  bg-red-500 text-[2px]"
    >
      <ThemedText
        family="secondary"
        weight="medium"
        className="text-b3 pb-4 text-center"
      >
        {" You’re submitting your card with the rate "}
      </ThemedText>
      <ThemedText
        family="primary"
        weight="bold"
        className="text-h7 text-center"
      >
       $1 = #806.94
      </ThemedText>

      {/*  */}
      <View className="flex-1 mt-4">
        {/* 1st row */}
        <View className="flex-row items-center justify-between mb-3">
          <ThemedText
            family="primary"
            variant="secondary"
            weight="medium"
            className="text-b2 text-left mb-2"
          >
            Card name
          </ThemedText>
          <View className="flex-row items-center gap-2">
            <icons.mtn width={20} height={20} />
            <ThemedText family="primary" weight="medium" className="text-b2">
              Amazon
            </ThemedText>
          </View>
        </View>
        {/* 2nd row */}
        <View className="flex-row items-center justify-between mb-3">
          <ThemedText
            family="primary"
            weight="medium"
            variant="secondary"
            className="text-b2 text-left mb-2"
          >
            Service
          </ThemedText>
          <View className="flex-row items-center gap-2">
            <ThemedText family="primary" weight="medium" className="text-b2">
              Airtime
            </ThemedText>
          </View>
        </View>

        {/* 3rd row */}
        <View className="flex-row items-center justify-between mb-3">
          <ThemedText
            family="primary"
            weight="medium"
            variant="secondary"
            className="text-b2 text-left mb-2"
          >
            Phonenumber
          </ThemedText>
          <View className="flex-row items-center gap-2">
            <ThemedText family="primary" weight="medium" className="text-b2">
              0805255377
            </ThemedText>
          </View>
        </View>

        <View className="border border-border-light dark:border-border-dark my-5" />

        {/* 4th row */}
        <View className="flex-row items-center justify-between mb-3">
          <ThemedText
            family="primary"
            weight="medium"
            variant="secondary"
            className="text-b2 text-left mb-2"
          >
            Payment from
          </ThemedText>
          <View className="flex-row items-center gap-2">
            <ThemedText family="primary" weight="medium" className="text-b2">
              0805255377
            </ThemedText>
          </View>
        </View>

        {/* 5th row */}
        <View className="flex-row items-center justify-between mb-3">
          <ThemedText
            family="primary"
            weight="medium"
            variant="secondary"
            className="text-b2 text-left mb-2"
          >
            Payment from
          </ThemedText>
          <View className="flex-row items-center gap-2">
            <ThemedText family="primary" weight="medium" className="text-b2">
              Balance after
            </ThemedText>
          </View>
        </View>
        
        <View className="border border-border-light dark:border-border-dark my-5" />
      </View>
      {/* Button */}
      <Button
        className="bg-primary-500 py-[16px] rounded-xl"
        onPress={() => {
          setVisible(false);
          setShowPinModal(true);
        }}
      >
        Pay
      </Button>
    </CustomModal>
  );
};

export default SellGiftCardsModal;
