import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { FormContainer, PasswordInput } from "@/components/ui/form-fields";
import { useToast } from "@/context/ToastProvider";
import { useResetPasswordMutation } from "@/redux/auth/auth_api";
import { setUserEmail } from "@/redux/auth/auth_slice";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, View } from "react-native";
import { z } from "zod";

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  // const { isDark } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { email } = useAppSelector((state) => state.auth);

  const params = useLocalSearchParams();
  const tembele = params.token as string;

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const [errors, setErrors] = useState<
    Partial<Record<keyof ResetPasswordFormData, string>>
  >({});

  // Validate individual field
  const validateField = (field: keyof ResetPasswordFormData, value: any) => {
    try {
      const fieldSchema = resetPasswordSchema.shape[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
        // Clear error if validation passes
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof ResetPasswordFormData, string>> =
          {};

        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            const fieldName = err.path[0] as keyof ResetPasswordFormData;
            newErrors[fieldName] = err.message;
          }
        });

        setErrors((prev) => ({ ...prev, ...newErrors }));
      }
    }
  };

  // Handle input changes with validation
  const handleInputChange = (
    field: keyof ResetPasswordFormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Validate field on change
    validateField(field, value);
  };

  // Handle input blur with validation
  const handleInputBlur = (field: keyof ResetPasswordFormData) => {
    validateField(field, formData[field]);
  };

  const handleResetPassword = async () => {
    try {
      setErrors({});

      // Validate entire form
      const validatedData = resetPasswordSchema.parse(formData);

      if (!email) {
        toast.showToast(
          "Session expired. Please start the reset process again.",
          "error",
        );
        router.push(paths.auth.forgotPassword);
        return;
      }

      // If validation passes, proceed with password reset
      console.log("Reset password data is valid:", validatedData);

      const response = await resetPassword({
        data: {
          token: tembele,
          password: validatedData.password,
          confirm: validatedData.confirmPassword,
        },
      }).unwrap();

      console.log("Password reset successful:", response);
      toast.showToast(
        `Password reset successful! ${response?.message || response?.data?.message}`,
        "success",
      );
      dispatch(setUserEmail(""));
      router.push(paths.auth.login);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<
          Record<keyof ResetPasswordFormData, string>
        > = {};
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            const fieldName = err.path[0] as keyof ResetPasswordFormData;
            fieldErrors[fieldName] = err.message;
            toast.showToast(err.message, "error");
          }
        });
        setErrors(fieldErrors);

        console.log("Validation errors:", fieldErrors);
      } else {
        console.error("API error ❌:", error);

        toast.showToast(
          error?.data?.message || "Password reset failed",
          "error",
        );
      }
    }
  };

  const isFormValid =
    formData.password.trim() &&
    formData.confirmPassword.trim() &&
    !errors.password &&
    !errors.confirmPassword;

  return (
    <ThemedView
      className={`flex-1 px-[25px] ${Platform.OS === "ios" ? "" : "pt-[20px]"}`}
      variant="background"
    >
      <FormContainer>
        {/* Header Section */}
        <View className="mt-6">
          <ThemedText
            className="text-h6 mb-3"
            variant="primary"
            family="primary"
            weight="semibold"
          >
            Create New Password
          </ThemedText>
          <ThemedText
            className="text-b2 mb-6"
            variant="secondary"
            family="primary"
            weight="regular"
          >
            Please enter and confirm your new password. You will need to login
            after you reset.
          </ThemedText>
        </View>

        {/* Form Section */}
        {/* New Password Input */}
        <PasswordInput
          className="mb-5 w-full"
          label="New Password"
          placeholder="Enter new password"
          value={formData.password}
          onChangeText={(text) => handleInputChange("password", text)}
          // onBlur={() => handleInputBlur('password')}
          error={errors.password}
        />

        {/* Confirm New Password Input */}
        <PasswordInput
          className="mb-3 w-full"
          label="Confirm New Password"
          placeholder="Re-enter new password"
          value={formData.confirmPassword}
          onChangeText={(text) => handleInputChange("confirmPassword", text)}
          // onBlur={() => handleInputBlur('confirmPassword')}
          error={errors.confirmPassword}
        />

        {/* Password Requirements */}
        <View className="mb-4">
          <ThemedText
            className="text-b3 mb-2"
            variant="secondary"
            family="primary"
            weight="medium"
          >
            Password must contain:
          </ThemedText>

          <View className="ml-2">
            <ThemedText
              className={`text-b3 ${formData.password.length >= 8 ? "text-green-500" : "text-gray-500"}`}
              variant="secondary"
              family="primary"
            >
              • At least 8 characters
            </ThemedText>
            <ThemedText
              className={`text-b3 ${/[a-z]/.test(formData.password) ? "text-green-500" : "text-gray-500"}`}
              variant="secondary"
              family="primary"
            >
              • One lowercase letter
            </ThemedText>
            <ThemedText
              className={`text-b3 ${/[A-Z]/.test(formData.password) ? "text-green-500" : "text-gray-500"}`}
              variant="secondary"
              family="primary"
            >
              • One uppercase letter
            </ThemedText>
            <ThemedText
              className={`text-b3 ${/[0-9]/.test(formData.password) ? "text-green-500" : "text-gray-500"}`}
              variant="secondary"
              family="primary"
            >
              • One number
            </ThemedText>
            <ThemedText
              className={`text-b3 ${/[^a-zA-Z0-9]/.test(formData.password) ? "text-green-500" : "text-gray-500"}`}
              variant="secondary"
              family="primary"
            >
              • One special character
            </ThemedText>
          </View>
        </View>

        {/* Reset Password Button */}
        <Button
          className="w-full my-3 py-[12px]"
          variant="primary"
          onPress={handleResetPassword}
          disabled={isLoading || !isFormValid}
          loading={isLoading}
        >
          {"Reset Password"}
        </Button>
      </FormContainer>
    </ThemedView>
  );
};

export default ResetPassword;
