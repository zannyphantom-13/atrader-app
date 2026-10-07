import { AuthProgress } from "@/components/auth-header";

import { useTheme } from "@/context/ThemeProvider";
import { useAppSelector } from "@/redux/store";
import { darkThemeVariations, lightThemeVariations } from "@/styles/theme";
import { Stack, useRouter } from "expo-router";
import { ArrowLeftIcon } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, View } from "react-native";


const AuthStack = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const { isOnboardingCompleted, isAuth, hasAccount, isLogged } =
    useAppSelector((s) => s.session);

  const shouldCreateAccount = !!(
    !isAuth &&
    isOnboardingCompleted &&
    isLogged === null &&
    !hasAccount
  );


  const isLoggedInBefore = !!(
    hasAccount &&
    !isAuth
  );
  const isNotLoggedIn = !!(
    !isAuth &&
    isOnboardingCompleted &&
    (isLogged === null || !hasAccount)
  );
  const handlePostLoginRedirect = (redirectUrl?: string) => {
    router.replace((redirectUrl || "/(protected)") as any);
  };


  const handleLeftPress = (showProgress: boolean = true, step: number = 2) => {
    return (
      <View className="flex-row w-full justify-between items-center">
        <Pressable
          onPress={() => router.back()}
          style={{
            marginLeft: Platform.OS === "ios" ? 0 : -8,
            padding: 8,
          }}
        >
          <ArrowLeftIcon size={24} color={isDark ? "#ffffff" : "#000000"} />
        </Pressable>
        {showProgress && <AuthProgress currentStep={step} />}
      </View>
    );
  };

  // const { isUpdateAvailable, isUpdateReady, isDismissed } = useUpdatesContext();
  // const showBanner = (isUpdateAvailable || isUpdateReady) && !isDismissed;

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0C0C0C" : "#ffffff" }}>
      {/* {showBanner && <UpdateBanner />} */}
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: isDark
              ? darkThemeVariations[900]
              : lightThemeVariations[50],
          },
          headerTintColor: isDark ? "#ffffff" : "#000000",
          headerTitleAlign: "left",
          headerTitleStyle: {
            fontWeight: "bold",
            fontFamily: "",
            fontSize: 20,
          },
          headerShadowVisible: false,
          animation: "slide_from_right",
          animationDuration: Platform.OS === "ios" ? 350 : 300,
          gestureEnabled: true,
        }}
      >
        {/* <Stack */}
        <Stack.Protected guard={isLoggedInBefore}>
          <Stack.Screen
            name="auth/loginwithBiometrics"
            options={{
              headerShown: false,
              title: "",
            }}
          />
        </Stack.Protected>
        {/* login screen */}
        <Stack.Protected guard={isNotLoggedIn && !isLoggedInBefore}>
          <Stack.Screen
            name="auth/login"
            options={{
              headerShown: false,
              title: "",
            }}
          />
        </Stack.Protected>
        {/* REGISTER screen */}
        <Stack.Protected guard={shouldCreateAccount}>
          <Stack.Screen
            name="auth/register"
            options={{
              headerShown: false,
              title: "",
            }}
          />
        </Stack.Protected>
        {/* FORGOT_PASSWORD screen */}
        <Stack.Screen
          name="auth/forgot-password"
          options={{
            headerShown: true,
            title: "",
            headerBackTitle: "",
            headerShadowVisible: false,
            headerLeft: () => handleLeftPress(false),
          }}
        />
        {/* RESET_PASSWORD screen */}
        <Stack.Screen
          name="auth/reset-password"
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,
            headerTintColor: isDark ? "#ffffff" : "#000000",
            headerLeft: () => handleLeftPress(false),
            headerTitleAlign: "left",
            headerTitleStyle: {
              fontWeight: "bold",
              fontFamily: "",
              fontSize: 20,
            },
          }}
        />
        {/* CREATE_PIN screen */}
        <Stack.Screen
          name="auth/create-pin"
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,
            headerLeft: () => handleLeftPress(true, 2),
          }}
        />
        {/* VERIFY_PIN screen */}
        <Stack.Screen
          name="auth/verify-create-pin"
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,
            headerLeft: () => handleLeftPress(true, 3),
          }}
        />
        {/* CONFIRM_PIN screen */}
        <Stack.Screen
          name={"auth/confirm-pin"}
          options={({ route }: any) => ({
            headerShown: true,
            title: "",
            headerShadowVisible: false,
            headerLeft: () => {
              const isFromReset = route?.params?.from === "reset";
              return handleLeftPress(!isFromReset, 1);
            },
          })}
        />
        {/* Email Phone screen */}
      </Stack>
    </View>
  );
};

export default AuthStack;
