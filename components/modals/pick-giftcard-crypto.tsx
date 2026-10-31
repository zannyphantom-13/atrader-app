import { icons } from "@/constant/icon";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { paths } from "@/utils/paths";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { ThemedText } from "../theme/themeText";
import { CustomModal } from "../ui/modal";

interface PickTypeModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  pickTyp: "crypto" | "giftcard" | "topup" | null;
  onDepositPress?: () => void;
}

const depDataGiftCard = [
  {
    id: 1,
    title: "Sell Gift Card",
    description: "Pay directly with Nectpoint",
    icon: img.giftcardSellDark,
    iconLight: img.giftcardSellLight,
    route: `${paths.giftcards.sellGiftCards}`,
    active: true,
  },
  {
    id: 2,
    title: "Buy Gift Card",
    description: "Send to a unique wallet address tie to your wallet account",
    icon: img.giftcardBuyDark,
    iconLight: img.giftcardBuyLight,
    route: `${paths.giftcards.buyGiftcardsData}`,
    active: true,
  },
];

const depDataCrypto = [
  {
    id: 1,
    title: "Sell Crypto",
    description: "Pay directly with Nectpoint",
    icon: img.btcDark,
    iconLight: img.btc,
    route: `${paths.crypto.sellCrypto}`,
    active: true,
  },
  {
    id: 2,
    title: "Buy Crypto",
    description: "Send to a unique wallet address tie to your wallet account",
    icon: img.btcDark,
    iconLight: img.btc,
    route: ``,
    active: false,

  },
];

const depDataTopUp = [
  {
    id: 1,
    title: "Naira",
    description: "Deposit Naira directly into your wallet",
    icon: icons.nairaGreen,
    iconLight: icons.nairaGreen,
    route: `${paths.deposit}`,
    active: true,
  },
  {
    id: 2,
    title: "Crypto",
    description: "Sell your crypto for Naira in your wallet",
    icon: img.cryptoDark,
    iconLight: img.cryptoLight,
    route: `${paths.crypto.sellCrypto}`,
    active: true,
  },
];

const PickTypeModal = ({
  visible,
  setVisible,
  pickTyp,
  onDepositPress,
}: PickTypeModalProps) => {
  const { isDark } = useTheme();
  const router = useRouter();

  // Use prop directly instead of local state to avoid stale state issues

  return (
    <CustomModal
      visible={visible}
      onClose={() => setVisible(false)}
      title={
        pickTyp === "topup" ? "Top up" : "Pick Giftcard or Crypto"
      }
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
          Select an option to continue
        </ThemedText>

        {/* Crypto  */}
        {pickTyp === "giftcard" && (
          <>
            <View className="flex flex-col gap-2 pt-4 ">
              {depDataGiftCard.map((item, index) => (
                <Pressable
                  key={item.id}
                  disabled={!item.active}
                  onPress={() => {
                    if (item.route) {
                      router.push(item.route as any);
                      setVisible(false);
                    }
                  }}
                  className={`flex-row items-center gap-4 p-4 bg-[#F5F5F5] dark:bg-[#111111] rounded-[20px] border-[#EFEFEF] dark:border-[#232323] border-[0.5px] ${!item.active ? "opacity-50" : ""}`}
                >
                  <View className="">
                    {isDark ? (
                      <item.icon width={38} height={38} />
                    ) : (
                      <item.iconLight width={38} height={38} />
                    )}
                  </View>
                  <View className="flex-1">
                    <ThemedText
                      family="primary"
                      weight="medium"
                      className="text-b1"
                    >
                      {item.title}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {pickTyp === "crypto" && (
          <>
            <View className="flex flex-col gap-2 pt-4 relative ">
              {depDataCrypto.map((item, index) => (
                <View key={item.id} className="relative">
                  <Pressable

                    disabled={!item.active}
                    onPress={() => {
                      if (item.route) {
                        router.push(item.route as any);
                        setVisible(false);
                      }
                    }}
                    className={`flex-row items-center gap-4 p-4 bg-[#F5F5F5] dark:bg-[#111111] rounded-[20px] border-[#EFEFEF] dark:border-[#232323] border-[0.5px] ${!item.active ? "opacity-50" : ""}`}
                  >
                    <View className="">
                      {isDark ? (
                        <item.icon width={38} height={38} />
                      ) : (
                        <item.iconLight width={38} height={38} />
                      )}
                    </View>
                    <View className="flex-1">
                      <ThemedText
                        family="primary"
                        weight="medium"
                        className="text-b1"
                      >
                        {item.title}
                      </ThemedText>
                    </View>

                  </Pressable>
                  {
                    !item.active && (
                      <View className="absolute right-4 top-2 bg-primary-500 rounded-full px-2 py-0.5 justify-center items-center">
                        <ThemedText
                          family="primary"
                          weight="bold"
                          className="text-[10px] text-white text-center"
                        >
                          {'Coming soon'}
                        </ThemedText>
                      </View>
                    )
                  }
                </View>
              ))}
            </View>
          </>
        )}

        {pickTyp === "topup" && (
          <>
            <View className="flex flex-col gap-2 pt-4 relative ">
              {depDataTopUp.map((item, index) => (
                <View key={item.id} className="relative">
                  <Pressable
                    disabled={!item.active}
                    onPress={() => {
                      if (item.route === paths.deposit && onDepositPress) {
                        setVisible(false);
                        onDepositPress();
                      } else if (item.route) {
                        router.push(item.route as any);
                        setVisible(false);
                      }
                    }}
                    className={`flex-row items-center gap-4 p-4 bg-[#F5F5F5] dark:bg-[#111111] rounded-[20px] border-[#EFEFEF] dark:border-[#232323] border-[0.5px] ${!item.active ? "opacity-50" : ""}`}
                  >
                    <View className="">
                      {isDark ? (
                        <item.icon width={24} height={24} />
                      ) : (
                        <item.iconLight width={24} height={24} />
                      )}
                    </View>
                    <View className="flex-1">
                      <ThemedText
                        family="primary"
                        weight="medium"
                        className="text-b1"
                      >
                        {item.title}
                      </ThemedText>
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </CustomModal>
  );
};

export default PickTypeModal;
