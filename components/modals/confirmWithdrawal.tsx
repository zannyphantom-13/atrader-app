import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import { useAppSelector } from "@/redux/store";
// import { colorThemes } from "@/styles/theme";
// import { app_config } from "@/utils/config";
import { formatNumber, parseAmount } from "@/utils/formatamount";
import React from "react";
import { Image, View } from "react-native";
import { ThemedText } from "../theme/themeText";
import { Button } from "../ui/button";
import { CustomModal } from "../ui/modal";

interface AirtimeModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  formData: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode: string;
    bankUrl: string;
    amount: string;
    description: string;
  };
  setShowPinModal: (show: boolean) => void;
}

const ConfirmWithdrawal = ({
  visible,
  setVisible,
  formData,
  setShowPinModal,
}: AirtimeModalProps) => {
  const { isDark } = useTheme();
  //   const [isEnabled, setIsEnabled] = React.useState(false);
  //   const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  //   const { phoneBeneficiaries } = useAppSelector((state) => state.beneficiary);

  const { user: userInfo } = user || {};
  //   React.useEffect(() => {
  //     if (formData?.amount && formData?.accountNumber) {
  //       const existingBeneficiary = phoneBeneficiaries.find(
  //         (bene) => bene.number === formData.accountNumber
  //       );
  //       setIsEnabled(!!existingBeneficiary);
  //     }
  //   }, [formData, phoneBeneficiaries]);

  //   const toggleSwitch = () => {
  //     const newValue = !isEnabled;
  //     setIsEnabled(newValue);
  //     if (!isEnabled) {
  //       // ADD
  //       dispatch(
  //         addPhoneBeneficiary({
  //           id: formData.number,
  //           number: formData.number,
  //           network: formData.network,
  //           name: formData.network,
  //         })
  //       );
  //     } else {
  //       // REMOVE
  //       dispatch(
  //         removePhoneBeneficiary({
  //           id: formData.number,
  //           number: formData.number,
  //           network: formData.network,
  //           name: formData.network,
  //         })
  //       );
  //     }
  //   };

  //   const BeneficiaryIcon = getIcons(formData.network);

  const checkAccBalance = () => {
    if (userInfo?.bal && formData.amount) {
      return parseAmount(userInfo?.bal) > parseAmount(formData.amount) ? false : true;
    }
    return false;
  };
  const insufficientBalance = checkAccBalance();

  const handleWithdraw = () => {
    setVisible(false);
    setTimeout(() => {
      setShowPinModal(true);
    }, 300);
  };

  console.log("Insufficient Balance:", insufficientBalance);
  return (
    <CustomModal
      visible={visible}
      onClose={() => {
        setVisible(false);
        setShowPinModal(false);
      }}
      title="Airtime"
      closebutton={true}
      height="72%"
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
      onRequestClose={() => { }}
      className="font-primary-bold  bg-red-500 text-[2px]"
    >
      <ThemedText
        family="secondary"
        weight="medium"
        className="text-b3 pb-4 text-center"
      >
        {" You're paying"}
      </ThemedText>
      <ThemedText
        family="primary"
        weight="bold"
        className="text-h7 text-center"
      >
        ₦{formatNumber(formData.amount)}
      </ThemedText>

      {/*  */}
      <View className="flex-1 mt-4">
        {/* 1st row */}
        <View className="flex-row items-center justify-between mb-3">
          <ThemedText
            family="primary"
            weight="medium"
            variant="secondary"
            className="text-b2 text-left mb-2"
          >
            Account Number
          </ThemedText>
          <View className="flex-row items-center gap-2">
            <ThemedText family="primary" weight="medium" className="text-b2">
              {formData.accountNumber}
            </ThemedText>
          </View>
        </View>

        {/* 2nd row */}
        <View className="flex-row items-center justify-between mb-3">
          <ThemedText
            family="primary"
            variant="secondary"
            weight="medium"
            className="text-b2 text-left mb-2"
          >
            Bank
          </ThemedText>
          <View className="flex-row items-center gap-2">
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
              <ThemedText className="bg-white dark:bg-dark-500 w-8 h-8 text-center leading-8 rounded-full text-xs">
                {formData.bankName.charAt(0).toUpperCase() || "B"}
              </ThemedText>
            )}
            <ThemedText
              family="primary"
              weight="medium"
              className="text-b2 uppercase"
            >
              {formData.bankName || "Unknown Bank"}
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
            Account Name
          </ThemedText>
          <View className="flex-row items-center gap-2">
            <ThemedText family="primary" weight="medium" className="text-b2">
              {formData.accountName || "Unknown Account Name"}
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
          <View className="flex-row items-center bg-light-200 dark:bg-dark-500 gap-2 px-3 py-2 rounded-full">
            <View className=" ">
              {isDark ? (
                <icons.wallet width={24} height={24} />
              ) : (
                <icons.wallet width={24} height={24} color="#696969" />
              )}
            </View>
            <ThemedText
              family="primary"
              weight="medium"
              className="text-b2 !text-primary-500"
            >
              ₦{formatNumber(userInfo?.bal || "0.00")}
            </ThemedText>
          </View>
        </View>
        {insufficientBalance && (
          <View className="px-1 mb-2">
            {/* <FileWarning color={"red"} size={14} /> */}
            <ThemedText
              family="primary"
              weight="medium"
              className={`text-b2 font-bold text-right ${isDark ? "!text-danger-300" : "!text-danger-800"}   `}
            >
              Insufficient balance
            </ThemedText>
          </View>
        )}

        {/* 5th row */}
        <View className="flex-row items-center justify-between mb-3">
          <ThemedText
            family="primary"
            weight="medium"
            variant="secondary"
            className="text-b2 text-left mb-2"
          >
            Balance after
          </ThemedText>
          <View>
            <ThemedText family="primary" weight="medium" className="text-b2">
              ₦{" "}
              {userInfo && formData.amount
                ? formatNumber(parseAmount(userInfo?.bal) - parseAmount(formData.amount))
                : "0.00"}
            </ThemedText>
          </View>
        </View>

        <View className="border border-border-light dark:border-border-dark my-5" />

        {/* show if amount is more than balance
         */}

        {/* 6th row */}
        {/* <View className="flex-row items-center justify-between mb-3">
          <ThemedText
            family="primary"
            weight="medium"
            className="text-b2 text-left mb-2"
          >
            Save as beneficiary
          </ThemedText>
          <Pressable onPress={() => {}} className="flex-row items-center gap-2">
            <Switch
              value={isEnabled}
              //   onValueChange={toggleSwitch}
              trackColor={{
                false:
                  colorThemes[
                    app_config.theme as keyof typeof colorThemes
                  ][100],
                true: colorThemes[
                  app_config.theme as keyof typeof colorThemes
                ][500],
              }}
              ios_backgroundColor={"#787880"}
            />
          </Pressable>
        </View> */}
      </View>
      {/* Button */}
      <Button
        className="bg-primary-500 py-[16px] rounded-xl"
        onPress={handleWithdraw}
      >
        Withdraw
      </Button>
    </CustomModal>
  );
};

export default ConfirmWithdrawal;
