import { ThemedView } from "@/components/theme/themeView";
import { useTheme } from "@/context/ThemeProvider";
import { Image } from "react-native";

export default function SplashScreenAt() {
  const { isDark } = useTheme();

  const now = isDark
    ? require("@/assets/images/splash_light_logo.png")
    : require("@/assets/images/splash_dark_logo.png");

  return (
    <ThemedView className="flex-1 items-center justify-center ">
      <Image
        source={now}
        className="w-[100px] h-[100px]"
        resizeMode="contain"
        alt="Atex"
      />
    </ThemedView>
  );
}
