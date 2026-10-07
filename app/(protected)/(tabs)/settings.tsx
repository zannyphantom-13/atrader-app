import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { CustomSwitch } from "@/components/ui/customSwitch";
import { img } from "@/constant/image";
import { useNotifications } from "@/context/NotificationsProvider";
import { useTheme } from "@/context/ThemeProvider";
import { useAuth } from "@/guards/guard";
import { setUser } from "@/redux/auth/auth_slice";
import { useToggleNotificationMutation } from "@/redux/settings/settings";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useRouter } from "expo-router";
import { ChevronRightIcon } from "lucide-react-native";
import React from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Settings = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const { handleAllLogout } = useAuth();
  // const [isEnabled, setIsEnabled] = React.useState(false);
  // const [isEnabledNotification, setIsEnabledNotification] =
  //   React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [toggleNotification, { isLoading: isToggleLoading }] =
    useToggleNotificationMutation();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);

  const { user: userInfo } = user || {};

  const { requestPermissions, expoPushToken, notificationEnabledStatus } =
    useNotifications();

  const isNotificationEnabled =
    notificationEnabledStatus === "granted" && userInfo?.notify_send === 1;

  const [localNotificationEnabled, setLocalNotificationEnabled] =
    React.useState(isNotificationEnabled);

  React.useEffect(() => {
    setLocalNotificationEnabled(isNotificationEnabled);
  }, [isNotificationEnabled]);

  const handleNotificationToggle = async (newValue: boolean) => {
    // Optimistically update UI
    setLocalNotificationEnabled(newValue);

    try {
      const atex = await TokenManager.getToken();

      // ALWAYS hit the API to sync with backend
      await toggleNotification({
        switch: newValue ? 1 : 0,
        token: atex || "",
      }).unwrap();

      // ALWAYS update Redux state with new notify_send status
      if (user && user.user) {
        dispatch(
          setUser({
            ...user,
            user: {
              ...user.user,
              notify_send: newValue ? 1 : 0,
            },
          }),
        );
      }

      if (newValue) {
        // If enabling, we must also ensure device permissions
        const granted = await requestPermissions();
        if (!granted) {
          // If permission denied, revert UI and backend
          setLocalNotificationEnabled(false);
          await toggleNotification({
            switch: 0,
            token: atex || "",
          }).unwrap();

          if (user && user.user) {
            dispatch(
              setUser({
                ...user,
                user: {
                  ...user.user,
                  notify_send: 0,
                },
              }),
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to toggle notification:", error);
      // Revert UI on network/API error
      setLocalNotificationEnabled(!newValue);
    }
  };

  // const toggleSwitch = () => {
  //   setIsEnabled((previousState) => !previousState);
  //   toggleColorMode();
  // };
  // const toggleNotificationSwitch = () =>
  //   setIsEnabledNotification((previousState) => !previousState);

  return (
    <ThemedView className="flex-1 ">
      <SafeAreaView
        className={`flex-1 ${Platform.OS === "ios" ? "pt-6" : "pt-4"} `}
        edges={Platform.OS === "android" ? ["top"] : ["top"]}
      >
        <ThemedText
          family="primary"
          weight="bold"
          className="text-h7 px-[24px] "
        >
          Settings
        </ThemedText>
        <ScrollView
          className="flex-1 px-[24px] "
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}

        >
          {/* Account Information */}
          <Pressable
            onPress={() => {
              router.push(paths.setting.accountInformation);
            }}
            className="flex-row items-center justify-between mt-5 mb-[8px] bg-[#FFFFFF] dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] py-[6px] px-[8px]"
          >
            <View className="flex-row items-center gap-3">
              {isDark ? (
                <img.profileDark width={46} height={46} />
              ) : (
                <img.profileLight width={46} height={46} />
              )}
              <ThemedText
                family="primary"
                weight="medium"
                className="text-b1"
              >
                Account Information
              </ThemedText>
            </View>
            <ChevronRightIcon
              width={24}
              height={24}
              color={isDark ? "white" : "black"}
            />
          </Pressable>

          {/* kyc secion */}
          <Pressable
            onPress={() => {
              router.push(paths.setting.kyc);
            }}
            className="flex-row items-center justify-between  mb-[8px] bg-[#FFFFFF] dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] py-[6px]  px-[8px]"
          >
            <View className="flex-row items-center gap-3">
              {isDark ? (
                <img.kycDark width={46} height={46} />
              ) : (
                <img.kycLight width={46} height={46} />
              )}
              <ThemedText
                family="primary"
                weight="medium"
                className="text-b1"
              >
                KYC level
              </ThemedText>
            </View>
            <View className="flex-row items-center gap-2">
              <ThemedText
                family="primary"
                weight="medium"
                className="text-b2 text-gray-500 dark:text-gray-400"
              >
                {userInfo?.verify_account === 0 ? "Un-verified" : "Verified"}
              </ThemedText>
              <ChevronRightIcon
                width={24}
                height={24}
                color={isDark ? "white" : "black"}
              />
            </View>
          </Pressable>

          {/* Change theme */}
          <Pressable
            onPress={() => {
              router.push(paths.setting.changetheme);
            }}
            className="flex-row items-center justify-between  mb-[8px] bg-[#FFFFFF] dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] py-[6px]  px-[8px]"
          >
            <View className="flex-row items-center gap-3">
              {isDark ? (
                <ThemedText
                  family="primary"
                  weight="medium"
                  className="text-b1"
                >
                  <img.themeDark width={46} height={46} />
                </ThemedText>
              ) : (
                <img.themeLight width={46} height={46} color="black" />
              )}
              <ThemedText
                family="primary"
                weight="medium"
                className="text-b1"
              >
                Theme Settings
              </ThemedText>
            </View>
            {/* <Switch
                value={isEnabled}
                onValueChange={toggleSwitch}
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
              /> */}
            <ChevronRightIcon
              width={24}
              height={24}
              color={isDark ? "white" : "black"}
            />
          </Pressable>

          {/* Security */}
          <Pressable
            onPress={() => {
              router.push(paths.setting.security);
            }}
            className="flex-row items-center justify-between  mb-[8px] bg-[#FFFFFF] dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] py-[6px]  px-[8px]"
          >
            <View className="flex-row items-center gap-3">
              {isDark ? (
                <img.securityDark width={46} height={46} />
              ) : (
                <img.securityLight width={46} height={46} />
              )}
              <ThemedText
                family="primary"
                weight="medium"
                className="text-b1"
              >
                Security
              </ThemedText>
            </View>
            <ChevronRightIcon
              width={24}
              height={24}
              color={isDark ? "white" : "black"}
            />
          </Pressable>

          {/* Notification Settings */}
          <Pressable
            // onPress={() => {
            //   // Handle navigation to notification settings
            // }}
            className="flex-row items-center justify-between  mb-[8px] bg-[#FFFFFF] dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] py-[6px]  px-[8px]"
          >
            <View className="flex-row items-center gap-3">
              {isDark ? (
                <img.notificationDark width={46} height={46} />
              ) : (
                <img.notificationLight width={46} height={46} />
              )}
              <ThemedText
                family="primary"
                weight="medium"
                className="text-b1"
              >
                Notification
              </ThemedText>
            </View>
            <CustomSwitch
              value={localNotificationEnabled}
              onValueChange={handleNotificationToggle}
              // disabled={isToggleLoading}
              trackWidth={40}
              trackHeight={22}
              thumbSize={14}
              activeTrackColor={
                colorThemes[app_config.theme][150]
              }
              inactiveTrackColor={
                isDark ? "#E7E7E7" : "#EFEFEF"
              }
              activeThumbColor={colorThemes[app_config.theme][500]}
              inactiveThumbColor={isDark ? "#B5B5B5" : "#7E7E7E"}
            />
          </Pressable>

          {/* payment bank  */}
          <Pressable
            onPress={() => {
              router.push(paths.setting.paymentbank);
            }}
            className="flex-row items-center justify-between  mb-[8px] bg-[#FFFFFF] dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] py-[6px]  px-[8px]"
          >
            <View className="flex-row items-center gap-3">
              {isDark ? (
                <img.paymentDark width={46} height={46} />
              ) : (
                <img.paymentLight width={46} height={46} />
              )}
              <ThemedText
                family="primary"
                weight="medium"
                className="text-b1"
              >
                Payment bank
              </ThemedText>
            </View>
            <ChevronRightIcon
              width={24}
              height={24}
              color={isDark ? "white" : "black"}
            />
          </Pressable>

          {/* referable friends */}
          <Pressable
            onPress={() => {
              router.push(paths.setting.referfriends);
            }}
            className="flex-row items-center justify-between  mb-[8px] bg-[#FFFFFF] dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] py-[6px]  px-[8px]"
          >
            <View className="flex-row items-center gap-3">
              {isDark ? (
                <img.referralDark width={46} height={46} />
              ) : (
                <img.referralLight width={46} height={46} />
              )}
              <ThemedText
                family="primary"
                weight="medium"
                className="text-b1"
              >
                Refer friends
              </ThemedText>
            </View>
            <ChevronRightIcon
              width={24}
              height={24}
              color={isDark ? "white" : "black"}
            />
          </Pressable>

          {/* rate at-exchnage */}
          <Pressable
            onPress={async () => {
              try {
                const nativeUrl = Platform.OS === "ios"
                  ? `itms-apps://itunes.apple.com/app/id${app_config.appleAppId}?action=write-review`
                  : `market://details?id=${app_config.androidPackageName}`;
                const webUrl = Platform.OS === "ios" ? app_config.appleReviewLink : app_config.playStoreReviewLink;

                try {
                  const canOpen = await Linking.canOpenURL(nativeUrl);
                  if (canOpen) {
                    await Linking.openURL(nativeUrl);
                  } else {
                    await Linking.openURL(webUrl);
                  }
                } catch {
                  await Linking.openURL(webUrl);
                }
              } catch (err) {
                console.warn("Failed to open review url:", err);
              }
            }}
            className="flex-row items-center justify-between  mb-[8px] bg-[#FFFFFF] dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] py-[6px]  px-[8px]"
          >
            <View className="flex-row items-center gap-3">
              {isDark ? (
                <img.rateDark width={46} height={46} />
              ) : (
                <img.rateLight width={46} height={46} />
              )}
              <ThemedText
                family="primary"
                weight="medium"
                className="text-b1"
              >
                Rate {app_config.name_v1}
              </ThemedText>
            </View>
            <ChevronRightIcon
              width={24}
              height={24}
              color={isDark ? "white" : "black"}
            />
          </Pressable>


          {/* contact support  */}
          <Pressable
            onPress={() => {
              router.push(paths.setting.support);
            }}
            className="flex-row items-center justify-between  mb-[8px] bg-[#FFFFFF] dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] py-[6px]  px-[8px]"
          >
            <View className="flex-row items-center gap-3">
              {isDark ? (
                <img.supportDark width={46} height={46} />
              ) : (
                <img.supportLight width={46} height={46} />
              )}
              <ThemedText
                family="primary"
                weight="medium"
                className="text-b1"
              >
                Contact Support
              </ThemedText>
            </View>
            <ChevronRightIcon
              width={24}
              height={24}
              color={isDark ? "white" : "black"}
            />
          </Pressable>

          {/* logout  */}
          <Pressable
            onPress={() => setShowLogoutModal(true)}
            className="flex-row items-center justify-between  mb-[8px] bg-[#FFFFFF] dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] py-[6px]  px-[8px]"
          >
            <View className="flex-row items-center gap-3">
              {isDark ? (
                <img.logoutDark width={46} height={46} />
              ) : (
                <img.logoutLight width={46} height={46} />
              )}
              <ThemedText
                family="primary"
                weight="medium"
                className="text-b1"
              >
                Logout
              </ThemedText>
            </View>
            <ChevronRightIcon
              width={24}
              height={24}
              color={'red'}
            />
          </Pressable>
        </ScrollView>
      </SafeAreaView>



      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View className="flex-1 bg-black/70 justify-center items-center">
          <View className="bg-white dark:bg-dark-700 p-6 rounded-xl items-center mx-4">
            <ThemedText
              family="primary"
              weight="bold"
              className="text-h6 mb-4 text-center"
            >
              Are you sure you want to logout?
            </ThemedText>
            <ThemedText
              family="primary"
              weight="regular"
              className="text-b2 mb-6 text-center"
            >
              You will need to enter your login details to access your account
              again.
            </ThemedText>
            <View className="flex-row gap-4">
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                className="flex-1 border border-border-light dark:border-border-dark rounded-lg p-3 items-center"
              >
                <ThemedText
                  family="primary"
                  weight="medium"
                  className="text-b2"
                >
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowLogoutModal(false);
                  handleAllLogout();
                }}
                className="flex-1 bg-red-500 rounded-lg p-3 items-center"
              >
                <ThemedText
                  family="primary"
                  weight="medium"
                  className="text-b2 text-white"
                >
                  Logout
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default Settings;

const styles = StyleSheet.create({});
