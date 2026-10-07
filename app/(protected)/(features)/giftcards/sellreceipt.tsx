import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { icons } from "@/constant/icon";
import { useGetDetailTransactionMutation } from "@/redux/transaction/transaction_history";
import { formatNumber } from "@/utils/formatamount";
import { paths } from "@/utils/paths";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SellGiftCardsreceipt = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [data, setData] = React.useState<any>(null);
  const [getDetailTransaction, { isLoading }] =
    useGetDetailTransactionMutation();

  console.log("Params:", params);

  const handleGetDetailTransaction = async () => {
    try {
      const response: any = await getDetailTransaction({
        data: {
          transid: params?.transId,
        },
      }).unwrap();
      if (response.status === "success") {
        setData(response);
        console.log("Transaction Details:", response.data);
      } else {
        Alert.alert("Error", "Failed to fetch transaction details");
        console.error("Failed to fetch transaction details:", response);
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error);
    }
  };

  React.useEffect(() => {
    if (params?.transId) {
      handleGetDetailTransaction();
    }
  }, [params?.transId]);

  return (
    <ThemedView className="flex-1 pt-5 px-[20px] ">
      <SafeAreaView
        className="flex-1"
        edges={["bottom"]}
        style={{
          paddingBottom: 20,
        }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: 30,
          }}
        >
          <View className=" items-center justify-center">
            <icons.happy />
            <ThemedText className="text-h7 pt-4 " weight="bold">
              Happy Trade
            </ThemedText>
            <ThemedText className="text-b2  pt-2" weight="medium">
              Your Gift card has been submitted for trade
            </ThemedText>
          </View>

          <View className="py-4 px-2 items-center justify-center  flex  mt-6 rounded-lg bg-light-150 dark:bg-dark-700">
            <ThemedText
              className="text-b2 text-center "
              weight="medium"
              variant="secondary"
            >
              Keep an eye out for our notification once your payment is
              complete.
            </ThemedText>
          </View>

          <View className="py-4 px-2   mt-6 rounded-lg bg-light-150 dark:bg-dark-700">
            <View className="flex-row pt-4 items-center justify-between">
              <ThemedText
                className="text-b3  text-text-primary-light dark:text-text-primary-dark"
                weight="medium"
                variant="secondary"
              >
                {" "}
                Card name
              </ThemedText>
              <ThemedText
                className="text-b2 text-text-primary-light dark:text-text-primary-dark"
                weight="medium"
                variant="primary"
              >
                {data?.giftcard?.subcategory}
              </ThemedText>
            </View>

            {/* <View className="flex-row pt-4 items-center justify-between">
              <ThemedText
                className="text-b3  text-text-primary-light dark:text-text-primary-dark"
                weight="medium"
                variant="secondary"
              >
                {" "}
                Value
              </ThemedText>
              <ThemedText
                className="text-b2 text-text-primary-light dark:text-text-primary-dark"
                weight="medium"
                variant="primary"
              >
                ${data?.giftcard?.total_amount}
              </ThemedText>
            </View> */}

            <View className="flex-row pt-4 items-center justify-between">
              <ThemedText
                className="text-b3  text-text-primary-light dark:text-text-primary-dark"
                weight="medium"
                variant="secondary"
              >
                {" "}
                At rate of
              </ThemedText>
              <ThemedText
                className="text-b2 text-text-primary-light dark:text-text-primary-dark"
                weight="medium"
                variant="primary"
              >
                ₦{data?.giftcard?.rate} / ${data?.giftcard?.total_amount}
              </ThemedText>
            </View>

            <View className="flex-row pt-4 items-center justify-between">
              <ThemedText
                className="text-b3  text-text-primary-light dark:text-text-primary-dark"
                weight="medium"
                variant="secondary"
              >
                {" "}
                You’ll receive total of
              </ThemedText>
              <ThemedText
                className="text-b2 text-text-primary-light dark:text-text-primary-dark"
                weight="medium"
                variant="primary"
              >
                ₦{formatNumber(Number(data?.giftcard?.estimated)) || "0.00"}
              </ThemedText>
            </View>
          </View>
        </ScrollView>

        <View className="flex-row w-full items-center justify-center gap-4 mt-6">
          <Button
            className="border-primary-500 flex-1  border-[1px] rounded-2xl py-4 mt-6"
            onPress={() => {
              router.push({
                pathname: paths.giftcards.sellgiftcardstatus,
                params: {
                  transId: params?.transId,
                  type: "giftcard",
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
          </Button>

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
      </SafeAreaView>
    </ThemedView>
  );
};

export default SellGiftCardsreceipt;
