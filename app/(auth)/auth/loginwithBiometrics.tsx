import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { AlertComponent } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ThemedLink } from "@/components/ui/customlink";
import { FormContainer, PasswordInput } from "@/components/ui/form-fields";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useAuth } from "@/guards/guard";
import { setZohoVisitor } from "@/lib/zoho-service";
import "@/lib/firebase";
import { signInWithCustomToken, getAuth } from "firebase/auth";

import {
  useLoginMutation,
  useLoginWithBiometricsMutation,
  useSendNotificationTokenMutation,
} from "@/redux/auth/auth_api";
import { registerForPushNotificationsAsync } from "@/context/NotificationsProvider";
import { showInAppNotification } from "@/components/customs/InAppNotificationBanner";
import { setUser, setUserEmail } from "@/redux/auth/auth_slice";
import {
  setIsBiometricEnabled,
  setLoginSuccess,
} from "@/redux/auth/session";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { Sentry } from "@/utils/sentry";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Fingerprint, ScanFace } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Image, Platform, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

// Define the login schema
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;



const LoginWithBiometrics = () => {
  const { isDark, theme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const [formData, setFormData] = React.useState<LoginFormData>({
    email: "",
    password: "",
  });

  const { handleAllLogout } = useAuth();

  const TheLogo = isDark ? img.atraderSplashDark : img.atraderSplashLight

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof LoginFormData, string>>
  >({});
  const { user } = useAppSelector((state) => state.auth);
  const { isBiometricEnabled } = useAppSelector((state) => state.session);
  const { user: userInfo } = user || {};

  const [login, { isLoading }] = useLoginMutation();
  const [loginWithBiometrics, { isLoading: biometricLoginLoading }] =
    useLoginWithBiometricsMutation();
  const [sendNotificationToken] = useSendNotificationTokenMutation();

  // Validate individual field
  const validateField = (field: keyof LoginFormData, value: string) => {
    try {
      const fieldSchema = loginSchema.shape[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
        // Clear error if validation passes
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues[0]?.message || "";
        setErrors((prev) => ({ ...prev, [field]: errorMessage }));
      }
    }
  };

  // Handle input changes with validation
  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };


  const handleBiometricAuth = async () => {
    try {
      const atex = await TokenManager.getToken();

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnabledFromBiometric =
        await SecureStore.getItemAsync("biometric_enabled");

      if (!isBiometricEnabled || isEnabledFromBiometric !== "true") {
        return AlertComponent({
          title: "Biometric Not Enabled",
          message:
            "Biometric authentication is not enabled. Please login with email and password first.",
          btnTxt: "OK",
          btnFunc: () => { },
        });
      }

      if (!hasHardware) {
        return AlertComponent({
          title: "Biometric Unavailable",
          message: "Biometric authentication is not supported on this device.",
          btnTxt: "OK",
          btnFunc: () => { },
        });
      }

      let supportedBiometrics;
      if (hasHardware) {
        supportedBiometrics =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        // console.log("Supported Biometrics:", supportedBiometrics);
      }

      const savedBiometrics = await LocalAuthentication.isEnrolledAsync();
      if (!savedBiometrics) {
        AlertComponent({
          title: "No Biometrics Enrolled",
          message:
            "No biometric credentials are enrolled on this device. Please set up biometrics and try again.",
          btnTxt: "OK",
          btnFunc: () => { },
        });
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate",
        fallbackLabel: "Enter Passcode",
        disableDeviceFallback: false,
      });

      if (result.success) {
        // toast.showToast("Biometric authentication successful!", "success");
        // getting user credentials from secure store
        const enabled = await SecureStore.getItemAsync("biometric_enabled");
        // console.log("Biometric enabled:", enabled);

        if (enabled !== "true") {
          AlertComponent({
            title: "Biometric Not Set Up",
            message:
              "Please login with password first to enable biometric authentication.",
            btnTxt: "OK",
            btnFunc: () => {
              handleAllLogout()
            },
          });
          return;
        }

        // const notificationToken = await TokenManager.getNotificationToken();
        //
        const response = await loginWithBiometrics({
          data: {
            id: atex,
            // app_token: notificationToken || theNotifToken || null,
          },
        }).unwrap();

        // console.log("Biometric login successful:", response);
        // dispatch(setAtex(response?.token || response?.data?.token));
        // await SecureStore.setItemAsync(
        //   "auth_token",
        //   response?.token || response?.data?.token,
        // );
        await TokenManager.setToken(response?.token || response?.data?.token);
        dispatch(setUser(response?.data || response || {}));

        // Navigate based on status
        if ((response?.status || response?.data?.status) === "unverify") {
          setTimeout(() => {
            router.replace(`${paths.auth.confirmPin}?from=reset`);
          }, 500);
        } else {
          dispatch(setLoginSuccess());

          const userData = response?.data?.user || response?.user || userInfo;
          const welcomeName = userData?.name || userData?.username || "Trader";
          showInAppNotification({
            name: "Welcome to Atrader",
            text: `Welcome back, ${welcomeName}!`,
          });

          // Sync notification token to backend
          try {
            const latestToken =
              (await TokenManager.getNotificationToken()) ||
              (await registerForPushNotificationsAsync());
            if (latestToken) {
              await TokenManager.setNotificationToken(latestToken);
              await sendNotificationToken({ data: { app_token: latestToken } });
            }
          } catch (_e) {}

          // Sign into Firebase immediately so chat is ready
          const biometricRes = response?.data || response || {};
          if (biometricRes?.firebase_token) {
            try {
              const fbAuth = getAuth();
              await signInWithCustomToken(fbAuth, biometricRes.firebase_token);
              console.log("Firebase auth successful on biometric login");
            } catch (fbError) {
              console.error("Firebase auth failed on biometric login:", fbError);
            }
          }

          // Register with Zoho on biometric login
          if (userData?.email) {
            setZohoVisitor(userData.email, userData.email, userData.name);
          }

          setTimeout(() => {
            router.replace(paths.tabs.home);
          }, 500);
        }
      } else {
        toast.showToast(
          "Biometric authentication failed. Please try again.",
          "error",
        );
        handleAllLogout()
      }
    } catch (error: any) {
      // console.error("Biometric authentication error:", error);
      toast.showToast(
        `${error?.data?.message || error?.message || "Biometric authentication failed. Kindly login with your password."}`,
        "error",
      );
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const atex = await TokenManager.getToken();
      // console.log("token to login", atex);

      setErrors({});

      // Validate entire form based on the ates treu because we already have an email
      const atexToValidate =
        atex === null
          ? formData
          : {
            email: userInfo?.email || "",
            password: formData.password,
          };
      const validatedData = loginSchema.parse(atexToValidate);

      // console.log("Form data is valid:", validatedData);

      const payload = {
        email: validatedData.email || userInfo?.email,
        password: validatedData.password,
      };

      // Call login API
      const response = await login({ data: payload }).unwrap();

      const res = response?.data || response || {};
      // Update Redux state

      // await SecureStore.setItemAsync("auth_token", res?.token);
      // await SecureStore.setItemAsync("biometric_enabled", "true");
      dispatch(setIsBiometricEnabled(true));
      dispatch(setUser(res || null));

      if (res?.status === "unverify") {
        toast.showToast(
          `${response?.data?.message || response?.message || "Please verify your account"}`,
          "success",
        );
        dispatch(setUserEmail(formData.email));
        // dispatch(setAtex(res?.token));
        await TokenManager.setToken(res?.token);

        // console.log("User is unverified, navigating to confirm PIN");
        setTimeout(() => {
          router.replace(`${paths.auth.confirmPin}?from=unverified`);
        }, 1000);
        return;
      } else {
        // toast.showToast(
        //   `Login successful! ${response?.data?.message || response?.message || "Welcome back"}`,
        //   "success",
        // );
        // dispatch(setAuth(true));
        // console.log("login token", res.token);
        await TokenManager.setToken(res?.token);
        dispatch(setLoginSuccess());

        const pwdUserData = res?.user || userInfo;
        const pwdWelcomeName = pwdUserData?.name || pwdUserData?.username || "Trader";
        showInAppNotification({
          name: "Welcome to Atrader",
          text: `Welcome back, ${pwdWelcomeName}!`,
        });

        try {
          const latestToken =
            (await TokenManager.getNotificationToken()) ||
            (await registerForPushNotificationsAsync());
          if (latestToken) {
            await TokenManager.setNotificationToken(latestToken);
            await sendNotificationToken({ data: { app_token: latestToken } });
          }
        } catch (_e) {}

        // Sign into Firebase immediately so chat is ready
        if (res?.firebase_token) {
          try {
            const fbAuth = getAuth();
            await signInWithCustomToken(fbAuth, res.firebase_token);
            console.log("Firebase auth successful on password login");
          } catch (fbError) {
            console.error("Firebase auth failed on password login:", fbError);
          }
        }

        // Register with Zoho on password login
        if (res?.user?.email) {
          setZohoVisitor(res.user.email, res.user.email, res.user.name);
        }

        setFormData({ email: "", password: "" });
        // console.log("User is verified, proceeding to home");
        setTimeout(() => {
          router.replace(paths.tabs.home);
        }, 1000);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            const fieldName = err.path[0] as keyof LoginFormData;
            fieldErrors[fieldName] = err.message;
            toast.showToast(err.message, "error");
          }
        });
        setErrors(fieldErrors);

        // console.log("Validation errors:", fieldErrors);
      } else {
        console.error("Login API error :", error);
        Sentry.captureException(error);
        if (error?.status === "unverified") {
          // console.log("User is unverified, navigating to confirm PIN");
          setTimeout(() => {
            router.replace(`${paths.auth.confirmPin}?from=reset`);
          }, 1000);
          return;
        }
        toast.showToast(
          error?.data?.message || "Login failed. Please try again.",
          "error",
        );
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 pt-[30px] bg-background-light dark:bg-background-dark">
      <ThemedView className="flex-1 px-[25px]" variant="background">
        <FormContainer>
          {/* Header */}
          <View className="flex items-center justify-center mx-auto">
            <View
              className={``}
            >
              <Image source={TheLogo} style={{ width: 142, height: 40 }} resizeMode="contain" />

            </View>
            <ThemedText
              className="text-h6 !text-center my-3 pt-[20px]"
              variant="primary"
              family="primary"
              weight="bold"
            >
              {/* {atex === null
                ? `Welcome Back `
                : `Welcome back ${userInfo?.username || "Fam!"}âœŒðŸ½`} */}
              {`Welcome back, ${userInfo?.username || "Fam"}`}!
            </ThemedText>
            {/* <ThemedTe
              className="text-b1 text-center mb-6"
              variant="secondary"
              family="primary"
              weight="medium"
            >
              {atex === null
                ? "Login to continue trading"
                : "Login with your password or use your biometrics "}
              {"Login with your password or use your biometrics "}
            </ThemedText> */}
          </View>

          {/* login already */}
          {/* {atex !== null && user !== null && ( */}
          <View className="w-full mt-4 ">
            <PasswordInput
              className="mb-1 w-full"
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(text) => handleInputChange("password", text)}
              error={errors.password}
              disabled={biometricLoginLoading}
            />

            <View className="w-full items-end">
              <ThemedLink
                variant="primary"
                weight="normal"
                underline={false}
                onPress={() => router.push(paths.auth.forgotPassword)}
                className="py-2"
              >
                Forgot Password
              </ThemedLink>
            </View>

            <Button
              className="w-full my-3 py-[12px]"
              variant="primary"
              onPress={handleSubmit}
              // onPress={() => router.push(paths.tabs.home)}
              disabled={isLoading || biometricLoginLoading}
              loading={isLoading}
            >
              {"Login"}
            </Button>

            <View className="mb-6">
              {biometricLoginLoading ? (
                <>
                  <View className="h-[45px] mx-auto w-[63px] flex items-center justify-center mt-5 mb-3  bg-foreground-light dark:bg-foreground-dark border-[1px] dark:border-[#232323] border-[#E7E7E7] rounded-[8px] py-[15px] px-[14px]">
                    <ActivityIndicator
                      size="small"
                      color={isDark ? "#FFFFFF" : "#060606"}
                    />
                  </View>
                </>
              ) : (
                <Pressable
                  onPress={handleBiometricAuth}
                  // disabled={biometricLoading || biometricLoginLoading}
                  className="mx-auto w-[63px] flex items-center justify-center mt-5 mb-3 bg-foreground-light dark:bg-foreground-dark border-[1px] dark:border-[#232323] border-[#E7E7E7] rounded-[20px] py-[15px] px-[14px]"
                >
                  {Platform.OS === "android" ? (
                    <Fingerprint
                      width={24}
                      height={24}
                      color={isDark ? "#FFFFFF" : "#060606"}
                    />
                  ) : (
                    <ScanFace
                      width={24}
                      height={24}
                      color={isDark ? "#FFFFFF" : "#060606"}
                    />
                  )}
                </Pressable>
              )}
              {/* <ThemedText
                variant="secondary"
                family="primary"
                className="text-center"
              >
                {Platform.OS === "ios"
                  ? "Login with Face ID"
                  : "Login with Biometrics"}
              </ThemedText> */}
            </View>
          </View>
          {/* )} */}
        </FormContainer>
        <View className=" flex-row items-center mb-10 justify-center item-end gap-1">
          <Pressable
            // variant="accent"
            // weight="bold"
            onPress={() => {
              handleAllLogout();
              // console.log("sent");
            }}
          >
            <ThemedText className="!text-primary-500 ">
              Switch Account
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
};

export default LoginWithBiometrics;
