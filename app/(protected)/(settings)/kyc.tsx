import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { img } from "@/constant/image";
import { useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ChevronRight, ShieldUser } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, View, Image } from "react-native";

export default function KYCLevelScreen() {
  const isVerifiedTrader = true;
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user;
  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="KYC Level" />
      <ScrollView
        className=""
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, marginHorizontal: 20 }}
      >
        {/* Unverified Account Card */}
        {userInfo?.verify_account === 0 && (
          <>
            <LinearGradient
              colors={["#28A712", "#0E5C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="!p-6 !mt-3 "
              style={{
                borderRadius: 30,
                padding: 20,
                marginTop: 12,
                position: "relative",
              }}
            >
              <View className="flex-row justify-between mb-5">
                <View>
                  <View className="flex-row items-center mb-4">
                    <ThemedText className="text-xl font-bold text-white mr-2">
                      Account
                    </ThemedText>
                    <View className="bg-white px-2.5 py-1 rounded-[10px]">
                      <ThemedText className="!text-primary-500 text-xs font-semibold">
                        Unverified
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText className="text-white font-regular text-sm mb-1">
                    Daily Withdrawal
                  </ThemedText>
                  <ThemedText className="text-white text-2xl font-bold">
                    ₦5,000,000
                  </ThemedText>
                </View>
                <View className="items-center">
                  <Image source={img.unverified} style={{ width: 99, height: 85 }} resizeMode="contain" />
                </View>
              </View>

              {/* <View className="border-b border-dashed border-white mb-4" /> */}

              <View
                style={{
                  borderTopWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: 'rgba(255,255,255,0.6)',
                  width: '100%'
                }}
              />
              <View className="flex-row justify-between py-1">
                <ThemedText className="text-white font-medium text-[15px]">
                  Sell Gift card
                </ThemedText>
                <ThemedText className="text-white  text-[15px]">
                  Unlimited
                </ThemedText>
              </View>

              <View className="flex-row justify-between py-3">
                <ThemedText className="text-white font-medium text-[15px]">
                  Sell Crypto
                </ThemedText>
                <ThemedText className="text-white text-[15px]">
                  Unlimited
                </ThemedText>
              </View>
              <View
                style={{
                  borderTopWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: 'rgba(255,255,255,0.6)',
                  width: '100%'
                }}
              />

              <View className="items-center absolute bottom-20 z-40 left-10">
                <View className="bg-white px-2 py-1 rounded-xl">
                  <ThemedText className="!text-primary-500 !text-sm font-semibold">
                    To upgrade
                  </ThemedText>
                </View>
              </View>

              <Pressable className="bg-[#FFFFFF1F] z-10 flex-row items-center justify-between p-5 rounded-[20px] mt-8">
                <View className="flex-row gap-1 items-center">
                  <ShieldUser color={"#ffffff"} />
                  <ThemedText className="text-white text-[15px] !font-bold">
                    Verify with NIN
                  </ThemedText>
                </View>
                <ChevronRight color={"#ffffff"} />
              </Pressable>
            </LinearGradient>

            {/* Verified Trader Section */}

            <View className="bg-light-150 dark:bg-[#111111]  rounded-[30px] p-5 mt-6">
              <View className="flex-row justify-between mb-5" >
                <View>
                  <ThemedText className="text-[18px] font-bold text-black mb-3">
                    Verified Trader
                  </ThemedText>
                  <ThemedText className="text-gray-600 text-xs mb-1">
                    Daily Withdrawal
                  </ThemedText>
                  <ThemedText className="text-black text-xl font-bold mb-2">
                    ₦10,000,000
                  </ThemedText>
                  <ThemedText className="text-gray-600 text-[11px]">
                    NIN required to be enabled
                  </ThemedText>
                </View>
                <View className="items-center">
                  <Image source={img.verified} style={{ width: 99, height: 85 }} resizeMode="contain" />
                </View>
              </View>

              <View className="flex-row justify-between py-2.5 border-t border-dashed border-[##D9D9D9] dark:border-[#4A4A4A]">
                <ThemedText className="text-gray-800 dark:text-gray-300 text-[15px]">
                  Sell Gift card
                </ThemedText>
                <ThemedText className="text-gray-800 dark:text-gray-300 text-[15px] capitalize">
                  unlimited
                </ThemedText>
              </View>

              <View className="flex-row justify-between  py-2.5">
                <ThemedText className="text-gray-800 dark:text-gray-300 text-[15px]">
                  Sell Crypto
                </ThemedText>
                <ThemedText className="text-gray-800 dark:text-gray-300 text-[15px] capitalize">
                  unlimited
                </ThemedText>
              </View>
            </View>
          </>
        )}

        {userInfo?.verify_account === 1 && (
          <LinearGradient
            colors={["#28A712", "#0E5C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="!p-6 !mt-3"
            style={{
              borderRadius: 18,
              padding: 20,
              marginTop: 12,
              position: "relative",
            }}
          >
            <View className="flex-row justify-between mb-5">
              <View>
                <View className="flex-row items-center mb-4">
                  <ThemedText className="text-2xl font-bold text-white mr-2">
                    Account
                  </ThemedText>
                  <View className="bg-white px-2 py-1 rounded-md">
                    <ThemedText className="!text-primary-500 text-SM font-semibold">
                      Verified
                    </ThemedText>
                  </View>
                </View>
                <ThemedText className="text-white font-regular text-sm mb-1">
                  Daily Withdrawal
                </ThemedText>
                <ThemedText className="text-white text-2xl font-bold">
                  ₦10,000,000
                </ThemedText>
              </View>
              <View className="items-center">
                <Image source={img.verified} style={{ width: 99, height: 85 }} resizeMode="contain" />
              </View>
            </View>

            <View
              style={{
                borderTopWidth: 2,
                borderStyle: 'dashed',
                borderColor: 'rgba(255,255,255,0.6)',
                width: '100%'
              }}
            />
            <View className="flex-row justify-between py-1">
              <ThemedText className="text-white font-medium text-[15px]">
                Sell Gift card
              </ThemedText>
              <ThemedText className="text-white  text-[15px] capitalize">
                unlimited
              </ThemedText>
            </View>

            <View className="flex-row justify-between py-3">
              <ThemedText className="text-white font-medium text-[15px]">
                Sell Crypto
              </ThemedText>
              <ThemedText className="text-white text-[15px] capitalize">
                unlimited
              </ThemedText>
            </View>
            <View
              style={{
                borderTopWidth: 2,
                borderStyle: 'dashed',
                borderColor: 'rgba(255,255,255,0.6)',
                width: '100%'
              }}
            />
          </LinearGradient>
        )}
      </ScrollView>
      {/* CTA Button */}
      {userInfo?.verify_account === 0 && (
        <>
          <Button
            onPress={() => {
              router.push(paths.setting.ninVerification);
              // Handle button press
            }}
            className="bg-[#2E236C]  mb-2 rounded-2xl items-center mx-5"
          >
            Become a Verified Trader
          </Button>

          <ThemedText
            variant="secondary"
            className="text-center dark:text-[#B5B5B5] text-[#B5B5B5] text-sm mb-12"
          >
            Become a verified user for Better withdrawal benefit.
          </ThemedText>
        </>
      )}
    </ThemedView>
  );
}
