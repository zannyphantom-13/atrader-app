import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { FormContainer, PasswordInput } from "@/components/ui/form-fields";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

const Newpin = () => {
  const [formData, setFormData] = React.useState({
    password: "",
    confirmPassword: "",
    oldPassword: "",
  });
  const [error, setError] = React.useState<any>({
    password: "",
    confirmPassword: "",
    oldPassword: "",
  });
  const [loading, setLoading] = React.useState(false);

  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="New PIN" />
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
              Enter the 4 digit transaction PIN
            </ThemedText>
          </View>

          <FormContainer className="px-[24px] pt-4">
            {/*  form seciton */}

            {/* pin inout */}
            <PasswordInput
              className="mb-5 w-full"
              label="New PIN"
              placeholder="Enter new PIN"
              value={formData.password}
            // onChangeText={(text) => setFormData({ ...formData, name: text })}
            // error={error?.name}
            />

            {/* pin inout */}
            <PasswordInput
              className="mb-5 w-full"
              label="Re-enter new PIN"
              placeholder="re-enter new PIN"
              value={formData.password}
            // onChangeText={(text) => setFormData({ ...formData, name: text })}
            // error={error?.name}
            />
          </FormContainer>
        </ScrollView>
        <View className="px-[24px] pb-6">
          <Button
            className="w-full my-3 py-[12px] "
            variant="primary"
            onPress={() => console.log("Sign Up Pressed")}
            disabled={loading}
            loading={loading}
          >
            {"Change PIN"}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default Newpin;
