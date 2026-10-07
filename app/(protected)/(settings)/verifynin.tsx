import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { useToast } from "@/context/ToastProvider";
import { setNin } from "@/redux/kyc/kycSlice";
import { useAppDispatch } from "@/redux/store";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import { paths } from "@/utils/paths";
import { useRouter } from "expo-router";
import { ShieldUser } from "lucide-react-native";
import React from "react";
import { View } from "react-native";

const VerifyNin = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [ninValue, setNinValue] = React.useState("");

  const handleVerify = () => {
    if (ninValue.length !== 11) {
      toast.showToast("NIN must be exactly 11 digits", "error");
      return;
    }
    dispatch(setNin(ninValue));
    router.push(paths.setting.faceVerification);
  };

  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Verify NIN" />
      <View className="flex-1 px-6">
        <View className="flex-row justify-between items-center mt-4">
          <ThemedText
            variant="secondary"
            className="text-[15px] font-regular ">Submit your correct NIN to verify this account.</ThemedText>
        </View>
        <View
          className="bg-[#F2F2F2] dark:bg-[#111111] border-[#F2F2F2] dark:border-[#232323] border-[1px] p-2 rounded-[30px] mt-5 mb-6 "
        >
          <View className="">
            <Input
              value={ninValue}
              onChangeText={setNinValue}
              leadingIconActive={true}
              showLeadingIcon={true}
              leadingIcon={<ShieldUser width={24} height={24} color={colorThemes[app_config.theme][500]} />}
              placeholder="Please enter 11 digit NIN number"
              keyboardType="numeric"
              className="mr-8 bg-white dark:bg-[#0C0C0C]"
            />
          </View>

          <Button
            onPress={handleVerify}
            className="rounded-2xl py-3 items-center mt-2"
          >
            <ThemedText className="text-white font-bold text-lg">
              Verify
            </ThemedText>
          </Button>
        </View>
      </View>
    </ThemedView>
  );
};

export default VerifyNin;
