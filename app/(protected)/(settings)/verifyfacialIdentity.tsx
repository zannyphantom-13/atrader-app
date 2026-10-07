import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import { paths } from "@/utils/paths";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

const VerifyFaceIdentification = () => {
  const router = useRouter();
  const { isDark } = useTheme();

  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Face Verification" />
      <View className="flex-1 px-6">
        <View className="flex-row justify-between items-center mt-4">
          <ThemedText
            variant="secondary"
            className="text-[15px] font-regular ">We need to take a scan of your face to verify you’re a real person.
          </ThemedText>
          {/* <ThemedText className="text-sm font-regular mt-2">1/2</ThemedText> */}
        </View>
        {/* <ThemedText className="text-sm font-regular mt-2">
          We need to take a scan of your face to verify you’re a real person.
        </ThemedText> */}

        <ScrollView showsVerticalScrollIndicator={false} className="mt-10  ">
          <View className="items-center mt-5 mb-6">
            {isDark ? (
              <img.verifyDark width={150} height={150} />
            ) : (
              <img.verifyLight width={150} height={150} />
            )}
          </View>

          <View className="bg-light-150 dark:bg-black border-[#F2F2F2] border-[1px] dark:border-[#232323] p-4 rounded-[20px]">
            <ThemedText className="text-gray-700 text-sm font-medium mb-3">
              Instructions to follow
            </ThemedText>

            <View className="space-y-8">
              {/* Instruction 1 */}
              <View className="flex-row pb-2 items-start">
                <View className="w-5 h-5 rounded-full bg-primary-500 items-center justify-center mr-3 mt-0.5">
                  <ThemedText className="text-white text-xs font-bold">
                    !
                  </ThemedText>
                </View>
                <ThemedText className="flex-1 text-gray-800 text-sm leading-5">
                  Stay where your face is bright and not dark.
                </ThemedText>
              </View>

              {/* Instruction 2 */}
              <View className="flex-row pb-2 items-start">
                <View className="w-5 h-5 rounded-full bg-primary-500 items-center justify-center mr-3 mt-0.5">
                  <ThemedText className="text-white text-xs font-bold">
                    !
                  </ThemedText>
                </View>
                <ThemedText className="flex-1 text-gray-800 text-sm leading-5">
                  Put the phone at the same level as your face.
                </ThemedText>
              </View>

              {/* Instruction 3 */}
              <View className="flex-row items-start">
                <View className="w-5 h-5 rounded-full bg-primary-500 items-center justify-center mr-3 mt-0.5">
                  <ThemedText className="text-white text-xs font-bold">
                    !
                  </ThemedText>
                </View>
                <ThemedText className="flex-1 text-gray-800 text-sm leading-5">
                  Put your face inside the circle/square on screen.
                </ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="mb-8">
          <LinearGradient
            colors={[colorThemes[app_config.theme][500], colorThemes[app_config.theme][500], "#28A712", colorThemes[app_config.theme][500], colorThemes[app_config.theme][500]]}
            start={{ x: 0.3, y: 0.2 }}
            end={{ x: 0.7, y: 0.4 }}
            locations={[0, 0.2, 0.5, 0.8, 1]}
            className="rounded-2xl items-center"
            style={{
              borderRadius: 30,
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            <Pressable
              onPress={() => router.push(paths.setting.cameraScanner)}
              className="rounded-2xl py-3 items-center"
            >
              <ThemedText className="text-white font-bold text-lg">
                Get Started
              </ThemedText>
            </Pressable>
          </LinearGradient>
          <ThemedText className="text-center text-sm font-regular mb-6">
            {app_config.name_v1} prioritize the security of your data
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
};

export default VerifyFaceIdentification;
