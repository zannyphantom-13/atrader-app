import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import { paths } from "@/utils/paths";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { CustomModal } from "../ui/modal";
import { ThemedText } from "../theme/themeText";

interface plantypeProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const depData = [
  {
    id: 1,
    title: "Cooperate gifting",
    description: "Pay directly with Nectpoint",
    icon: icons.naira,
    iconLight: icons.nairaLight,
    route: `${paths.deposit}`,
  },
  {
    id: 2,
    title: "Sme",
    description: "Send to a unique wallet address tie to your wallet account",
    icon: icons.cryptoDep,
    iconLight: icons.cryptoDepLight,
    route: `${paths.depositCrypto}`,
  },
  {
    id: 3,
    title: "Gifting",
    description: "Send to a unique wallet address tie to your wallet account",
    icon: icons.cryptoDep,
    iconLight: icons.cryptoDepLight,
    route: `${paths.depositCrypto}`,
  },
];

const PlanType = ({ visible, setVisible }: plantypeProps) => {
  const { isDark } = useTheme();
  const router = useRouter();

  return (
    <CustomModal
      visible={visible}
      onClose={() => setVisible(false)}
      title="Deposit"
      height="auto"
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
        family="primary"
        weight="bold"
        className="text-h7 text-center"
      >
        Deposit
      </ThemedText>
      <ThemedText
        family="secondary"
        weight="medium"
        className="text-b3 pt-2 text-center"
      >
        Choose how to deposit and continue
      </ThemedText>

      {/*  */}
      <View className="flex flex-col gap-4 pt-5">
        {depData.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={1}
            onPress={() => {
              router.push(item.route as any);
              setVisible(false);
            }}
            className="flex-row items-center gap-4 p-4 bg-light-150 dark:bg-black rounded-xl"
          >
            <View className="w-10 h-10 rounded-full bg-light-200 dark:bg-dark-500 flex items-center justify-center">
              {
                isDark ? (
                  <item.iconLight width={24} height={24} />
                ) : (
                  <item.icon width={24} height={24} />
                )
                // <item.icon width={24} height={24} color="#696969" />
              }
            </View>
            <View className="flex-1">
              <ThemedText family="primary" weight="bold" className="text-b1">
                {item.title}
              </ThemedText>
              <ThemedText
                family="secondary"
                weight="medium"
                className="text-b3 mt-1 text-text-secondary-light dark:text-text-secondary-dark"
              >
                {item.description}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* <ThemedText
        family="secondary"
        weight="regular"
        className="text-b3 pt-4 text-center"
      >
        Crypto payment will be automatically converted to Naira and will reflect
        directly to your account
      </ThemedText> */}
    </CustomModal>
  );
};

export default PlanType;
