import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import { paths } from "@/utils/paths";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../theme/themeText";
import { CustomModal } from "../ui/modal";

interface DepositModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
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
    route: ``,
  },
];

const DepositModal = ({ visible, setVisible }: DepositModalProps) => {
  const { isDark } = useTheme();
  const router = useRouter();

  return (
    <CustomModal
      visible={visible}
      onClose={() => setVisible(false)}
      title="Deposit"
      // height="auto"
      // topOffset={80}
      bottomOffset={0}
      modalStyle={{
        borderRadius: 30,
        paddingTop: 20,
        paddingBottom: 20,
      }}
      // containerStyle={{
      //   backgroundColor: "rgba(0, 0, 0, 0.8)",
      //   borderRadius: 30,
      // }}
      showHandle={false}
      showHeader={false}
      closebutton={true}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => setVisible(false)}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >

        <ThemedText
          family="secondary"
          weight="medium"
          className="text-[16px] pt-2 text-left"
        >
          Select and option to continue
        </ThemedText>

        {/* Deposit Options */}
        <View className="flex flex-col gap-4 ">
          {depData.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => {
                if (item.route) {
                  router.push(item.route as any);
                  setVisible(false);
                }
              }}
              className="flex-row items-center gap-4 p-4 bg-light-150 dark:bg-dark-700 rounded-xl"
            >
              <View className="w-12 h-12 rounded-full bg-light-200 dark:bg-dark-500 flex items-center justify-center">
                {isDark ? (
                  <item.iconLight width={24} height={24} />
                ) : (
                  <item.icon width={24} height={24} />
                )}
              </View>
              <View className="flex-1">
                <ThemedText family="primary" weight="bold" className="text-b1">
                  {item.title}
                </ThemedText>
                <ThemedText
                  family="secondary"
                  weight="medium"
                  className="text-b3 mt-1 text-text-secondary-light dark:text-text-secondary-dark"
                  numberOfLines={2}
                >
                  {item.description}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </CustomModal>
  );
};

export default DepositModal;
