import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import useAuthToken from "@/hooks/useToken";
import { useGetAllTypeDetailTransactionMutation } from "@/redux/transaction/transaction_history";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import { formatNumber } from "@/utils/formatamount";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Copy } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const Billsreceipt = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [data, setData] = React.useState<any>(null);
  const [getAllTypeDetailTransaction, { isLoading }] =
    useGetAllTypeDetailTransactionMutation();
  const toast = useToast();
  const { type, transId } = params;
  const { isDark } = useTheme();
  // const { atex } = useAppSelector((state) => state.session);
  // const { atex } = useAuthToken();

  // console.log("Params:", params);

  const handleGetDetailTransaction = async () => {
    try {
      const atex = await TokenManager.getToken();
      const response: any = await getAllTypeDetailTransaction({
        data: {
          token: atex,
          transid: transId,
          role: type,
        },
      }).unwrap();
      if (response.status === "success") {
        setData(response?.transaction);
        console.log("Transaction Details:", response);
      } else {
        // Alert.alert("Error", "Failed to fetch transaction details");
        console.error("Failed to fetch transaction details:", response);
      }
    } catch (error: any) {
      toast.showToast(
        `${error?.data?.message || error?.message || ""}`,
        "error",
      );
      console.error("Error fetching transaction details:", error);
    }
  };

  React.useEffect(() => {
    if (transId) {
      handleGetDetailTransaction();
    }
  }, [transId, type]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      toast.showToast(`${label} copied to clipboard`, "success");
    } catch (error: any) {
      toast.showToast("Failed to copy", "error");
    }
  };

  return (
    <>
      <ThemedView className="flex-1 pt-5 px-[20px] ">
        <SafeAreaView
          className="flex-1"
          edges={["bottom", "top"]}
          style={{
            paddingBottom: 20,
            paddingTop: 60,
          }}
        >
          {/* {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator
                size="large"
                color={isDark ? "#FFFFFF" : "#000000"}
              />
            </View>
          ) : ( */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingBottom: 30,
            }}
          >
            {/* bill type receipt */}
            {type === "bill" && (
              <>
                <View className=" items-center justify-center">
                  <icons.tick />
                  <ThemedText className="text-h4 pt-4  " weight="bold">
                    ₦{formatNumber(Number(data?.amount))}
                  </ThemedText>
                  <ThemedText className="text-b2  pt-2" weight="medium">
                    Bill Paid
                  </ThemedText>
                </View>

                <View className="py-4 px-2 items-center justify-center  flex  mt-6 rounded-lg bg-light-150 dark:bg-dark-700">
                  <ThemedText
                    className="text-b2 text-center leading-tight "
                    weight="medium"
                    variant="secondary"
                  >
                    Your payment has been sent to {data?.disco_name} for meter
                    number {data?.meter_number} | {data?.customer_name}.
                  </ThemedText>
                </View>

                {/* token to be copied  */}
                <View className="py-4 px-2 flex justify-center items-center  mt-6 rounded-lg bg-light-150 dark:bg-dark-700">
                  <View className="flex-row items-center gap-2">
                    <ThemedText
                      className="text-b2 text-text-primary-light dark:text-text-primary-dark"
                      weight="medium"
                      variant="primary"
                    >
                      {data?.token || "N/A"}
                    </ThemedText>
                    <Pressable
                      onPress={() => copyToClipboard(data?.token, "Token")}
                      className="p-1"
                    >
                      <Copy size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                    </Pressable>
                  </View>
                </View>
              </>
            )}

            {/* 
             data type receipt
          */}
            {type === "data" && (
              <>
                <View className=" items-center justify-center">
                  <icons.tick />
                  <ThemedText className="text-h4 pt-4  " weight="bold">
                    ₦{formatNumber(Number(data?.amount))}
                  </ThemedText>
                  <ThemedText className="text-b2  pt-2" weight="medium">
                    Data Purchased
                  </ThemedText>
                </View>

                <View className="py-4 px-2 items-center justify-center  flex  mt-6 rounded-lg bg-light-150 dark:bg-dark-700">
                  <ThemedText
                    className="text-b2 text-center "
                    weight="medium"
                    variant="secondary"
                  >
                    Your {data?.plan_name} data purchase to {data?.plan_phone}{" "}
                    on {data?.network} is successful.
                  </ThemedText>
                </View>
              </>
            )}

            {/* cable type receipt */}
            {type === "cable" && (
              <>
                <View className=" items-center justify-center">
                  <icons.tick />
                  <ThemedText className="text-h4 pt-4  " weight="bold">
                    ₦{formatNumber(Number(data?.amount))}
                  </ThemedText>
                  <ThemedText className="text-b1  py-4" weight="medium">
                    Cable Paid
                  </ThemedText>
                </View>

                <View className="py-4 px-2 items-center justify-center  flex  mt-6 rounded-lg bg-light-150 dark:bg-dark-700">
                  <ThemedText
                    className="text-b2 text-center leading-tight "
                    weight="medium"
                    variant="secondary"
                  >
                    Your payment has been sent to {data?.cable_name} for meter
                    number {data?.iuc} | {data?.customer_name}.
                  </ThemedText>
                </View>
              </>
            )}

            {/* airtime type receipt */}
            {type === "airtime" && (
              <>
                <View className=" items-center justify-center">
                  <icons.tick />
                  <ThemedText className="text-h4 pt-4  " weight="bold">
                    ₦{formatNumber(Number(data?.amount))}
                  </ThemedText>
                  <ThemedText className="text-b2  pt-2" weight="medium">
                    Airtime Purchased
                  </ThemedText>
                </View>

                <View className="py-4 px-2 items-center justify-center  flex  mt-6 rounded-lg bg-light-150 dark:bg-dark-700">
                  <ThemedText
                    className="text-b2 text-center "
                    weight="medium"
                    variant="secondary"
                  >
                    Your Airtime purchase to {data?.plan_phone} on{" "}
                    {data?.network} is successful.
                  </ThemedText>
                </View>
              </>
            )}

            {type === "withdrawal" && (
              <>
                <View className=" items-center justify-center">
                  <icons.tick />
                  <ThemedText className="text-h4 pt-4  " weight="bold">
                    ₦{formatNumber(Number(data?.amount))}
                  </ThemedText>
                  <ThemedText className="text-b2  pt-2" weight="medium">
                    Payment Sent
                  </ThemedText>
                </View>

                <View className="py-4 px-2 items-center justify-center  flex  mt-6 rounded-lg bg-light-150 dark:bg-dark-700">
                  <ThemedText
                    className="text-b2 text-center "
                    weight="medium"
                    variant="secondary"
                  >
                    Your Payment has been sent to {data?.bank_name} |{" "}
                    {data?.account_number} | {data?.account_name}.
                  </ThemedText>
                </View>
              </>
            )}

            {/* betting type receipt */}
            {type === "betting" && (
              <>
                <View className=" items-center justify-center">
                  <icons.tick />
                  <ThemedText className="text-h4 pt-4  " weight="bold">
                    ₦{formatNumber(Number(data?.amount))}
                  </ThemedText>
                  <ThemedText className="text-b2  pt-2" weight="medium">
                    Betting Payment Successful
                  </ThemedText>
                </View>

                <View className="py-4 px-2 items-center justify-center  flex  mt-6 rounded-lg bg-light-150 dark:bg-dark-700">
                  <ThemedText
                    className="text-b2 text-center "
                    weight="medium"
                    variant="secondary"
                  >
                    Your Betting payment to {data?.billername} is successful.
                  </ThemedText>
                </View>
              </>
            )}
          </ScrollView>
          {/* )} */}

          {!isLoading && (
            <View className="flex-row w-full items-center justify-center gap-4 mt-6">
              {/* <Button
            className="border-primary-500 flex-1  border-[1px] rounded-2xl py-4 mt-6"
            onPress={() => {
              router.push({
                pathname: paths.giftcards.sellgiftcardstatus,
                params: {
                  transId: params?.transId,
                },
              });
            }}
            variant="outline"
          >
            <ThemedText
              className="!text-primary-500 text-center text-b1"
              weight="bold"
            >
              Check Status
            </ThemedText>
          </Button> */}

              <Button
                variant="primary"
                className="bg-primary-500 flex-1  rounded-2xl py-4 mt-6"
                onPress={() => {
                  // Navigate to the next screen or perform an action
                  router.push(paths.tabs.home);
                }}
              >
                <ThemedText
                  className="text-white text-center text-b1"
                  weight="bold"
                >
                  Back Home
                </ThemedText>
              </Button>
            </View>
          )}
        </SafeAreaView>
      </ThemedView>
      <Modal
        visible={isLoading}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View className="flex-1 bg-black/70 justify-center items-center">
          <View className="bg-white dark:bg-dark-700 p-6 rounded-xl items-center mx-4">
            <ActivityIndicator
              size="large"
              color={colorThemes[app_config.theme][500]}
            />
            <ThemedText className="mt-4 text-b2">
              Processing your purchase...
            </ThemedText>
            <ThemedText className="mt-2 text-b3 text-center text-gray-500">
              Please wait, do not leave this screen
            </ThemedText>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Billsreceipt;
