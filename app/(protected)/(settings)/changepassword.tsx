import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import {
  FormContainer,
  Input,
  PasswordInput,
} from "@/components/ui/form-fields";
import { useToast } from "@/context/ToastProvider";
import {
  useChangePasswordMutation,
  useGetChangePasswordOtpMutation,
} from "@/redux/settings/settings";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, TouchableOpacity, View } from "react-native";
import { z } from "zod";

// Zod validation schema
const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword !== data.oldPassword, {
    message: "New password must be different from old password",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// OTP validation schema
const otpSchema = z.object({
  otp: z
    .string()
    .min(4, "Please enter a valid OTP code")
    .max(6, "OTP code is too long")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
type OtpForm = z.infer<typeof otpSchema>;

const Changepassword = () => {
  const toast = useToast();
  const router = useRouter();
  // Form state
  const [formData, setFormData] = useState<ChangePasswordForm>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  // const { atex } = useAuthToken();

  // Error state
  const [error, setError] = useState<
    Partial<Record<keyof ChangePasswordForm, string>>
  >({});

  // OTP state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  // API mutations
  const [getChangePasswordOtp, { isLoading: isGetPasswordLoading }] =
    useGetChangePasswordOtpMutation();

  const [changePassword, { isLoading: isChangePasswordLoading }] =
    useChangePasswordMutation();

  // Validation function using Zod
  const validateForm = () => {
    try {
      changePasswordSchema.parse(formData);
      setError({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const formattedErrors: Partial<
          Record<keyof ChangePasswordForm, string>
        > = {};
        err.issues.forEach((error) => {
          const path = error.path[0] as keyof ChangePasswordForm;
          formattedErrors[path] = error.message;
        });
        setError(formattedErrors);
      }
      return false;
    }
  };

  // Validate OTP
  const validateOtp = () => {
    try {
      otpSchema.parse({ otp });
      setOtpError("");
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setOtpError(err.issues[0].message);
      }
      return false;
    }
  };

  // STEP 1: Handle getting OTP (First API call)
  const handleGetOtp = async () => {
    // Reset errors
    setError({});

    // Validate form first
    if (!validateForm()) {
      return;
    }

    try {
      // First API call: Request OTP
      const atex = await TokenManager.getToken();
      const response = await getChangePasswordOtp({
        data: {
          token: atex,
        },
      }).unwrap();

      // Show success message
      toast.showToast(
        "OTP sent successfully. Check your email/phone.",
        "success",
      );

      // Show OTP modal for user to enter the code
      setShowOtpModal(true);
    } catch (err: any) {
      console.error("Get OTP error:", err);

      // Handle specific errors
      if (err?.data?.message) {
        if (err.data.message.toLowerCase().includes("password")) {
          setError({ oldPassword: err.data.message });
        } else {
          toast.showToast(`Failed to send OTP: ${err.data.message}`, "error");
        }
      } else {
        toast.showToast("Failed to send OTP. Please try again later.", "error");
      }
    }
  };

  // STEP 2: Handle password change with OTP (Second API call)
  const handleChangePassword = async () => {
    // Validate OTP input
    if (!validateOtp()) {
      return;
    }

    try {
      const atex = await TokenManager.getToken();
      // Second API call: Change password WITH the OTP
      const response = await changePassword({
        data: {
          old_password: formData.oldPassword,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword,
          otp: otp, // OTP from modal input
          token: atex,
        },
      }).unwrap();

      // Show success message
      toast.showToast("Password changed successfully!", "success");

      // Reset everything
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setOtp("");
      setShowOtpModal(false);

      router.back();
    } catch (err: any) {
      console.error("Change password error:", err);

      if (err?.data?.message) {
        if (err.data.message.toLowerCase().includes("otp")) {
          setOtpError(err.data.message);
        } else {
          toast.showToast(
            `Failed to change password: ${err.data.message}`,
            "error",
          );
        }
      } else {
        toast.showToast(
          "Failed to change password. Please try again later.",
          "error",
        );
      }
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setOtp("");
    setOtpError("");

    try {
      const atex = await TokenManager.getToken();

      await getChangePasswordOtp({
        oldPassword: formData.oldPassword,
        // token: atex
      }).unwrap();

      toast.showToast(
        "OTP resent successfully. Check your email/phone.",
        "success",
      );
    } catch (err: any) {
      console.error('resend error', err)
      toast.showToast("Failed to resend OTP. Please try again later.", "error");
    }
  };

  // Handle field change with validation
  const handleFieldChange = (
    field: keyof ChangePasswordForm,
    value: string,
  ) => {
    setFormData({ ...formData, [field]: value });

    // Clear error for this field
    if (error[field]) {
      setError({ ...error, [field]: "" });
    }
  };

  const isLoading = isGetPasswordLoading || isChangePasswordLoading;
  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Change Password" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <FormContainer className="px-[24px] pt-4">
            {/* Old Password */}
            <PasswordInput
              className="mb-5 w-full"
              label="Old Password"
              placeholder="Enter old password"
              value={formData.oldPassword}
              onChangeText={(text) => handleFieldChange("oldPassword", text)}
              error={error?.oldPassword}
            />

            {/* New Password */}
            <PasswordInput
              className="mb-5 w-full"
              label="New Password"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChangeText={(text) => handleFieldChange("newPassword", text)}
              error={error?.newPassword}
            />

            {/* Confirm New Password */}
            <PasswordInput
              className="mb-3 w-full"
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={formData.confirmPassword}
              onChangeText={(text) => handleFieldChange("confirmPassword", text)}
              error={error?.confirmPassword}
            />

            {/* Password Requirements */}
            <View className="mb-4 px-2">
              <ThemedText className="text-xs text-gray-500 mb-1">
                Password must contain:
              </ThemedText>
              <ThemedText className="text-xs text-gray-500">
                • At least 8 characters
              </ThemedText>
              <ThemedText className="text-xs text-gray-500">
                • One uppercase letter
              </ThemedText>
              <ThemedText className="text-xs text-gray-500">
                • One lowercase letter
              </ThemedText>
              <ThemedText className="text-xs text-gray-500">
                • One number
              </ThemedText>
            </View>
          </FormContainer>
        </ScrollView>

        <View className="px-[24px] pb-6">
          <Button
            className="w-full my-3 py-[12px]"
            variant="primary"
            onPress={handleGetOtp}
            disabled={isLoading}
            loading={isGetPasswordLoading}
          >
            {"Continue"}
          </Button>
        </View>
      </KeyboardAvoidingView>

      {/* OTP Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <ThemedView className="rounded-3xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center">
                <ThemedText className="text-3xl">🔐</ThemedText>
              </View>
            </View>

            <ThemedText className="text-xl font-bold text-center mb-2">
              Enter OTP Code
            </ThemedText>

            <ThemedText className="text-center text-gray-600 text-sm mb-6">
              {"We've"} sent a verification code to your registered email/phone
            </ThemedText>

            {/* OTP Input */}
            <View className="mb-4">
              <Input
                className="border border-gray-300 rounded-2xl p-4 text-center text-2xl font-bold tracking-widest"
                placeholder="Enter OTP"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  setOtpError("");
                }}
              // keyboardType="number-pad"
              // maxLength={6}
              // autoFocus
              />
              {otpError ? (
                <ThemedText className="text-red-500 text-sm mt-2 text-center">
                  {otpError}
                </ThemedText>
              ) : null}
            </View>

            {/* Resend OTP */}
            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={isGetPasswordLoading}
              className="mb-6"
            >
              <ThemedText className="text-center underline !text-primary-200 text-sm font-semibold">
                {isGetPasswordLoading ? "Sending..." : "Resend OTP"}
              </ThemedText>
            </TouchableOpacity>

            {/* Buttons */}
            <View style={{ gap: 12 }}>
              <Button
                onPress={handleChangePassword}
                disabled={isChangePasswordLoading}
                loading={isChangePasswordLoading}
                className="w-full"
              >
                <ThemedText className="text-white text-center font-semibold">
                  Verify & Change Password
                </ThemedText>
              </Button>

              <Button
                variant="outline"
                onPress={() => {
                  setShowOtpModal(false);
                  setOtp("");
                  setOtpError("");
                }}
                disabled={isChangePasswordLoading}
              >
                <ThemedText className="text-center font-semibold">
                  Cancel
                </ThemedText>
              </Button>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default Changepassword;
