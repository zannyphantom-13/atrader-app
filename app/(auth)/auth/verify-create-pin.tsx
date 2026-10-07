import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { FormContainer, PasswordInput } from "@/components/ui/form-fields";
import { useToast } from "@/context/ToastProvider";
import { useVerifyUserPinMutation } from "@/redux/auth/auth_api";
import { useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { z } from "zod";

type VerifyPinFormData = z.infer<typeof verifyPinSchema>;

const verifyPinSchema = z.object({
  confirmPin: z
    .string()
    .min(4, "PIN must be 4 digits")
    .max(4, "PIN must be 4 digits")
    .regex(/^\d{4}$/, "PIN must contain only numbers"),
});

const VerifyCreatePin = () => {
  // const { isDark } = useTheme();
  const router = useRouter();
  const toast = useToast();
  // const dispatch = useAppDispatch();
  const { email } = useAppSelector((state) => state.auth);
  // const { atex } = useAppSelector((state) => state.session);

  const [formData, setFormData] = useState({
    confirmPin: "",
  });

  const [verifyUserPin, { isLoading }] = useVerifyUserPinMutation();

  const [errors, setErrors] = useState<
    Partial<Record<keyof VerifyPinFormData, string>>
  >({});

  // const ThemeImage = isDark ? images.logoWhite : images.logoDark;

  // Validate individual field with PIN matching
  const validateField = (field: keyof VerifyPinFormData, value: any) => {
    try {
      const fieldSchema = verifyPinSchema.shape[field];
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
  const handleInputChange = (field: keyof VerifyPinFormData, value: string) => {
    // Only allow numeric input and limit to 4 characters
    const numericValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    setFormData((prev) => ({ ...prev, [field]: numericValue }));
    // Validate field on change
    validateField(field, numericValue);
  };

  const handleVerifyPin = async () => {
    try {
      const atex = await TokenManager.getToken();

      setErrors({});

      // Validate entire form
      const validatedData = verifyPinSchema.parse(formData);

      // If validation passes, proceed with PIN confirmation
      console.log("PIN confirmation data is valid:", validatedData);

      const response = await verifyUserPin({
        data: {
          email: email,
          pin: validatedData.confirmPin,
          token: atex,
        },
      }).unwrap();

      console.log("PIN confirmation successful:", response);
      toast.showToast(
        `Account setup complete! ${response?.data?.message}`,
        "success",
      );

      // Navigate to login screen after successful PIN confirmation
      setTimeout(() => {
        router.replace(paths.auth.login);
      }, 1000);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof VerifyPinFormData, string>> =
          {};
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            const fieldName = err.path[0] as keyof VerifyPinFormData;
            fieldErrors[fieldName] = err.message;
            toast.showToast(err.message, "error");
          }
        });
        setErrors(fieldErrors);

        console.log("Validation errors:", fieldErrors);
      } else {
        console.error("API error ❌:", error);

        toast.showToast(
          error?.data?.message || "PIN confirmation failed",
          "error",
        );
      }
    }
  };

  const isFormValid = formData.confirmPin.length === 4 && !errors.confirmPin;

  return (
    // <SafeAreaView className="flex-1 pt-[20px] bg-background-light dark:bg-background-dark">
    <ThemedView className="flex-1 px-[25px]" variant="background">
      <FormContainer>
        {/* Header Section */}
        <View className="mt-6">
          <ThemedText
            className="text-[22px] mb-3"
            variant="primary"
            family="primary"
            weight="semibold"
          >
            Re-Enter Pin
          </ThemedText>
          <ThemedText
            className="text-b2 mb-6"
            variant="secondary"
            family="primary"
            weight="regular"
          >
            Re-enter pin to confirm your pin.
          </ThemedText>
        </View>

        {/* Form Section */}
        {/* Confirm PIN Input */}
        <PasswordInput
          className="mb-3 w-full"
          label="Confirm 4 digit PIN"
          placeholder="Re-enter your PIN"
          value={formData.confirmPin.slice(0, 4)}
          onChangeText={(text) => handleInputChange("confirmPin", text)}
          error={errors.confirmPin}
          keyboardType="numeric"
          // maxLength={4}
          // secureTextEntry={true}
        />

        {/* Confirm PIN Button */}
        <Button
          className="w-full my-3 py-[12px]"
          variant="primary"
          onPress={handleVerifyPin}
          disabled={isLoading || !isFormValid}
          loading={isLoading}
        >
          {"Confirm PIN"}
        </Button>

        {/* Back to Create PIN */}
        {/* <View className="flex-row items-center mb-10 justify-center gap-1">
            <ThemedText
              variant="secondary"
              family="primary"
              weight="medium"
              className="text-b2 py-4 text-center"
            >
              Need to change your PIN?{" "}
            </ThemedText>
            <ThemedLink
              variant="accent"
              weight="bold"
              className="text-primary-500 underline"
              onPress={handleGoBack}
            >
              Go Back
            </ThemedLink>
          </View> */}
      </FormContainer>
    </ThemedView>
    // {/* </SafeAreaView> */}
  );
};

export default VerifyCreatePin;
