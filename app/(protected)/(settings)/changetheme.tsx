import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { CustomSwitch } from "@/components/ui/customSwitch";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import { Sun } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

import { SettingsHeader } from "@/components/customs/settingsHeader";

const ChangeTheme = () => {
  const { colorMode, isDark, setColorMode } = useTheme();

  const handleSelect = async (mode: "light" | "dark" | "system") => {
    await setColorMode(mode);
  };

  const themeColor =
    colorThemes[app_config.theme as keyof typeof colorThemes][500];
  const trackColor =
    colorThemes[app_config.theme as keyof typeof colorThemes][100];

  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Theme Settings" />
      {/* <ThemedText
        family="primary"
        weight="bold"
        className="text-h7 px-[24px] my-4"
      >
        Theme Settings
      </ThemedText> */}

      <ScrollView
        className="flex-1 pt-2 px-[24px]"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Dark Mode */}
        <Pressable
          onPress={() => handleSelect("dark")}
          className="flex-row items-center justify-between  mb-[12px] bg-[#FFFFFF] dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] py-[6px]  px-[8px]"
        >
          <View className="flex-row items-center gap-3">
            {isDark ? (
              <img.notificationDark width={46} height={46} />
            ) : (
              <img.notificationLight width={46} height={46} />
            )}
            <ThemedText family="primary" weight="medium" className="text-b1">
              Dark Mode
            </ThemedText>
          </View>
          <CustomSwitch
            value={colorMode === "dark"}
            onValueChange={() => handleSelect("dark")}
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

        {/* Light Mode */}
        <Pressable
          onPress={() => handleSelect("light")}
          className="flex-row items-center justify-between  mb-[12px] bg-[#FFFFFF] dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] py-[6px]  px-[8px]"
        >
          <View className="flex-row items-center gap-3">
            {/* <icons.sun width={24} height={24} /> */}

            <View
              className="bg-[#F5F5F5] dark:bg-[#0C0C0C] rounded-[10px] p-[8px]"
            >
              {isDark ? (
                <Sun width={24} height={24} color={colorThemes[app_config.theme][500]} />
              ) : (
                <Sun width={24} height={24} color="black" />
              )}
            </View>
            <ThemedText family="primary" weight="medium" className="text-b1">
              Light Mode
            </ThemedText>
          </View>
          <CustomSwitch
            value={colorMode === "light"}
            onValueChange={() => handleSelect("light")}
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

        {/* System Default */}
        <Pressable
          onPress={() => handleSelect("system")}
          className="flex-row items-center justify-between  mb-[8px] bg-[#FFFFFF] dark:bg-[#111111] border-[1px] border-[#EFEFEF] dark:border-[#232323] rounded-[20px] py-[8px]  px-[8px]"
        >
          <View className="flex-row items-center  gap-3">
            <View className="bg-[#F5F5F5] dark:bg-[#0C0C0C] rounded-[10px] p-[8px]">
              {isDark ? (
                <ThemedText family="primary" weight="medium" className="text-b1">
                  <img.settingActive width={24} height={24} />
                </ThemedText>
              ) : (
                <img.settingActive width={24} height={24} color="black" />
              )}
            </View>
            <ThemedText family="primary" weight="medium" className="text-b1">
              System Default
            </ThemedText>
          </View>
          <CustomSwitch
            value={colorMode === "system"}
            onValueChange={() => handleSelect("system")}
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
      </ScrollView>
    </ThemedView>
  );
};

export default ChangeTheme;
