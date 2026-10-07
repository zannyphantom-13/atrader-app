import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { paths } from "@/utils/paths";
import { useRouter } from "expo-router";
import { ChevronRightIcon } from "lucide-react-native";
import React from "react";
import { Pressable, View } from "react-native";

const Security = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Security" />
      <View className="flex-1">

        <View className=" pt-4  px-[24px]">
          {/* change password */}
          <Pressable
            onPress={() => {
              router.push(paths.setting.changepassword);
            }}
            className="flex-row items-center justify-between mt-2 mb-3 bg-[#F9F9F9] dark:bg-[#111111] border border-[#EFEFEF] dark:border-[#232323] rounded-[20px] p-2"
          >
            <View className="flex-row items-center gap-3 ">
              <View className="bg-[#F9FFF8] dark:bg-[#0C0C0C] rounded-[12px] p-3">
                {isDark ? (
                  <img.passwordDark width={24} height={24} />
                ) : (
                  <img.passwordLight width={24} height={24} />
                )}
              </View>
              <ThemedText family="primary" weight="medium" className="text-b1">
                Change Password
              </ThemedText>
            </View>
            <ChevronRightIcon
              width={24}
              height={24}
              color={isDark ? "white" : "black"}
            />
          </Pressable>

          {/* change pin */}
          <Pressable
            onPress={() => {
              router.push(paths.setting.changepin);
            }}
            className="flex-row items-center justify-between mb-8 bg-[#F9F9F9] dark:bg-[#111111] border border-[#EFEFEF] dark:border-[#232323] rounded-[20px] p-2"
          >
            <View className="flex-row items-center gap-3">
              <View className="bg-[#F9FFF8] dark:bg-[#0C0C0C] rounded-[12px] p-3">

                {isDark ? (
                  <img.pinDark width={24} height={24} />
                ) : (
                  <img.pinLight width={24} height={24} />
                )}
              </View>
              <ThemedText family="primary" weight="medium" className="text-b1">
                Change PIN
              </ThemedText>

            </View>
            <ChevronRightIcon
              width={24}
              height={24}
              color={isDark ? "white" : "black"}
            />
          </Pressable>
        </View>

        {/* <View className="border my-3 border-border-light dark:border-border-dark" /> */}

        {/* DELETE LINK */}

        <Pressable
          onPress={() => {
            // router.push(paths.setting.verificationcode);
          }}
          className="px-[24px] mt-5 mb-8"
        >
          <ThemedText
            family="primary"
            weight="medium"
            className="text-b1 !text-[#E20010] text-center"
          >
            Delete Account
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
};

export default Security;
