import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { FormContainer, PasswordInput } from "@/components/ui/form-fields";
import { images } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useCreateUserPinMutation } from "@/redux/auth/auth_api";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { z } from "zod";

type CreatePinFormData = z.infer<typeof createPinSchema>;

const createPinSchema = z.object({
  pin: z
    .string()
    .min(4, "PIN must be 4 digits")
    .max(4, "PIN must be 4 digits")
    .regex(/^\d{4}$/, "PIN must contain only numbers")
    .refine((val) => {
      // Check for sequential numbers (1234, 2345, etc.)
      const sequential = /^(?:0123|15678|6789)$/.test(val);
      if (sequential) return false;

      // Check for repeated numbers (1111, 2222, etc.)
      const repeated = /^(\d)\1{3}$/.test(val);
      if (repeated) return false;

      return true;
    }, "PIN cannot be sequential numbers or all the same digit"),
});

const CreatePin = () => {
  const router = useRouter();
  const toast = useToast();
  const [formData, setFormData] = useState({
    pin: "",
  });
  const [createUserPin, { isLoading }] = useCreateUserPinMutation();
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreatePinFormData, string>>
  >({});

  // Validate individual field
  const validateField = (field: keyof CreatePinFormData, value: any) => {
    try {
      const fieldSchema = createPinSchema.shape[field];
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
  const handleInputChange = (field: keyof CreatePinFormData, value: string) => {
    // Only allow numeric input and limit to 4 characters
    const numericValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    setFormData((prev) => ({ ...prev, [field]: numericValue }));
    // Validate field on change
    validateField(field, numericValue);
  };

  const handleCreatePin = async () => {
    try {
      const atex = await TokenManager.getToken();

      setErrors({});

      // Validate entire form
      const validatedData = createPinSchema.parse(formData);

      // If validation passes, proceed with PIN creation
      console.log("PIN data is valid:", validatedData);

      const response = await createUserPin({
        data: {
          token: atex,
          pin: validatedData.pin,
        },
      }).unwrap();

      console.log("PIN creation successful:", response);
      toast.showToast(
        `PIN created successfully! ${response?.message || response?.data?.message}`,
        "success",
      );

      // Navigate to PIN confirmation screen
      setTimeout(() => {
        router.push(paths.auth.verifyCreatePin);
      }, 1000);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof CreatePinFormData, string>> =
          {};
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            const fieldName = err.path[0] as keyof CreatePinFormData;
            fieldErrors[fieldName] = err.message;
            toast.showToast(err.message, "error");
          }
        });
        setErrors(fieldErrors);

        console.log("Validation errors:", fieldErrors);
      } else {
        console.error("API error ❌:", error);
        toast.showToast(error?.data?.message || "PIN creation failed", "error");
      }
    }
  };

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
            Almost there! Create Your Pin
          </ThemedText>
          <ThemedText
            className="text-b2 mb-6"
            variant="secondary"
            family="primary"
            weight="regular"
          >
            Set a 4 digit PIN for your account security
          </ThemedText>
        </View>

        {/* Form Section */}
        {/* PIN Input */}
        <PasswordInput
          className="mb-3 w-full"
          label="4 digit PIN"
          placeholder="Enter 4-digit PIN"
          value={formData.pin}
          onChangeText={(text) => handleInputChange("pin", text)}
          error={errors.pin}
          keyboardType="numeric"
        // maxLength={4}
        // secureTextEntry={true}
        />

        {/* Security Notice */}
        {/*
            <View className="mb-4">
              <ThemedText
                className="text-b3 text-center"
                variant="secondary"
                family="primary"
                weight="medium"
              >
                Choose a PIN {"that's"} easy to remember but hard to guess.
                Avoid sequential numbers (1234) or repeated digits (1111).
              </ThemedText>
            </View>
           */}

        {/* Create PIN Button */}
        <Button
          className="w-full my-3 py-[12px]"
          variant="primary"
          onPress={handleCreatePin}
          disabled={isLoading || formData.pin.length !== 4}
          // onPress={() => {
          //   router.push(paths.auth.verifyCreatePin);}
          // }
          // disabled={isLoading || formData.pin.length !== 4}
          loading={isLoading}
        >
          {"Create PIN"}
        </Button>
      </FormContainer>
    </ThemedView>
    // </SafeAreaView>
  );
};

export default CreatePin;
