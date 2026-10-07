import { SettingsHeader } from "@/components/customs/settingsHeader";
import BankModal from "@/components/modals/banksmodal";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import {
  useGetAccountNameMutation,
  useSaveBanksMutation,
} from "@/redux/settings/settings";
import { getFirstChar } from "@/utils/bills";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useRouter } from "expo-router";
import { ChevronDown } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const AddBank = () => {
  const { isDark } = useTheme();
  const [showBanks, setShowBanks] = React.useState(false);
  const [formData, setFormData] = React.useState({
    accountNumber: "",
    accountName: "",
    bankName: "",
    bankCode: "",
    bankUrl: "",
  });
  const toast = useToast();
  const router = useRouter();
  const [saveBanks, { isLoading }] = useSaveBanksMutation();
  // const { atex } = useAuthToken();

  const [getAccountName, { isLoading: isGettingBankName }] =
    useGetAccountNameMutation();

  const handleGlobalChange = (value: any) => {
    if (formData?.bankName !== value?.bankname) {
      setFormData((prev) => ({
        ...prev,
        bankName: value?.bankname || "",
        bankCode: value?.bankcode || "",
        bankUrl: value?.bankurl || "",
      }));
    }
  };
  console.log("Form Data:", formData);

  React.useEffect(() => {
    const fetchBankName = async () => {
      const atex = await TokenManager.getToken();
      if (formData?.accountNumber.length === 10) {
        try {
          const response: any = await getAccountName({
            data: {
              token: atex,
              bankCode: formData?.bankCode,
              bankName: formData?.bankName,
              account_number: formData?.accountNumber,
            },
          }).unwrap();

          if (response?.status === "success") {
            setFormData((prev) => ({
              ...prev,
              accountName:
                response?.data?.account_name || response?.account_name || "",
            }));
          } else {
            toast.showToast(
              `${response?.message || "Failed to fetch account name"}`,
              "error",
            );
          }
        } catch (error) {
          toast.showToast("Error fetching account name", "error");
          console.error("Error fetching account name:", error);
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          accountName: "",
        }));
      }
    };

    fetchBankName();
  }, [formData?.accountNumber, formData?.bankCode]);

  const SaveSubmit = async () => {
    try {
      const atex = await TokenManager.getToken();
      const response: any = await saveBanks({
        data: {
          token: atex,
          bank_name: formData?.bankName,
          account_number: formData?.accountNumber,
          account_name: formData?.accountName,
          bank_code: formData?.bankCode,
        },
      }).unwrap();

      if (response?.status === "success") {
        toast.showToast(
          `${response.message || "Bank saved successfully"}`,
          "success",
        );
        setFormData({
          accountNumber: "",
          accountName: "",
          bankName: "",
          bankCode: "",
          bankUrl: "",
        });

        router.back();
      }
    } catch (error: any) {
      toast.showToast(
        `${error?.data?.message || error?.message || "Unknown error occurred"}`,
        "error",
      );
      console.error("Failed to save bank:", error);
    }
  };

  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Add Bank" />
      <View className="flex-1 px-[24px] py-4">
        {/* Top Content - Takes available space */}
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
          accessible={false}
        >
          <View className="flex-1">
            <View className="flex-1">
              <ThemedText
                className="text-b2 pl-1 font-bold mb-4"
                variant="primary"
              >
                Choose your bank
              </ThemedText>

              <Pressable
                className="border border-border-light dark:border-border-dark flex-row justify-between items-center rounded-[30px] p-3 mb-4 bg-[#F9F9F9] dark:bg-[#111111]"
                onPress={() => setShowBanks(true)}
              >
                <View className="flex-row items-center gap-2">
                  {formData.bankUrl ? (
                    <Image
                      source={{
                        uri: formData.bankUrl.startsWith("http")
                          ? formData.bankUrl
                          : ``,
                      }}
                      style={{ width: 32, height: 32 }}
                      className="rounded-full"
                    />
                  ) : (
                    <ThemedText className="bg-white dark:bg-dark-500 w-8 h-8 text-center leading-8 rounded-full text-xs">
                      {getFirstChar(formData.bankName || "B")}
                    </ThemedText>
                  )}

                  <ThemedText
                    family="primary"
                    variant="primary"
                    weight="medium"
                    className="text-b2  text-center"
                  >
                    {formData.bankName ? formData.bankName : "Select Bank"}
                  </ThemedText>
                </View>

                <ChevronDown
                  width={20}
                  height={20}
                  color={isDark ? "white" : "black"}
                />
              </Pressable>

              <Input
                label="Account number"
                placeholder="Enter 10 digit number"
                className="w-full mb-4"
                keyboardType="numeric"
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, accountNumber: text }))
                }
                value={formData.accountNumber}
              />

              <Input
                label="Account name"
                placeholder="Enter account name"
                className="w-full mb-4"
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, accountName: text }))
                }
                value={formData.accountName}
                trailingIcon={
                  isGettingBankName ? (
                    <ActivityIndicator
                      size="small"
                      color={isDark ? "white" : "black"}
                    />
                  ) : undefined
                }
              />
            </View>

            {/* Bottom Button - Fixed at bottom */}
            <View className="pb-6">
              <Button
                className="w-full"
                onPress={() => {
                  SaveSubmit();
                }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  "Add Bank Account"
                )}
              </Button>
            </View>
          </View>
        </TouchableWithoutFeedback>

        {showBanks && (
          <>
            <BankModal
              visible={showBanks}
              setVisible={setShowBanks}
              formData={formData}
              handleChangeBankInfo={handleGlobalChange}
            />
          </>
        )}
      </View>
    </ThemedView>
  );
};

export default AddBank;
