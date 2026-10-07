import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { img } from "@/constant/image";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import { paths } from "@/utils/paths";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

const Kycsuccess = () => {
  const router = useRouter();
  const isUpgradedToTier2 = true; // This would typically come from user data or props
  return (
    <ThemedView className="flex-1 px-6 ">
      <View className="justify-center items-center mt-20">
        <img.hurray width={80} height={80} />
      </View>

      <ThemedText className="text-2xl text-center font-bold mt-10">
        Congratulations!
      </ThemedText>
      <ThemedText className="text-center text-gray-600 my-6">
        Your account has been Verified, you’ll enjoying a daily transaction
        limit of verified ₦5,000,000.
      </ThemedText>

      {!isUpgradedToTier2 && (
        <ThemedText className="text-center text-gray-600 my-6">
          Your account has been upgraded to Tier 2, enjoying a daily transaction
          limit of verified ₦5,000,000.
        </ThemedText>
      )}

      <LinearGradient
        colors={[colorThemes[app_config.theme][500], colorThemes[app_config.theme][500], "#B4FFA8", colorThemes[app_config.theme][500], colorThemes[app_config.theme][500]]}
        start={{ x: 0.3, y: 0.2 }}
        end={{ x: 0.7, y: 0.4 }}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        className="rounded-2xl items-center "
        style={{
          borderRadius: 30,
          marginTop: 10,
          marginBottom: 10,
        }}
      >
        <Pressable
          onPress={() => router.replace(paths.tabs.home)}
          className="rounded-2xl py-3 items-center"
        >
          <ThemedText className="text-white font-bold text-lg">
            Back to Dashboard
          </ThemedText>
        </Pressable>
      </LinearGradient>
    </ThemedView>
  );
};

export default Kycsuccess;
