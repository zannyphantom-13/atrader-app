import { TabIcon } from "@/components/customs/customTab";
import { ThemedText } from "@/components/theme/themeText";
import { AVATARS, getAvatarById, icons } from "@/constant/icon";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useChatList } from "@/hooks/useChatList";
import { useAppSelector } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import { paths, ScreenPathsNames } from "@/utils/paths";
import { Tabs, useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import React from "react";
import { Image, Platform, Pressable, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabsLayout = () => {
  const { isDark } = useTheme();
  const { user, selectedAvatarId } = useAppSelector((state) => state.auth);
  const insets = useSafeAreaInsets();
  const { user: userInfo } = user || {};
  const userId = userInfo?.email || userInfo?.id || "";
  const { totalUnread, unreadConversationsCount } = useChatList(userId);
  const router = useRouter();
  const NotificationIcon = icons.notification;
  const NotificationLight = icons.notificationLight;
  const Headphone = icons.headphone;
  const HeadphoneLight = icons.headphoneLight;

  const RankL = img.rankLight;
  const RankD = img.rankDark;

  const selectedAvatar = selectedAvatarId
    ? getAvatarById(selectedAvatarId)
    : AVATARS[9];


  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colorThemes[app_config.theme][500],
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: isDark ? "#0C0C0C" : "#ffffff",
          borderTopWidth: 0,
          // borderTopColor: isDark ? "#232323" : "#EFEFEF",
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 80 : 80 + insets.bottom,
          // paddingBottom: Platform.OS === "ios" ? 0: insets.bottom,
          paddingInline: 10,
        },
        tabBarLabelStyle: {
          fontFamily: "MonaSans",
          fontSize: 12,
          fontWeight: "600",
          paddingTop: 4,
        },
      }}
    // tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name={"index"}
        options={{
          title: "Home",
          headerShown: true,
          headerTitle: "", // Alternative to title
          headerTitleAlign: "center", // "left" | "center"
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: "#000",
          },
          headerStyle: {
            backgroundColor: isDark ? "#0C0C0C" : "#FCFCFC",
            elevation: 0, // Android shadow
            shadowOpacity: 0,
            height: Platform.OS === "ios" ? 120 : 120,
          },

          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tabName="index" />
          ),

          // HEADER BUTTONS
          headerLeft: () => (
            <>

              <View className="flex-row items-center pl-[24px] gap-3">
                <Pressable
                  onPress={() => {
                    router.push(paths.setting.accountInformation);
                  }}
                  style={{}}
                  className="flex-row items-center gap-3"
                >
                  <View className="relative">
                    {selectedAvatar ? (
                      selectedAvatar.type === "svg" ? (
                        <selectedAvatar.image
                          width={40}
                          height={40}
                          className="w-10 h-10 bg-[#BFDBFE] rounded-full"
                        />
                      ) : (
                        <Image
                          source={selectedAvatar.image}
                          style={{ width: 40, height: 40 }}
                          resizeMode="cover"
                          className="w-10 h-10 bg-[#BFDBFE] rounded-full"
                        />
                      )
                    ) : (
                      <View className="w-10 h-10 bg-light-150 dark:bg-dark-700 items-center justify-center rounded-full overflow-hidden">
                        <Image
                          source={isDark ? img.logoDarkPng : img.logolightPng}
                          style={{ width: 30, height: 15 }}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                    {userInfo?.verify_account === 1 && (
                      <View className="absolute bottom-0 right-0 bg-white rounded-full border border-white">
                        <icons.tick width={12} height={12} />
                      </View>
                    )}
                  </View>
                  <View>
                    <ThemedText
                      family="secondary"
                      weight="regular"
                      className="text-b2 pt-1 text-text-primary-light dark:text-text-secondary-dark"
                    >
                      Welcome back
                    </ThemedText>
                    <ThemedText
                      family="primary"
                      weight="bold"
                      className="text-base capitalize "
                    >
                      {userInfo?.username || `${app_config?.name} fam`}
                    </ThemedText>
                  </View>
                </Pressable>
              </View>
            </>
          ),

          headerRight: () => (
            <>
              <View className="flex-row items-center gap-3 pr-[24px]">
                {/*  toggle for dark/light mode */}
                <Pressable
                  onPress={() => {
                    router.push(paths.rank);
                  }}
                  style={{
                    padding: 10,
                    borderRadius: 60,
                    backgroundColor: isDark ? "#111111" : "#ffffff",
                  }}
                >
                  {/* <BlurView
                intensity={30}
                tint={isDark ? "dark" : "light"}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 12,
                }}
              /> */}
                  {isDark ? (
                    <RankL width={24} height={24} />
                  ) : (
                    <RankD width={24} height={24} />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => router.push(paths.notification)}
                  style={{
                    padding: 10,
                    borderRadius: 60,
                    backgroundColor: isDark ? "#111111" : "#ffffff",
                  }}
                >
                  {/* {isDark ? (
                    <NotificationIcon width={24} height={24} />
                  ) : (
                    <NotificationLight width={24} height={24} />
                  )} */}
                  <Bell
                    width={24}
                    height={24}
                    color={isDark ? "#fff" : "#000"}
                  />
                </Pressable>
              </View>
            </>
          ),
        }}
      />

      <Tabs.Screen
        name="calculator"
        options={{
          title: `${ScreenPathsNames.calculator.name.charAt(0).toUpperCase() + ScreenPathsNames.calculator.name.slice(1)}`,
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tabName="calculator" />
          ),
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          headerShown: true,
          headerTitleAlign: "left",
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: "700",
            fontFamily: "MonaSans",
            color: isDark ? "#ffffff" : "#060606",
          },
          headerStyle: {
            backgroundColor: isDark ? "#0C0C0C" : "#FCFCFC",
            elevation: 0, // Android shadow
            shadowOpacity: 0,
            height: Platform.OS === "ios" ? 120 : 120,
          },

          headerRight: () => (
            <Pressable
              onPress={() => router.push(paths.setting.support)}
              className="pr-4"
            >
              {!isDark ? (
                <img.headPhoneLight width={38} height={38} />
              ) : (
                <img.headPhoneDark width={38} height={38} />
              )}
            </Pressable>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tabName="wallet" />
          ),
        }}
      />

      <Tabs.Screen
        name="message"
        options={{
          title: "Message",
          headerShown: false,
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: "700",
            fontFamily: "MonaSans",
            color: isDark ? "#ffffff" : "#060606",
          },
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tabName="message" />
          ),
          tabBarBadge:
            unreadConversationsCount > 0
              ? unreadConversationsCount > 99
                ? "99+"
                : unreadConversationsCount
              : undefined,
          tabBarBadgeStyle: {
            backgroundColor: isDark ? "#2BD14F" : "#1E9E3A",
            color: isDark ? "#04210D" : "#FFFFFF",
            fontSize: 10,
            fontWeight: "700",
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            borderWidth: 1.5,
            borderColor: isDark ? "#0C0C0C" : "#FFFFFF",
            lineHeight: 14,
          },
        }}

      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tabName="setting" />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
