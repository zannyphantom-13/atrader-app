import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { paths } from "@/utils/paths";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";

interface Service {
  id: string;
  name: string;
  route: string;
  type: string;
  isTagActive: boolean;
  tag?: string;
}

const servicesData: Service[] = [
  {
    id: "1",
    route: paths.bills.airtime,
    name: "Airtime",
    type: "Other",
    isTagActive: false,
    tag: "Coming soon",
  },
  {
    id: "2",
    route: paths.bills.data,
    name: "Data",
    type: "Other",
    isTagActive: false,
    tag: "Coming soon",
  },
  {
    id: "3",
    route: paths.bills.cable,
    name: "Cable Tv",
    type: "Other",
    isTagActive: false,
    tag: "Coming soon",
  },
  {
    id: "4",
    route: paths.bills.electricity,
    name: "Electricity",
    type: "Other",
    isTagActive: false,
    tag: "Coming soon",
  },
  {
    id: "5",
    route: paths.giftcards.buyGiftcardsData,
    name: "Buy Gift Card",
    type: "Top",
    isTagActive: false,
    tag: "Coming soon",
  },
  {
    id: "6",
    route: paths.giftcards.sellGiftCards,
    name: "Sell Gift Card",
    type: "Top",
    isTagActive: false,
    tag: "Coming soon",
  },
  {
    id: "7",
    route: paths.bills.betting,
    name: "Betting",
    type: "Other",
    isTagActive: false,
    tag: "Coming soon",
  }, // buy , sell crypto
  {
    id: "9",
    route: paths.crypto.sellCrypto,
    name: "Sell Crypto",
    type: "Top",
    isTagActive: false,
    tag: "Coming soon",
  },
  // {
  //   id: "8",
  //   route: paths.crypto.buyCrypto,
  //   name: "Buy Crypto",
  //   type: "Top",
  //   isTagActive: true,
  //   tag: "Coming soon",
  // },
  {
    id: "10",
    route: paths.deposit,
    name: "Deposit",
    type: "other",
    isTagActive: false,
    tag: "Coming soon",
  },
];

const More: React.FC = () => {
  const { isDark } = useTheme();
  // const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  // const [favourites, setFavourites] = React.useState<Service[]>([]);

  const getIcons = (serviceName: string) => {
    switch (serviceName) {
      case "Airtime":
        return isDark ? (
          <img.airtimeDark width={38} height={38} />
        ) : (
          <img.airtimeLight width={38} height={38} />
        );
      case "Data":
        return isDark ? (
          <img.dataDark width={38} height={38} />
        ) : (
          <img.dataLight width={38} height={38} />
        );
      case "Cable Tv":
        return isDark ? (
          <img.tvDark width={38} height={38} />
        ) : (
          <img.tvLight width={38} height={38} />
        );
      case "Electricity":
        return isDark ? (
          <img.electDark width={38} height={38} />
        ) : (
          <img.electLight width={38} height={38} />
        );
      case "Buy Gift Card":
        return isDark ? (
          <img.giftcardDark width={38} height={38} />
        ) : (
          <img.giftcardLight width={38} height={38} />
        );
      case "Sell Gift Card":
        return isDark ? (
          <img.giftcardDark width={38} height={38} />
        ) : (
          <img.giftcardLight width={38} height={38} />
        );
      case "Buy Crypto":
        return isDark ? (
          <img.cryptoDark width={38} height={38} />
        ) : (
          <img.cryptoLight width={38} height={38} />
        );
      case "Sell Crypto":
        return isDark ? (
          <img.cryptoDark width={38} height={38} />
        ) : (
          <img.cryptoLight width={38} height={38} />
        );
      case "Betting":
        return isDark ? (
          <img.bettingDark width={38} height={38} />
        ) : (
          <img.bettingLight width={38} height={38} />
        );
      default:
        return isDark ? (
          <img.airtimeDark width={38} height={38} />
        ) : (
          <img.airtimeLight width={38} height={38} />
        );
    }
  };

  const handleServicePress = React.useCallback(
    (serviceroute: string, isActiveService: boolean) => {
      if (!isActiveService) {
        router.push(serviceroute as any);
      }
    },
    [router],
  );

  const isMobile = Platform.OS === "ios" ? false : true;

  return (
    <>
      <SettingsHeader
        title="More"
      />
      <ThemedView className="flex-1 bg-light-150 dark:bg-dark-900 px-6">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: 44,
            paddingTop: Platform.OS === "ios" ? 0 : 10,
          }}
          showsVerticalScrollIndicator={false}
        >

          {/* Top services */}
          <ThemedText
            variant="secondary"
            weight="medium"
            className="px-2 py-1 w-full text-b2 mt-4"
          >
            Top services
          </ThemedText>
          <View
            className="my-3 py-[8px] rounded-[30px] px-[8px] flex-row flex-wrap bg-dark:bg-dark-600 bg-white dark:bg-[#111111] justify-between gap-y-4 mt-4 border border-border-light dark:border-border-dark">

            {servicesData
              .filter((data) => data.type === "Top")
              .map((item) => (
                <View key={item.id} className="w-[48%]">
                  <Pressable
                    className="flex-row items-center gap-2 justify-start py-3 min-h-[56px] bg-[#F8F8F8] dark:bg-dark-900 rounded-[18px] px-2"
                    onPress={() => {
                      handleServicePress(item.route, item.isTagActive);
                    }}
                  >
                    <View className="rounded-[16px]">
                      {getIcons(item.name)}
                    </View>
                    <ThemedText
                      className="text-b2 font-primary-medium flex-1"
                      variant="primary"
                      family="primary"
                      weight="medium"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {item.name}
                    </ThemedText>

                  </Pressable>
                </View>
              ))}
          </View>


          <ThemedText
            variant="secondary"
            weight="medium"
            className="px-2 mt-2 w-full text-b2"
          >
            Other services
          </ThemedText>

          {/* Other */}
          <View
            className="my-3 py-[8px] rounded-[30px] px-[8px] flex-row flex-wrap bg-dark:bg-dark-600 bg-white dark:bg-[#111111] justify-between gap-y-4 mt-4 border border-border-light dark:border-border-dark">
            {servicesData
              .filter((data) => data.type === "Other")
              .map((item) => (
                <View key={item.id} className="w-[48%]">
                  <Pressable
                    className="flex-row items-center gap-2 justify-start py-3 min-h-[56px] bg-[#F8F8F8] dark:bg-dark-900 rounded-[60px] px-2"
                    onPress={() => {
                      handleServicePress(item.route, item.isTagActive);
                    }}
                  >
                    <View className="rounded-[16px]">
                      {/* {isDark ? (
                              <item.iconLight width={34} height={34} />
                            ) : (
                              <item.iconDark width={34} height={34} />
                            )} */}
                      {getIcons(item.name)}
                    </View>
                    <ThemedText
                      className="text-b2 font-primary-medium flex-1"
                      variant="primary"
                      family="primary"
                      weight="medium"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {item.name}
                    </ThemedText>

                  </Pressable>
                </View>
              ))}
          </View>

          {/* Top */}
          {/* <View>
          <View className="flex-row items-center justify-between mt-3 ">
            <ThemedText
              variant="primary"
              weight="bold"
              className="px-2 py-1 text-b2"
            >
              Top
            </ThemedText>
          </View>
          <View className="p-4 rounded-[8px] bg-light-100 dark:bg-dark-500 mt-[10px]">
            {servicesData
              .filter((data) => data.type === "Top")
              .map((service) => (
                <Pressable
                  key={service.id}
                  className="flex flex-row items-center justify-between gap-[12px] mb-3"
                  onPress={() =>
                    handleServicePress(service.route, service.isTagActive)
                  }
                >
                  <View className=" flex-row items-center justify-center gap-4">
                    <View className="bg-white w-[40px] h-[40px] flex items-center justify-center dark:bg-black border-light-100 border dark:border-dark-300 p-3 rounded-full">
                      {getIcons(service.name)}
                    </View>

                    <ThemedText
                      variant="primary"
                      weight="medium"
                      className="text-b3 text-center"
                      numberOfLines={2}
                    >
                      {service.name}
                    </ThemedText>
                  </View>
                  {service.isTagActive && (
                    <ThemedText
                      variant="primary"
                      weight="medium"
                      className="text-b3 text-center bg-[#FF9900] text-white rounded-tl-xl  px-2 py-1 rounded-e-xl"
                    >
                      {service.tag}
                    </ThemedText>
                  )}
                </Pressable>
              ))}
          </View>
        </View> */}



          {/* All Features */}
          {/* <View>
        <View className="flex-row items-center justify-between mt-3 ">
          <ThemedText
            variant="primary"
            weight="bold"
            className="px-2 py-1 text-b2"
          >
            All Features
          </ThemedText>
        </View>
        <View className="p-4 rounded-[8px] bg-light-100 dark:bg-dark-500 mt-[10px]">
          {servicesData
            .filter((data) => data.type === "Top")
            .map((service) => (
              <Pressable
                key={service.id}
                className="flex flex-row items-center gap-[12px] mb-3"
                onPress={() => handleServicePress(service.route)}
              >
                <View className="bg-white w-[40px] h-[40px] flex items-center justify-center dark:bg-black border-light-100 border dark:border-dark-300 p-3 rounded-full">
                  {getIcons(service.name)}
                </View>
                <ThemedText
                  variant="primary"
                  weight="medium"
                  className="text-b3 text-center"
                  numberOfLines={2}
                >
                  {service.name}
                </ThemedText>
              </Pressable>
            ))}
        </View>
      </View> */}
        </ScrollView>
      </ThemedView>
    </>
  );
};

export default More;
