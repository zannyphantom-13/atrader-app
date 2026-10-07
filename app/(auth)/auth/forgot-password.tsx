import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { ThemedLink } from "@/components/ui/customlink";
import { FormContainer, Input } from "@/components/ui/form-fields";
import { images } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useForgotPasswordMutation } from "@/redux/auth/auth_api";
import { setUserEmail } from "@/redux/auth/auth_slice";
import { useAppDispatch } from "@/redux/store";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { z } from "zod";

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase(),
});

const ForgotPassword = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();
  // const { atex } = useAppSelector((state) => state.session);

  const [formData, setFormData] = useState({
    email: "",
  });

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const [errors, setErrors] = useState<
    Partial<Record<keyof ForgotPasswordFormData, string>>
  >({});

  const ThemeImage = isDark ? images.logoWhite : images.logoDark;

  // Validate individual field
  const validateField = (field: keyof ForgotPasswordFormData, value: any) => {
    try {
      const fieldSchema = forgotPasswordSchema.shape[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
        // Clear error if validation passes
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [field]: error.issues[0]?.message || "Invalid input",
        }));
      }
    }
  };

  // Handle input changes with validation
  const handleInputChange = (
    field: keyof ForgotPasswordFormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Validate field on change
    validateField(field, value);
  };

  // Handle input blur with validation
  // const handleInputBlur = (field: keyof ForgotPasswordFormData) => {
  //   validateField(field, formData[field]);
  // };

  const handleForgotPassword = async () => {
    try {
      setErrors({});

      // Validate entire form
      const validatedData = forgotPasswordSchema.parse(formData);

      // If validation passes, proceed with forgot password request
      console.log("Forgot password data is valid:", validatedData);

      const response = await forgotPassword({
        data: {
          email: validatedData.email,
        },
      }).unwrap();

      console.log("Forgot password request successful:", response);
      toast.showToast(
        `Reset code sent! ${response?.data?.message || response?.message}`,
        "success",
      );

      // Store email for next step
      dispatch(setUserEmail(validatedData.email));
      // dispatch(setHasAccount(traremue));

      // Navigate to OTP verification for password reset
      setTimeout(() => {
        router.push(`${paths.auth.confirmPin}?from=reset`);
      }, 1000);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<
          Record<keyof ForgotPasswordFormData, string>
        > = {};
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            const fieldName = err.path[0] as keyof ForgotPasswordFormData;
            fieldErrors[fieldName] = err.message;
            toast.showToast(err.message, "error");
          }
        });
        setErrors(fieldErrors);

        console.log("Validation errors:", fieldErrors);
      } else {
        console.error("API error ❌:", error);

        toast.showToast(
          error?.data?.message || "Failed to send reset code",
          "error",
        );
      }
    }
  };

  const isFormValid = formData.email.trim() && !errors.email;

  const theRoute = async () => {
    const atex = await TokenManager.getToken();

    const route = atex
      ? router.push(paths.auth.loginWithBiometrics)
      : router.push(paths.auth.login);

    return route;
  };

  return (
    <ThemedView className="flex-1 pt-[10px] px-[25px]" variant="background">
      <FormContainer>
        {/* Header Section */}
        <View className="f">
          {/* <AuthLogo /> */}
          <ThemedText
            className="text-h6 my-3"
            variant="primary"
            family="primary"
            weight="semibold"
          >
            {/* {atex === null
                ? `Welcome Back `
                : `Welcome back ${userInfo?.username || "Fam!"}✌🏽`} */}
            Forgot Password
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
            No worries! Enter your email address below and we will send you a
            code to reset your password.
          </ThemedText>
        </View>

        {/* Form Section */}
        {/* Email Input */}
        <Input
          className="mb-6 w-full"
          label="Email Address"
          placeholder="Enter your email address"
          value={formData.email}
          onChangeText={(text) => handleInputChange("email", text)}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Continue Button */}
        <Button
          className="w-full my-3 py-[12px]"
          variant="primary"
          onPress={handleForgotPassword}
          // onPress={
          //   () => {
          //     router.push(paths.auth.resetPassword);}
          // }
          // disabled={isLoading || !isFormValid}
          loading={isLoading}
        >
          {"Send Reset Code"}
        </Button>
      </FormContainer>
      {/* Back to Login */}
      <View className="flex-row items-center mb-10 justify-center gap-1">
        <ThemedText
          variant="secondary"
          family="primary"
          weight="regular"
          className="text-b2 py-4 text-center"
        >
          Remember password?{" "}
        </ThemedText>
        <ThemedLink
          variant="accent"
          weight="bold"
          underline={false}
          className="text-primary-500 underline"
          onPress={() => theRoute()}
        >
          Login
        </ThemedLink>
      </View>
    </ThemedView>
  );
};

export default ForgotPassword;
