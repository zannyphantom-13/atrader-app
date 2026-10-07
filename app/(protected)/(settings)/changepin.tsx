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
import useAuthToken from "@/hooks/useToken";
import {
  useChangePinMutation,
  useGetChangePinOtpMutation,
} from "@/redux/settings/settings";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, TouchableOpacity, View } from "react-native";
import { z } from "zod";

// Zod validation schema for PIN
const changePinSchema = z
  .object({
    oldPin: z
      .string()
      .min(4, "PIN must be at least 4 digits")
      .max(6, "PIN must be at most 6 digits")
      .regex(/^\d+$/, "PIN must contain only numbers"),
    newPin: z
      .string()
      .min(4, "PIN must be at least 4 digits")
      .max(6, "PIN must be at most 6 digits")
      .regex(/^\d+$/, "PIN must contain only numbers"),
    confirmPin: z.string().min(1, "Please confirm your new PIN"),
  })
  .refine((data) => data.newPin !== data.oldPin, {
    message: "New PIN must be different from old PIN",
    path: ["newPin"],
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

// OTP validation schema
const otpSchema = z.object({
  otp: z
    .string()
    .min(4, "Please enter a valid OTP code")
    .max(6, "OTP code is too long")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

type ChangePinForm = z.infer<typeof changePinSchema>;
type OtpForm = z.infer<typeof otpSchema>;

const Changepin = () => {
  const toast = useToast();
  const router = useRouter();
  const { atex } = useAuthToken();

  // Form state
  const [formData, setFormData] = useState<ChangePinForm>({
    oldPin: "",
    newPin: "",
    confirmPin: "",
  });

  // Error state
  const [error, setError] = useState<
    Partial<Record<keyof ChangePinForm, string>>
  >({});

  // OTP state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  // API mutations
  const [getChangePinOtp, { isLoading: isGetPinOtpLoading }] =
    useGetChangePinOtpMutation();

  const [changePin, { isLoading: isChangePinLoading }] = useChangePinMutation();

  // Validation function using Zod
  const validateForm = () => {
    try {
      changePinSchema.parse(formData);
      setError({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const formattedErrors: Partial<Record<keyof ChangePinForm, string>> =
          {};
        err.issues.forEach((error) => {
          const path = error.path[0] as keyof ChangePinForm;
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
      const response = await getChangePinOtp({
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
        if (err.data.message.toLowerCase().includes("pin")) {
          setError({ oldPin: err.data.message });
        } else {
          toast.showToast(`Failed to send OTP: ${err.data.message}`, "error");
        }
      } else {
        toast.showToast("Failed to send OTP. Please try again later.", "error");
      }
    }
  };

  // STEP 2: Handle PIN change with OTP (Second API call)
  const handleChangePin = async () => {
    // Validate OTP input
    if (!validateOtp()) {
      return;
    }

    try {
      // Second API call: Change PIN WITH the OTP
      const response = await changePin({
        data: {
          old_pin: formData.oldPin,
          new_pin: formData.newPin,
          confirm_pin: formData.confirmPin,
          otp: otp,
          token: atex,
        },
      }).unwrap();

      // Show success message
      toast.showToast(`PIN changed successfully!`, "success");

      // Reset everything
      setFormData({
        oldPin: "",
        newPin: "",
        confirmPin: "",
      });
      setOtp("");
      setShowOtpModal(false);

      router.back();
    } catch (err: any) {
      console.error("Change PIN error:", err);

      if (err?.data?.message) {
        if (err.data.message.toLowerCase().includes("otp")) {
          setOtpError(err.data.message);
        } else {
          toast.showToast(`Failed to change PIN: ${err.data.message}`, "error");
        }
      } else {
        toast.showToast(
          "Failed to change PIN. Please try again later.",
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
      await getChangePinOtp({
        data: {
          token: atex,
        },
      }).unwrap();

      toast.showToast(
        "OTP resent successfully. Check your email/phone.",
        "success",
      );
    } catch (err: any) {
      toast.showToast("Failed to resend OTP. Please try again later.", "error");
    }
  };

  // Handle field change with validation
  const handleFieldChange = (field: keyof ChangePinForm, value: string) => {
    setFormData({ ...formData, [field]: value });

    // Clear error for this field
    if (error[field]) {
      setError({ ...error, [field]: "" });
    }
  };

  const isLoading = isGetPinOtpLoading || isChangePinLoading;
  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Change PIN" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-[24px] pt-4">
            <ThemedText
              className="text-b2 mb-6"
              variant="secondary"
              family="primary"
              weight="medium"
            >
              If changed! This will be set as your new transaction PIN to validate
              payments
            </ThemedText>
          </View>

          <FormContainer className="px-[24px] ">
            {/* Old PIN */}
            <PasswordInput
              className="mb-5 w-full"
              label="Old pin"
              placeholder="Enter old PIN"
              value={formData.oldPin}
              onChangeText={(text) => handleFieldChange("oldPin", text)}
              error={error?.oldPin}
              keyboardType="phone-pad"
            />

            {/* New PIN */}
            <PasswordInput
              className="mb-5 w-full"
              label="New pin"
              placeholder="Enter new PIN"
              value={formData.newPin}
              onChangeText={(text) => handleFieldChange("newPin", text)}
              error={error?.newPin}
              keyboardType="phone-pad"
            />

            {/* Confirm New PIN */}
            <PasswordInput
              className="mb-3 w-full"
              label="Confirm New pin"
              placeholder="Re-enter new PIN"
              value={formData.confirmPin}
              onChangeText={(text) => handleFieldChange("confirmPin", text)}
              error={error?.confirmPin}
              keyboardType="phone-pad"
            />

            {/* PIN Requirements */}
            <View className="mb-4 px-2">
              <ThemedText className="text-xs text-gray-500 mb-1">
                PIN requirements:
              </ThemedText>
              <ThemedText className="text-xs text-gray-500">
                • 4-6 digit number
              </ThemedText>
              <ThemedText className="text-xs text-gray-500">
                • Must be different from old PIN
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
            loading={isGetPinOtpLoading}
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
                keyboardType="phone-pad"
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
              disabled={isGetPinOtpLoading}
              className="mb-6"
            >
              <ThemedText className="text-center underline !text-primary-200 text-sm font-semibold">
                {isGetPinOtpLoading ? "Sending..." : "Resend OTP"}
              </ThemedText>
            </TouchableOpacity>

            {/* Buttons */}
            <View style={{ gap: 12 }}>
              <Button
                onPress={handleChangePin}
                disabled={isChangePinLoading}
                loading={isChangePinLoading}
                className="w-full"
              >
                <ThemedText className="text-white text-center font-semibold">
                  Verify & Change PIN
                </ThemedText>
              </Button>

              <Button
                variant="outline"
                onPress={() => {
                  setShowOtpModal(false);
                  setOtp("");
                  setOtpError("");
                }}
                disabled={isChangePinLoading}
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

export default Changepin;
