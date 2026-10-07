import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";

const VerificationCode = () => {
  const [formData, setFormData] = React.useState({
    password: "",
    confirmPassword: "",
    oldPassword: "",
    otp: "",
  });
  const [error, setError] = React.useState<any>({
    otp: "",
  });
  const [loading, setLoading] = React.useState(false);

  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Verification Code" />
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
              Enter the 6 digit code sent to your email Hohrh@gmail.com to confirm your password change
            </ThemedText>
          </View>

          <View className="px-[24px] pt-4">
            {/* pin inout */}
            <View className="bg-white dark:bg-black p-[14px] rounded-[20px] border-[1px] dark:border-[#232323] border-[#EFEFEF] mb-5">
              <OtpInput
                length={6}
                value={formData.otp}
                onChangeText={(otp) => setFormData({ ...formData, otp })}
                error={error?.otp}
              />
            </View>

            <View className="flex-row items-center justify-center mb-3">
              <ThemedText
                className="text-b2 "
                variant="secondary"
                family="primary"
                weight="medium"
              >
                Didnt receive a code?{" "}
              </ThemedText>
              <Pressable
                onPress={() => console.log("Resend Code Pressed")}
                className="flex-row items-center justify-center"
              >
                <ThemedText
                  className="text-b3 !text-primary-500 underline"
                  variant="primary"
                  family="primary"
                  weight="medium"
                >
                  Resend Code
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
        <View className="px-[24px] pb-6">
          <Button
            className="w-full my-3 py-[12px] "
            variant="primary"
            onPress={() => console.log("Sign Up Pressed")}
            disabled={loading}
            loading={loading}
          >
            {"Continue"}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default VerificationCode;
