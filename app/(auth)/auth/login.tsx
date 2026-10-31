const AuthLogo = require("@/assets/v1/auth-logo.png");
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { ThemedLink } from "@/components/ui/customlink";
import {
  FormContainer,
  Input,
  PasswordInput,
} from "@/components/ui/form-fields";
import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useAuth } from "@/guards/guard";
// import { setZohoVisitor } from "@/lib/zoho-service";
import "@/lib/firebase";
import { signInWithCustomToken, getAuth } from "firebase/auth";

import {
  useLoginMutation,
  useLoginWithBiometricsMutation,
} from "@/redux/auth/auth_api";
import { setUser, setUserEmail } from "@/redux/auth/auth_slice";
import {
  setIsBiometricEnabled,
  setLoginSuccess,
} from "@/redux/auth/session";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { View, Image } from "react-native";
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

// interface BiometricCapabilities {
//   hasHardware: boolean;
//   isEnrolled: boolean;
//   supportedTypes: LocalAuthentication.AuthenticationType[];
//   biometricType: "fingerprint" | "faceId" | "iris" | "mixed" | "none";
// }

const Login = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const [formData, setFormData] = React.useState<LoginFormData>({
    email: "",
    password: "",
  });

  const { handleAllLogout } = useAuth();
  const [errors, setErrors] = React.useState<Partial<Record<keyof LoginFormData, string>>>({});
  const { user } = useAppSelector((state) => state.auth);
  const { isBiometricEnabled } = useAppSelector((state) => state.session);
  const [atex, setAtex] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      const token = await TokenManager.getToken();
      setAtex(token);
    };
    fetchToken();
  }, []);

  const { user: userInfo } = user || {};
  const [login, { isLoading }] = useLoginMutation();
  const [loginWithBiometrics, { isLoading: biometricLoginLoading }] = useLoginWithBiometricsMutation();

  const FaceIcon = icons.fingerprint;

  const validateField = (field: keyof LoginFormData, value: string) => {
    try {
      const fieldSchema = loginSchema.shape[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues[0]?.message || "";
        setErrors((prev) => ({ ...prev, [field]: errorMessage }));
      }
    }
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const currentToken = await TokenManager.getToken();
      const notificationToken = await TokenManager.getNotificationToken();
      setErrors({});

      // Validate entire form based on the ates treu because we already have an email
      const atexToValidate =
        atex === null
          ? formData
          : {
            email: formData.email || "",
            password: formData.password,
          };
      const validatedData = loginSchema.parse(atexToValidate);

      // console.log("Form data is valid:", validatedData);

      const payload = {
        email: validatedData.email || userInfo?.email,
        password: validatedData.password,
        app_token: notificationToken || null,
      };

      // Call login API
      const response = await login({ data: payload }).unwrap();

      const res = response?.data || response || {};
      // Update Redux state

      await SecureStore.setItemAsync("biometric_enabled", "true");
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

        setTimeout(() => {
          router.replace(`${paths.auth.confirmPin}?from=unverified`);
        }, 1000);
        return;
      } else {
        await TokenManager.setToken(res?.token);
        dispatch(setLoginSuccess());

        // Sign into Firebase immediately so chat is ready
        if (res?.firebase_token) {
          try {
            const fbAuth = getAuth();
            await signInWithCustomToken(fbAuth, res.firebase_token);
            console.log("Firebase auth successful on login");
          } catch (fbError) {
            console.error("Firebase auth failed on login:", fbError);
          }
        }

        // Register with Zoho immediately on login
        if (res?.user?.email) {
          // setZohoVisitor(res.user.email, res.user.email, res.user.name);
        }

        setFormData({ email: "", password: "" });
        // Stack.Protected in RootStack auto-navigates when isAuth=true via dispatch(setLoginSuccess()) above.
        // Manual router.replace() causes 'navigate before Root Layout mounted' crash - removed.
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
        console.error("Login API error ❌:", error);

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
          <View className="f">
            <Image source={AuthLogo} style={{ width: 25, height: 27 }} resizeMode="contain" />
            <ThemedText
              className="text-h6 my-3 pt-[20px]"
              variant="primary"
              family="primary"
              weight="medium"
            >
              {/* {atex === null
                ? `Welcome Back `
                : `Welcome back ${userInfo?.username || "Fam!"}`} */}
              Login
            </ThemedText>
            <ThemedText
              className="text-b2 mb-6"
              variant="secondary"
              family="primary"
              weight="regular"
            >
              {/* {atex === null
                ? "Login to continue trading"
                : "Login with your password or use your biometrics "} */}
              Enter your login details
            </ThemedText>
          </View>

          {/* not login already */}
          {/* {atex === null && user === null && ( */}
          <>
            <Input
              className="mb-1 w-full"
              label="Email or Username"
              placeholder="Enter your email address"
              value={formData.email}
              onChangeText={(text) => handleInputChange("email", text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <PasswordInput
              className="mb-1 w-full"
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(text) => handleInputChange("password", text)}
              error={errors.password}
            />

            <View className="w-full items-end">
              <ThemedLink
                variant="primary"
                underline={false}
                weight="normal"
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
              disabled={isLoading}
              loading={isLoading}
            >
              {"Login"}
            </Button>
          </>
          {/* )} */}

          {/* login already */}
          {/* {atex !== null && user !== null && (
            <View className="w-full mt-4 ">
              <PasswordInput
                className="mb-1 w-full"
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                error={errors.password}
              />

              <View className="w-full items-end">
                <ThemedLink
                  variant="primary"
                  onPress={() => router.push(paths.auth.forgotPassword)}
                  className="py-2"
                >
                  Forgot Password
                </ThemedLink>
              </View>

              <View className="mb-6">
                {biometricLoginLoading ? (
                  <>
                    <View className="h-[45px] mx-auto w-[45px] flex items-center justify-center mt-5 mb-3  bg-primary-500 rounded-[8px] py-[15px] px-[14px]">
                      <ActivityIndicator size="small" color={"#ffffff"} />
                    </View>
                  </>
                ) : (
                  <Pressable
                    onPress={handleBiometricAuth}
                    // disabled={biometricLoading || biometricLoginLoading}
                    className="mx-auto w-[45px] flex items-center justify-center mt-5 mb-3 bg-primary-500 rounded-[8px] py-[15px] px-[14px]"
                  >
                    {Platform.OS === "android" ? (
                      <FaceIcon width={24} height={24} />
                    ) : (
                      <ScanFace width={24} height={24} color={"#ffffff"} />
                    )}
                  </Pressable>
                )}
                <ThemedText
                  variant="secondary"
                  family="primary"
                  className="text-center"
                >
                  {Platform.OS === "ios"
                    ? "Login with Face ID"
                    : "Login with Biometrics"}
                </ThemedText>
              </View>

              <Button
                className="w-full my-3 py-[12px]"
                variant="primary"
                onPress={handleSubmit}
                // onPress={() => router.push(paths.tabs.home)}
                disabled={isLoading}
                loading={isLoading}
              >
                {"Login"}
              </Button>

              <View className="flex-row items-center mb-10 justify-center gap-1">
                <ThemedText
                  variant="secondary"
                  family="primary"
                  weight="medium"
                  className="text-b2 py-4 text-center"
                >
                  Not you?{" "}
                </ThemedText>
                <ThemedLink
                  variant="accent"
                  weight="bold"
                  className="text-primary-500 underline"
                  onPress={() => {
                    handleAllLogout();
                  }}
                >
                  Logout
                </ThemedLink>
              </View>
            </View>
          )} */}
          <View className="flex-row items-center  justify-center gap-1">
            <ThemedText
              variant="secondary"
              family="primary"
              weight="regular"
              className="text-b2 py-4 text-center"
            >
              {"Don't"} have an account?{" "}
            </ThemedText>
            <ThemedLink
              variant="accent"
              underline={false}
              weight="bold"
              className="text-primary-500 underline"
              onPress={() => {
                router.push(paths.auth.register);
              }}
            >
              Create account
            </ThemedLink>
          </View>
        </FormContainer>
        {/* Sign up link */}
      </ThemedView>
    </SafeAreaView>
  );
};

export default Login;
