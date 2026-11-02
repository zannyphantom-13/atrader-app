import { InAppNotificationBanner } from "@/components/customs/InAppNotificationBanner";
import { useTheme } from "@/context/ThemeProvider";
import { Stack, useRouter } from "expo-router";
import { ArrowLeftIcon } from "lucide-react-native";
import { Platform, Pressable, View } from "react-native";

const ProtectedLayout = () => {
  const router = useRouter();
  const { isDark } = useTheme();

  const handleLeftPress = () => {
    return (
      <View className="flex flex-row justify-between items-center">
        <Pressable
          onPress={() => router.back()}
          style={{
            marginLeft: Platform.OS === "ios" ? 0 : -8,
            padding: 8,
          }}
        >
          <ArrowLeftIcon size={24} color={isDark ? "#ffffff" : "#000000"} />
        </Pressable>
      </View>
    );
  };

  return (
    <>
      <Stack
        // initialRouteName={SCREENS.TABS.name}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right" as const,
          animationDuration: Platform.OS === "ios" ? 350 : 300,
          gestureEnabled: true,
          animationTypeForReplace: "push" as const,
          gestureDirection: "horizontal" as const,
          contentStyle: { backgroundColor: isDark ? "#0C0C0C" : "#ffffff" },
        }}
      >
        <Stack.Screen
          name={"(tabs)"}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name={"(features)"}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name={"(modals)"}
          options={{
            presentation: "modal" as const,
            animation: "slide_from_bottom" as const,
            animationDuration: Platform.OS === "ios" ? 400 : 300,
            gestureEnabled: true,
            gestureDirection: "vertical" as const,
            headerShown: false,
          }}
        />

        <Stack.Screen
          name={"(settings)"}
          options={{
            headerShown: false,
            animation: "slide_from_right" as const,
            animationDuration: Platform.OS === "ios" ? 350 : 300,
            gestureEnabled: true,
            animationTypeForReplace: "push" as const,
            gestureDirection: "horizontal" as const,
          }}
        />

        <Stack.Screen
          name={"notifications"}
          options={{
            headerShown: false,
            title: "Notifications",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontSize: 16,
              fontWeight: "700",
              color: isDark ? "#ffffff" : "#000000",
              fontFamily: "MonaSans-Bold",
            },
            headerShadowVisible: false,
            headerTintColor: isDark ? "#ffffff" : "#000000",
            headerStyle: {
              backgroundColor: isDark ? "#060606" : "#ffffff",
            },
            headerLeft: () => handleLeftPress(),
          }}
        />

        <Stack.Screen
          name={"withdrawalReceipt"}
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
          }}
        />
      </Stack>
      <InAppNotificationBanner />
    </>
  );
};

export default ProtectedLayout;
