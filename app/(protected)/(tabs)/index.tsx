import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import WarningBanner from "@/components/ui/warningbanner";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useAuth } from "@/guards/guard";
// import useAuthToken from "@/hooks/useToken";
import { ServiceIcon } from "@/components/customs/serviceIcon";
import PickTypeModal from "@/components/modals/pick-giftcard-crypto";
import { TransactionSkeleton } from "@/components/skeletons/transactionskeleton";
import { getLocalTransactions, formatTransactionDate } from "@/services/local-transaction-service";
import { useAppSelector } from "@/redux/store";
import { useGetAllTransactionMutation } from "@/redux/transaction/transaction_history";
import app_colors from "@/styles/color";
import { app_config } from "@/utils/config";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { EyeClosed, EyeOff } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { formatNumber } from "../../../utils/formatamount";

const homeData1 = [
  {
    id: 1,
    title: "Gift card",
    iconDark: img.giftcardLight,
    iconLight: img.giftcardDark,
    route: `${paths.giftcards.sellGiftCards}`,
    type: "giftcard",
  },
  {
    id: 2,
    title: "Crypto",
    iconDark: img.cryptoLight,
    iconLight: img.cryptoDark,
    route: `${paths.tabs.home}`,
    type: "crypto",
  },
  {
    id: 3,
    title: "Airtime",
    iconDark: img.airtimeLight,
    iconLight: img.airtimeDark,
    route: `${paths.bills.airtime}`,
    type: "airtime",
  },
  {
    id: 4,
    title: "More",
    iconDark: img.billLight,
    iconLight: img.billDark,
    route: `${paths.more}`,
    type: "more",
  },
];

const PromotionalBanner = ({
  banner,
  index,
}: {
  banner: any;
  index: number;
}) => {
  const handleBannerPress = () => {
    console.log("Banner pressed:", banner.title);
  };
  const { width: screenWidth } = Dimensions.get("window");

  return (
    <Pressable
      style={{
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
      }}
      onPress={handleBannerPress}
    >
      <LinearGradient
        colors={["#84CC16", "#10B981", "#059669"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          // height: 160,
          borderRadius: 16,
          width: screenWidth,
          padding: 16,
          justifyContent: "center",
        }}
      >
        <View
          // className="bg-red-500"
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          {banner?.image && (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              {/* <Text style={{ fontSize: 18 }}>{banner.icon}</Text> */}
              <Image
                source={{
                  uri: banner.image?.startsWith("http") ? banner.image : ``,
                }}
                style={{ width: 32, height: 32 }}
                className="rounded-full"
              />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "white",
                fontFamily: "Primary-Bold",
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              {banner?.text}
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontFamily: "Primary-Regular",
                fontSize: 12,
              }}
            >
              {banner?.extra_text}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const TransactionItem = ({ transaction }: { transaction: any }) => {
  const handleTransactionPress = () => {
    router.push({
      pathname: paths.detailtransaction,
      params: {
        transId: transaction?.transid || transaction?.id,
        type: transaction?.role,
        receiptData: JSON.stringify(transaction),
      },
    });
  };

  return (
    <Pressable
      className="flex-row items-center justify-between py-[7px] px-[8px] rounded-[16px] my-1 border-[#EFEFEF]  dark:border-[#232323] border-[0.5px] bg-[#FFFFFF] dark:bg-[#111111] "
      onPress={handleTransactionPress}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-10 h-10 rounded-[12px] bg-surface-light p-[4px] dark:bg-surface-dark items-center justify-center mr-3"
        >
          <ServiceIcon
            role={transaction?.role}
            name={transaction?.role}
            image={transaction?.logo_url}
            size={32}
            isDetail={false}
          />
        </View>

        <View className="flex-1">
          <ThemedText
            className="text-b2 font-primary-bold capitalize"
            variant="primary"
            family="primary"
            weight="medium"
          >
            {/* {transaction?.role?.toLowerCase() === "giftcard" && transaction?.category
              ? `${transaction.category} Giftcard`
              : transaction?.role} */}
            {transaction?.message}
          </ThemedText>
          <ThemedText
            className="text-[12px] mt-2"
            variant="secondary"
            family="primary"
            weight="medium"
          >
            {formatTransactionDate(transaction?.plan_date || transaction?.date)}
          </ThemedText>
        </View>
      </View>

      <View className="items-end">
        <ThemedText
          className="text-b4 font-primary-bold"
          variant="primary"
          family="primary"
          weight="bold"
        >
          {'₦' + formatNumber(Number(transaction?.amount))}
        </ThemedText>
        <Text
          className={`text-[12px] mt-2 font-primary-medium 
            ${transaction.plan_status === 1
              ? "text-success-500"
              : transaction.plan_status === 0
                ? "text-warning-500"
                : "text-danger-500"
            }
            `}
        >
          {transaction.plan_status === 0
            ? "Pending"
            : transaction.plan_status === 1
              ? "Successful"
              : "Failed"}
        </Text>
      </View>
    </Pressable>
  );
};

const Home = () => {
  const [isToggle, setIsToggle] = React.useState(false);
  const { isDark } = useTheme();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const withTextViewRef = React.useRef<ScrollView>(null);
  const [giftCheckModalVisible, setGiftCheckModalVisible] =
    React.useState(false);
  const [pickType, setPickType] = useState<"crypto" | "giftcard" | "topup" | null>(null);

  const [transactions, setTransactions] = React.useState<any>([]);

  const { width: screenWidth } = Dimensions.get("window");

  const scrollX = React.useRef(new Animated.Value(0)).current;
  const BannerWidth = screenWidth;
  const position = Animated.divide(scrollX, BannerWidth);
  // const toast = useToast();
  const { user } = useAppSelector((state) => state.auth);

  const { flyers = [], user: userInfo } = user || {};

  const withText = flyers?.filter((r: any, i: number) => {
    return r?.is_flyer === 0;
  });

  const withoutText = flyers?.filter((r: any, i: number) => {
    return r?.is_flyer === 1;
  });

  const { refreshToken } = useAuth();

  const [getAllTransaction, { isLoading }] = useGetAllTransactionMutation();
  // inside Home()
  const warningScrollRef = React.useRef<ScrollView>(null);

  // Build dynamic warnings
  const warnings = React.useMemo(() => {
    const list: any[] = [];

    if (!userInfo?.ispinset) {
      list.push({
        id: "set-pin",
        message: "⚠️ Kindly set up your transaction PIN to enable withdrawals",
        actionText: "Set PIN",
        onActionPress: () => router.push(paths.setting.changepin),
      });
    }

    // if (!user?.isEmailVerified) {
    //   list.push({
    //     id: "verify-email",
    //     message: "⚠️ Verify your email to keep your account secure",
    //     actionText: "Verify",
    //     onActionPress: () => router.push(paths.setting.changepin),
    //   });
    // }

    // if (!user?.isProfileComplete) {
    //   list.push({
    //     id: "complete-profile",
    //     message: "⚠️ Complete your profile to unlock all features",
    //     actionText: "Complete Now",
    //     onActionPress: () => router.push(paths.profile.edit),
    //   });
    // }

    return list;
  }, [user]);



  React.useEffect(() => {
    if (!warnings.length) return;

    const bannerWidth = BannerWidth;
    const maxOffset = bannerWidth * (warnings.length - 1);
    let currentOffset = 0;

    const interval = setInterval(() => {
      currentOffset += bannerWidth;
      if (currentOffset > maxOffset) currentOffset = 0;

      warningScrollRef.current?.scrollTo({ x: currentOffset, animated: true });
    }, 4000);

    return () => clearInterval(interval);
  }, [warnings, BannerWidth]);

  const fetchTransactions = useCallback(async () => {
    try {
      const atex = await TokenManager.getToken();

      const response: any = await getAllTransaction({
        data: {
          token: atex,
          per_page: 5,
          page: 1,
        },
      }).unwrap();

      const serverTx = response.status === "success" ? (response?.transactions || []) : [];
      const localTx = await getLocalTransactions();

      const seen = new Set<string>();
      const merged: any[] = [];
      for (const item of [...localTx, ...serverTx]) {
        const key = (item.transid || item.id)?.toString();
        if (key && !seen.has(key)) {
          seen.add(key);
          merged.push(item);
        } else if (!key) {
          merged.push(item);
        }
      }
      setTransactions(merged.slice(0, 5));
      console.log(response)
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [getAllTransaction]);

  useFocusEffect(
    React.useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions])
  );

  const handlePress = (route: string) => {
    console.log("Navigating to:", route);
    router.push(route as any);
  };

  const handleToggle = () => {
    setIsToggle(!isToggle);
  };

  const handleViewAllTransactions = () => {
    router.push(paths.transactionhistory);
  };

  const handleRoute = (route: string) => {
    router.push(route as any);
  };

  const handlePickType = useCallback((type: any) => {
    if (type.type === "giftcard" || type.type === "crypto") {
      setPickType(type.type);
      setGiftCheckModalVisible(true);
    } else {
      setPickType(null);
      router.push(type.route as any);
    }
  }, []);
  React.useEffect(() => {
    let currentOffset = 25;
    const bannerWidth = BannerWidth; // ← Use your BannerWidth (screenWidth)
    const maxOffset = bannerWidth * (withText?.length - 1);

    const interval = setInterval(() => {
      currentOffset += bannerWidth;
      if (currentOffset > maxOffset) {
        currentOffset = 0;
      }

      scrollViewRef.current?.scrollTo({
        x: currentOffset,
        animated: true,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    let currentOffset = 20;
    const bannerWidth = BannerWidth; // ← Use your BannerWidth (screenWidth)
    const maxOffset = bannerWidth * (withoutText?.length - 1);

    const interval = setInterval(() => {
      currentOffset += bannerWidth;
      if (currentOffset > maxOffset) {
        currentOffset = 0;
      }

      withTextViewRef.current?.scrollTo({
        x: currentOffset,
        animated: true,
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    refreshToken();
  };

  return (
    <>
      <ThemedView className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 10 }}
          refreshControl={
            refresh && <RefreshControl refreshing={false} onRefresh={refresh} />
          }
        >
          <ImageBackground
            source={img.walletbg} // Consider using different images for light/dark mode
            className="h-[153px] mx-4 p-4 r!ounded-[20px]"
            resizeMode="cover"
            // blurRadius={16}
            style={{ overflow: "hidden", borderRadius: 30 }}
          >
            <View className="flex-row pt-[0px]  items-center justify-between">
              <View className="">
                <Text className="text-b3 font-primary-medium text-light-150 mb-1">
                  Account Balance
                </Text>
                {isToggle ? (
                  <View className="flex-row items-center gap-1">
                    <Text className="text-center text-h4 font-primary-bold text-white">
                      ₦
                    </Text>
                    <Text className="text-center text-h4 font-primary-bold text-white">
                      {userInfo?.bal
                        ? formatNumber(userInfo?.bal)
                        : "0.00"}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-center text-h4 font-primary-bold text-white">
                    **********
                  </Text>
                )}
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={handleToggle}
                  // activeOpacity={1}
                  className="px-2 py-2 rounded-full flex-row gap-1 bg-[#000000B2]" // Semi-transparent background
                >
                  <Text className="text-[12px] font-primary-semibold text-white">
                    {isToggle ? "Hide" : "Show"}
                  </Text>
                  <View className="pt-[1.5px]">
                    {isToggle ? (
                      <EyeClosed size={12} color="#FFFFFF" />
                    ) : (
                      <EyeOff size={12} color="#FFFFFF" />
                    )}
                  </View>
                </Pressable>
              </View>
            </View>

            <View className="flex-row flex-1 items-center justify-center gap-2 mt-2">
              <Pressable
                onPress={() => { router.push(paths.withdraw) }}
                style={{
                  flex: 1,
                  overflow: "hidden",
                  height: 45,
                  paddingVertical: 10,
                  marginLeft: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 60,
                  paddingHorizontal: 16,
                  gap: 10,
                  backdropFilter: "30px",
                }}
                className="bg-[#E8FFE44D]"
              >
                <ThemedText
                  className="text-[14px] text-center !text-light-100"
                  weight="semibold"
                  variant="primary"
                >
                  Withdraw
                </ThemedText>
                <Feather name="arrow-up-right" size={20} color="white" />
              </Pressable>
              <Pressable
                onPress={() => {
                  setPickType("topup");
                  setGiftCheckModalVisible(true);
                }}
                style={{
                  flex: 1,
                  overflow: "hidden",
                  height: 45,
                  paddingVertical: 10,
                  // marginLeft: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 60,
                  paddingHorizontal: 10,
                  gap: 10,
                }}
                className="bg-white"
              >
                <ThemedText
                  className="text-[14px] text-center !text-black"
                  weight="semibold"
                  variant="primary"
                >
                  Deposit
                </ThemedText>
                <Feather name="arrow-down-left" size={20} color="black" />
              </Pressable>
            </View>
          </ImageBackground>

          <View className="my-3 mx-5 py-[16px] rounded-[30px] border-[#EFEFEF] dark:border-[#232323] border-[0.5px] px-[12px] flex-row flex-wrap bg-dark:bg-dark-600 bg-white dark:bg-[#111111] justify-between gap-y-3">
            {homeData1?.map((item) => (
              <View key={item.id} className="w-[48%]">
                <Pressable
                  className="flex-row  items-center justify-start gap-3 py-[2px] h-[56px] bg-[#F8F8F8] dark:bg-[#0C0C0C] rounded-[60px] px-3"
                  onPress={() => handlePickType(item)}
                >
                  <View className="">
                    {isDark ? <item.iconLight /> : <item.iconDark />}
                  </View>
                  <ThemedText
                    className="text-b1 mr-2 text-center font-primary-medium"
                    variant="primary"
                    family="primary"
                    weight="medium"
                  >
                    {item.title}
                  </ThemedText>
                </Pressable>
              </View>
            ))}
          </View>

          {/* warning banners */}
          {warnings.length > 0 && (
            <Animated.ScrollView
              ref={warningScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={BannerWidth}
              snapToAlignment="start"
              scrollEventThrottle={16}
              decelerationRate={0.98}
            >
              {warnings.map((warn) => (
                <View
                  key={warn.id}
                  style={{ width: BannerWidth, paddingHorizontal: 20 }}
                >
                  <WarningBanner
                    message={warn.message}
                    actionText={warn.actionText}
                    onActionPress={warn.onActionPress}
                    isDismissible
                  />
                </View>
              ))}
            </Animated.ScrollView>
          )}

          {/* Promotional Banners Slider */}
          {withText?.length > 0 && (
            <View className="mt-2">
              <Animated.ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={BannerWidth}
                snapToAlignment="start"
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: false },
                )}
                scrollEventThrottle={16}
                decelerationRate={0.98}
              >
                {withText?.map((banner: any, index: number) => (
                  <View
                    key={banner?.id || index}
                    style={{
                      width: BannerWidth,
                      marginInline: "auto",
                      paddingHorizontal: 20,
                      // marginRight: index === promotionalBanners.length - 1 ? 0 : 0,
                    }}
                  >
                    <PromotionalBanner banner={banner} index={index} />
                  </View>
                ))}
              </Animated.ScrollView>

              {/* Dots Indicator */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  marginTop: 12,
                }}
              >
                {withText?.map((_: any, i: any) => {
                  // const position = Animated.divide(scrollX, screenWidth * 0.8 + 16);
                  const opacity = position.interpolate({
                    // color: {[ ]}
                    inputRange: [i - 1, i, i + 1],
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: "clamp",
                  });

                  const dotWidth = position.interpolate({
                    inputRange: [i - 1, i, i + 1],
                    outputRange: [12, 20, 12],
                    extrapolate: "clamp",
                  });

                  const backgroundColor = position.interpolate({
                    inputRange: [i - 1, i, i + 1],
                    outputRange: [
                      isDark ? "#ffffff" : "#000000", // inactive color
                      isDark
                        ? `${app_colors[app_config.theme][500]}`
                        : "#000000", // active color
                      isDark ? "#ffffff" : "#000000", // inactive color
                    ],
                    extrapolate: "clamp",
                  });

                  return (
                    <Animated.View
                      key={`dot-${i}`}
                      style={{
                        width: dotWidth,
                        height: 4,
                        borderRadius: 4,
                        // backgroundColor: isDark ? "#FFF" : "#000",
                        opacity,
                        marginHorizontal: 2,
                        backgroundColor,
                      }}
                    // className={` bg-background-dark dark:bg-primary-500`}
                    />
                  );
                })}
              </View>
            </View>
          )}

          {/* just flyer no image  */}
          {withoutText?.length > 0 && (
            <View className="mt-2">
              <Animated.ScrollView
                ref={withTextViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={BannerWidth}
                snapToAlignment="start"
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: false },
                )}
                scrollEventThrottle={16}
                decelerationRate={0.98}
              >
                {withoutText?.map((banner: any, index: number) => (
                  <View
                    key={banner?.id || index}
                    style={{
                      width: BannerWidth,
                      marginInline: "auto",
                      paddingHorizontal: 20,
                      height: 120,
                      // marginRight: index === promotionalBanners.length - 1 ? 0 : 0,
                    }}
                  >
                    <Image
                      source={{
                        uri: banner.image?.startsWith("http")
                          ? banner?.image
                          : ``,
                      }}
                      className="rounded-[20px] w-full h-full"
                    />
                  </View>
                ))}
              </Animated.ScrollView>

              {/* <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  marginTop: 12,
                }}
              >
                {withoutText?.map((_: any, i: any) => {
                  // const position = Animated.divide(scrollX, screenWidth * 0.8 + 16);
                  const opacity = position.interpolate({
                    // color: {[ ]}
                    inputRange: [i - 1, i, i + 1],
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: "clamp",
                  });

                  const dotWidth = position.interpolate({
                    inputRange: [i - 1, i, i + 1],
                    outputRange: [12, 20, 12],
                    extrapolate: "clamp",
                  });

                  const backgroundColor = position.interpolate({
                    inputRange: [i - 1, i, i + 1],
                    outputRange: [
                      isDark ? "#ffffff" : "#000000", // inactive color
                      isDark
                        ? `${app_colors[app_config.theme][500]}`
                        : "#000000", // active color
                      isDark ? "#ffffff" : "#000000", // inactive color
                    ],
                    extrapolate: "clamp",
                  });

                  return (
                    <Animated.View
                      key={`dot-${i}`}
                      style={{
                        width: dotWidth,
                        height: 4,
                        borderRadius: 4,
                        // backgroundColor: isDark ? "#FFF" : "#000",
                        opacity,
                        marginHorizontal: 2,
                        backgroundColor,
                      }}
                      // className={` bg-background-dark dark:bg-primary-500`}
                    />
                  );
                })}
              </View> */}
            </View>
          )}

          {/* Last Transaction Section */}
          <View className="mt-6 flex-1 px-[20px] pb-6  ">
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText
                className="text-b1 font-primary-bold"
                variant="primary"
                family="primary"
                weight="medium"
              >
                Recent transaction
              </ThemedText>
              <Pressable onPress={handleViewAllTransactions}>
                <Text className="text-b2 font-primary-medium text-primary-500 dark:text-primary-400">
                  See more
                </Text>
              </Pressable>
            </View>

            {/* Transactions List */}
            <View className=" rounded-[12px] py-2">
              {
                <FlatList
                  data={transactions}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TransactionItem transaction={item} />
                  )}
                  scrollEnabled={false}
                  ListEmptyComponent={() => (
                    isLoading ? (
                      <View>
                        {[1, 2, 3].map((i) => (
                          <TransactionSkeleton key={i} />
                        ))}
                      </View>
                    ) : (
                      <View className="py-4 flex-col items-center justify-center bg-[#FFFFFF] dark:bg-[#111111] flex-1 rounded-[12px]">
                        {
                          <View className="">
                            {isDark ? <img.noTransDark width={40} height={40} /> : <img.noTransLight width={40} height={40} />}
                          </View>
                        }
                        <ThemedText
                          className="text-center  py-[20px] text-b2"
                          variant="secondary"
                          family="primary"
                          weight="medium"
                        >
                          No transactions found.
                        </ThemedText>
                      </View>
                    )
                  )}
                  showsVerticalScrollIndicator={false}
                />
              }
            </View>
          </View>
        </ScrollView>
      </ThemedView>
      <PickTypeModal
        visible={giftCheckModalVisible}
        setVisible={setGiftCheckModalVisible}
        pickTyp={pickType}
        onDepositPress={() => {
          setGiftCheckModalVisible(false);
          router.push(paths.deposit as any)
        }}
      />
    </>
  );
};

export default Home;
