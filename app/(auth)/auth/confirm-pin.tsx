import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { ThemedLink } from "@/components/ui/customlink";
import { FormContainer } from "@/components/ui/form-fields";
import { OtpInput } from "@/components/ui/otp-input";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import {
  useResendOtpForgotPasswordMutation,
  useResendOtpMutation,
  useVerifyOtpForPasswordResetMutation,
  useVerifyOtpMutation,
} from "@/redux/auth/auth_api";
import { setUserEmail } from "@/redux/auth/auth_slice";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { z } from "zod";

type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

const verifyOtpSchema = z.object({
  otp: z
    .string()
    .min(6, "Verification code must be 6 digits")
    .max(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only numbers"),
});

// Timer duration in seconds (10 minutes = 600 seconds)
const RESEND_COOLDOWN_DURATION = 120;

const ConfirmPin = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { email } = useAppSelector((state) => state.auth);
  // const { atex } = useAppSelector((state) => state.session);

  const { from } = useLocalSearchParams();

  const [formData, setFormData] = useState({
    otp: "",
  });
  const dispatch = useAppDispatch();

  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();

  const [verifyOtpForPasswordReset, { isLoading: isVerifying }] =
    useVerifyOtpForPasswordResetMutation();

  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  const [resendOtpForgotPassword, { isLoading: isResendingForgotPassword }] =
    useResendOtpForgotPasswordMutation();

  const [errors, setErrors] = useState<
    Partial<Record<keyof VerifyOtpFormData, string>>
  >({});

  const [cooldown, setCooldown] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Validate individual field
  const validateField = (field: keyof VerifyOtpFormData, value: any) => {
    try {
      const fieldSchema = verifyOtpSchema.shape[field];
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
  const handleInputChange = (field: keyof VerifyOtpFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Validate field on change
    validateField(field, value);
  };

  //  verifying otp
  const handleVerifyOtp = async () => {
    try {
      setErrors({});
      const atex = await TokenManager.getToken();

      // Validate entire form
      const validatedData = verifyOtpSchema.parse(formData);

      // If validation passes, proceed with OTP verification
      console.log("OTP data is valid:", validatedData);
      let response: any;
      if (from === "reset") {
        // Verify OTP for password reset
        response = await verifyOtpForPasswordReset({
          data: {
            email: email,
            otp: validatedData.otp,
            token: atex,
          },
        }).unwrap();
        setFormData({ otp: "" });

        toast.showToast(
          `Verification successful! ${response?.data?.message || response?.message}`,
          "success",
        );
        setTimeout(() => {
          router.push({
            pathname: paths.auth.resetPassword,
            params: { token: response?.token || response?.data?.token },
          });
        }, 1000);
      } else if (from === "unverified") {
        // Handle unverified account OTP verification
        response = await verifyOtp({
          data: {
            token: atex,
            otp: validatedData.otp,
          },
        }).unwrap();
        setFormData({ otp: "" });
        toast.showToast(
          `Verification successful! ${response?.data?.message || response?.message}`,
          "success",
        );

        setTimeout(() => {
          router.replace(paths.auth.createPin);
        }, 1000);
      } else {
        // Regular OTP verification
        response = await verifyOtp({
          data: {
            token: atex,
            otp: validatedData.otp,
          },
        }).unwrap();
        setFormData({ otp: "" });
        toast.showToast(
          `Verification successful! ${response?.data?.message || response?.message}`,
          "success",
        );

        setTimeout(() => {
          router.replace(paths.auth.createPin);
        }, 1000);
        dispatch(setUserEmail(""));
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof VerifyOtpFormData, string>> =
          {};
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            const fieldName = err.path[0] as keyof VerifyOtpFormData;
            fieldErrors[fieldName] = err.message;
            toast.showToast(err.message, "error");
          }
        });
        setErrors(fieldErrors);

        console.log("Validation errors:", fieldErrors);
      } else {
        console.error("API error ❌:", error);

        toast.showToast(error?.data?.message || "Verification failed", "error");
      }
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    try {
      const atex = await TokenManager.getToken();

      if (!email) {
        toast.showToast(
          "Email not found. Please go back and try again.",
          "error",
        );
        return;
      }

      if (from === "reset") {
        const response = await resendOtpForgotPassword({
          data: {
            email: email,
            token: atex,
          },
        }).unwrap();
        console.log("OTP resent successfully:", response);
        toast.showToast("Verification code resent successfully!", "success");
        setCooldown(RESEND_COOLDOWN_DURATION);
        return;
      } else if (from === "unverified") {
        const response = await resendOtp({
          data: {
            token: atex,
          },
        }).unwrap();
        console.log("OTP resent successfully:", response);
        toast.showToast("Verification code resent successfully!", "success");
        setCooldown(RESEND_COOLDOWN_DURATION);
        return;
      } else {
        const response = await resendOtp({
          data: {
            token: atex,
          },
        }).unwrap();
        console.log("OTP resent successfully:", response);
        toast.showToast("Verification code resent successfully!", "success");
        setCooldown(RESEND_COOLDOWN_DURATION);
      }
    } catch (error: any) {
      console.error("Resend OTP error ❌:", error);
      toast.showToast(error?.data?.message, "error");
    }
  };

  const canResend = cooldown === 0 && !isResending;

  return (
    // <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
    <ThemedView className="flex-1 px-[25px]" variant="background">
      <FormContainer>
        {/* Header Section */}
        <View className="mt-6">
          <ThemedText
            className="text-h6 mb-3"
            variant="primary"
            family="primary"
            weight="semibold"
          >
            Verification code
          </ThemedText>
          <ThemedText
            className="text-b2 mb-6"
            variant="secondary"
            family="primary"
            weight="regular"
          >
            Enter 6 digit code sent to{" "}
            <Text className="!font-bold text-white dark:text-black">
              {email || "your email address"}
            </Text>
          </ThemedText>
        </View>

        {/* Form Section */}
        {/* OTP Input */}
        {/* <Input
          className="mb-1 w-full "
          label="Verification Code"
          placeholder="Enter 6-digit code"
          value={formData.otp.slice(0, 6)}
          onChangeText={(text) => handleInputChange("otp", text)}
          error={errors.otp}
          keyboardType="numeric"
          // maxLength={6}
          autoCapitalize="none"
        /> */}

        {/* OTP Input */}
        <View className="mb-6">
          <ThemedText
            className="text-b2 mb-3"
            variant="primary"
            family="primary"
            weight="medium"
          >
            Enter verification code
          </ThemedText>
          <View className="bg-white dark:bg-black p-[14px] rounded-[20px] border-[1px] dark:border-[#232323] border-[#EFEFEF]">
            <OtpInput
              length={6}
              value={formData.otp}
              onChangeText={(otp) => handleInputChange("otp", otp)}
              error={errors.otp}
            />
          </View>
          {errors.otp && (
            <ThemedText
              className="text-b3 mt-2 !text-danger-500"
              // variant="error"
              family="primary"
              weight="regular"
            >
              {errors.otp || "Kindly input the correct code"}
            </ThemedText>
          )}
        </View>

        {/* Verify Button */}
        <Button
          className="w-full my-3 py-[12px]"
          variant="primary"
          onPress={handleVerifyOtp}
          // onPress={() => {
          //   router.push(paths.auth.createPin);}
          // }
          disabled={
            isLoading || !formData.otp.trim() || formData.otp.length < 6
          }
          loading={isLoading || isVerifying}
        >
          {"Verify Code"}
        </Button>
        {/* Resend Code Section */}
        <View className="flex-row items-center justify-start my-3">
          {isResending ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator
                size="small"
                color={isDark ? "#FFFFFF" : "#000000"}
              />
              <ThemedText
                variant="secondary"
                family="primary"
                weight="medium"
                className="text-b2"
              >
                Resending code...
              </ThemedText>
            </View>
          ) : cooldown > 0 ? (
            <View className="flex-row items-center gap-1">
              <ThemedText
                variant="secondary"
                family="primary"
                weight="medium"
                className="text-b2"
              >
                Resend code in
              </ThemedText>
              <ThemedText
                variant="accent"
                family="primary"
                weight="bold"
                className="text-b2 text-primary-500"
              >
                {formatTime(cooldown)}
              </ThemedText>
            </View>
          ) : (
            <View className="flex-row items-center gap-1">
              <ThemedText
                variant="secondary"
                family="primary"
                weight="medium"
                className="text-b2"
              >
                {" Didn't"} receive code?
              </ThemedText>
              <ThemedLink
                variant="accent"
                weight="bold"
                className="text-primary-500 underline"
                onPress={handleResendOtp}
                disabled={!canResend}
              >
                Resend
              </ThemedLink>
            </View>
          )}
        </View>
      </FormContainer>
    </ThemedView>
    // </SafeAreaView>
  );
};

export default ConfirmPin;
