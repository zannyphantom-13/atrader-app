import { icons } from "@/constant/icon";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { paths, ScreenPathsNames } from "@/utils/paths";
import { Stack, useRouter } from "expo-router";
import { ArrowLeftIcon } from "lucide-react-native";
import React from "react";
import { Platform, Pressable } from "react-native";

export const FeaturesStack = () => {
  const router = useRouter();
  const { isDark } = useTheme();

  const handleLeftPress = () => {
    return (
      <Pressable
        onPress={() => router.back()}
        style={{
          marginLeft: Platform.OS === "ios" ? -4 : -8,
          padding: 8,
        }}
      >
        <ArrowLeftIcon size={24} color={isDark ? "#ffffff" : "#000000"} />
      </Pressable>
    );
  };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "default",
        animationDuration: Platform.OS === "ios" ? 350 : 300,
        gestureEnabled: true,
        animationTypeForReplace: "push" as const,
        gestureDirection: "horizontal" as const,
        contentStyle: {
          backgroundColor: isDark ? "#060606" : "#ffffff",
        },
      }}
    >
      <Stack.Screen
        name="more"
        options={{
          title: `${ScreenPathsNames.more.name}`,
          headerTitle: `${ScreenPathsNames.more.name}`,

          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
          // headerRight: () => (
          //   <Pressable onPress={() => router.push(ScreenPathsNames.settings.route)}>
          //     <Ionicons
          //       name="settings"
          //       size={24}
          //       color={isDark ? '#ffffff' : '#000000'}
          //     />
          //   </Pressable>
          // ),
        }}
      />

      {/*
       Bills  sections 
      */}

      {/* Airtime */}
      <Stack.Screen
        name="bills/airtime"
        options={{
          title: "Buy Airtime",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
        }}
      />

      {/* Data */}
      <Stack.Screen
        name="bills/data"
        options={{
          title: "Buy Data",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
        }}
      />

      {/* Cable TV */}
      <Stack.Screen
        name="bills/cable"
        options={{
          title: "Cable subcription",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <>
              <Pressable
                onPress={() => router.replace(paths.bills.cableData)}
                style={{
                  marginLeft: Platform.OS === "ios" ? -4 : -8,
                  padding: 8,
                }}
              >
                <ArrowLeftIcon
                  size={24}
                  color={isDark ? "#ffffff" : "#000000"}
                />
              </Pressable>
            </>
          ),
        }}
      />
      {/* ElectricityData */}
      <Stack.Screen
        name="bills/cabledata"
        options={{
          title: "Cable subcription",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
        }}
      />

      <Stack.Screen
        name="bills/electricitydata"
        options={{
          title: "Electicity",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
        }}
      />



      {/* Electricity */}
      <Stack.Screen
        name="bills/electricity"
        options={{
          title: "Electricity",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <>
              <Pressable
                onPress={() => router.replace(paths.bills.electricityData)}
                style={{
                  marginLeft: Platform.OS === "ios" ? -4 : -8,
                  padding: 8,
                }}
              >
                <ArrowLeftIcon
                  size={24}
                  color={isDark ? "#ffffff" : "#000000"}
                />
              </Pressable>
            </>
          ),
        }}
      />

      {/* Electricity */}
      <Stack.Screen
        name="bills/betting"
        options={{
          title: "Betting",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
        }}
      />

      {/* buy gift cards */}

      <Stack.Screen
        name="giftcards/buyGiftCards"
        options={{
          title: "Buy Gift Cards",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
        }}
      />

      {/* sell gift cards */}
      <Stack.Screen
        name="giftcards/sellGiftCards"
        options={{
          title: "Gift card",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
        }}
      />

      <Stack.Screen
        name="giftcards/sellreceipt"
        options={{
          title: "",
          headerShown: true,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
          headerRight: () => (
            <Pressable
              onPress={() => router.push(paths.setting.support)}
              className="pr-4"
            >
              {isDark ? (
                <icons.headphoneLight width={24} height={24} />
              ) : (
                <icons.headphone width={24} height={24} />
              )}
            </Pressable>
          ),
        }}
      />

      <Stack.Screen
        name="bills/allBillReceipt"
        options={{
          title: "",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          // headerLeft: () => handleLeftPress(),
          // headerRight: () => (
          //   <Pressable
          //     onPress={() => router.push(paths.setting.support)}
          //     className="pr-4"
          //   >
          //     {isDark ? (
          //       <icons.headphoneLight width={24} height={24} />
          //     ) : (
          //       <icons.headphone width={24} height={24} />
          //     )}
          //   </Pressable>
          // ),
        }}
      />

      <Stack.Screen
        name="giftcards/sellgiftcardstatus"
        options={{
          title: "",
          headerShown: true,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
          headerRight: () => (
            <Pressable
              onPress={() => router.replace(paths.setting.support)}
              className="pr-4"
            >
              {isDark ? (
                <icons.headphoneLight width={24} height={24} />
              ) : (
                <icons.headphone width={24} height={24} />
              )}
            </Pressable>
          ),
        }}
      />

      <Stack.Screen
        name="giftcards/sellGiftCardsData"
        options={{
          title: "Sell Gift Card",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
        }}
      />

      <Stack.Screen
        name="giftcards/buyGiftcardsData"
        options={{
          title: "Buy Gift Card",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
        }}
      />

      <Stack.Screen
        name="transactionhistory"
        options={{
          title: "Transaction history",
          headerShown: false,
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerTintColor: isDark ? "#ffffff" : "#000000",
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: "700",
            fontFamily: "MonaSans-Bold",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
          // headerRight: () => (
          //   <Pressable
          //     onPress={() => router.push(ScreenPathsNames.settings.route)}
          //     style={{ marginRight: 10 }}
          //     className="bg-light-150 dark:bg-dark-700 p-2 rounded-full"
          //   >
          //     <ListFilter
          //       size={24}
          //       color={isDark ? '#ffffff' : '#000000'}
          //     />
          //   </Pressable>
          // ),
        }}
      />

      <Stack.Screen
        name="detailtransaction"
        options={{
          title: "",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#000000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#111111" : "#ffffff",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
          headerRight: () => (
            <Pressable
              onPress={() => router.replace(paths.setting.support)}
              className="pr-4 rounded-[20px]"
            >
              {isDark ? (
                <img.headPhoneDark width={46} height={46} />
              ) : (
                <img.headPhoneLight width={46} height={46} />
              )}
            </Pressable>
          ),
        }}
      />

      <Stack.Screen
        name="withdrawal"
        options={{
          title: "Withdraw",
          headerShown: false,
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerTintColor: isDark ? "#ffffff" : "#000000",
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: "700",
            fontFamily: "MonaSans-Bold",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
        }}
      />

      <Stack.Screen
        name="withdrawalcontinue"
        options={{
          title: "Withdraw",
          headerShown: false,
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerTintColor: isDark ? "#ffffff" : "#000000",
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: "700",
            fontFamily: "MonaSans-Bold",
          },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
        }}
      />

      <Stack.Screen
        name="deposit"
        options={{
          title: "Deposit",
          headerTitleAlign: "center",
          headerShown: false,
          headerStyle: {
            backgroundColor: isDark ? "#060606" : "#ffffff",
          },
          headerTintColor: isDark ? "#ffffff" : "#000000",
          // headerTitleStyle: {
          //   fontSize: 16,
          //   fontWeight: "700",
          //   fontFamily: "MonaSans-Bold",
          // },
          headerShadowVisible: false,
          headerLeft: () => handleLeftPress(),
        }}
      />
      <Stack.Screen
        name="crypto/sellcrypto"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="crypto/sellCryptoData"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="trade-chat"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
};

export default FeaturesStack;
