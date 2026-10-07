import { useTheme } from "@/context/ThemeProvider";
import { useAppSelector } from "@/redux/store";
import { Ionicons } from "@expo/vector-icons";
import { ThemeProvider as NavThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { Platform, Pressable, View } from "react-native";

// root stack

export const RootStack = () => {
  const router = useRouter();
  const { isDark } = useTheme();

  const { isOnboardingCompleted, isAuth } = useAppSelector((s) => s.session);

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
          <Ionicons
            name="chevron-back"
            size={24}
            color={isDark ? "#ffffff" : "#000000"}
          />
        </Pressable>
      </View>
    );
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: "#0C0C0C",
    },
  };

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#ffffff",
    },
  };

  return (
    <NavThemeProvider value={isDark ? customDarkTheme : customLightTheme}>
      <Stack
        // initialRouteName={SCREENS.TABS.name}
        screenOptions={{
          headerShown: false,
          animation: "default",
          animationDuration: Platform.OS === "ios" ? 350 : 300,
          gestureEnabled: true,
          animationTypeForReplace: "push" as const,
          gestureDirection: "horizontal" as const,
          contentStyle: { backgroundColor: isDark ? "#0C0C0C" : "#ffffff" },
        }}
      >
        <Stack.Protected guard={isAuth}>
          <Stack.Screen
            name={"(protected)"}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>

        <Stack.Protected guard={!isAuth && !!isOnboardingCompleted}>
          <Stack.Screen
            name={"(auth)"}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>

        {/* onboarding */}
        <Stack.Protected guard={!isOnboardingCompleted}>
          <Stack.Screen
            name={"onboarding"}
            options={{
              headerShown: false,
              title: "Onboarding",
              headerTitleAlign: "center",
              headerTitleStyle: {
                fontSize: 16,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#000000",
              },
              headerShadowVisible: false,
              headerTintColor: isDark ? "#ffffff" : "#000000",
              headerStyle: {
                backgroundColor: isDark ? "#060606" : "#ffffff",
              },
              // headerLeft: () => handleLeftPress(),
            }}
          />
        </Stack.Protected>

        {/* not found */}
        <Stack.Screen
          name="+not-found"
          options={{
            title: "Oops!",
            headerShown: false,
          }}
        />
      </Stack>
    </NavThemeProvider>
  );
};
