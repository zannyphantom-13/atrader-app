import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { icons } from "@/constant/icon";

import { useGetDetailTransactionMutation } from "@/redux/transaction/transaction_history";
import { formatNumber } from "@/utils/formatamount";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SellGiftCardsStatus = () => {
  const [tradeStatus, setTradeStatus] = React.useState("success"); // Example state for trade status

  const params = useLocalSearchParams();
  const [data, setData] = React.useState<any>(null);
  const router = useRouter();
  const [getDetailTransaction, { isLoading }] =
    useGetDetailTransactionMutation();

  const handleGetDetailTransaction = async () => {
    try {
      const response: any = await getDetailTransaction({
        data: {
          transid: params?.transId,
        },
      }).unwrap();
      if (response.status === "success") {
        setData(response);
        setTradeStatus(
          response?.giftcard?.plan_status === 0
            ? "pending"
            : response?.giftcard?.plan_status === 1
              ? "success"
              : "failed"
        );
        console.log("Transaction Details:", response);
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


  const handleSupportPress = (transId: string, type: string) => {
    const category = data?.giftcard?.category;
    // Navigate to Firebase trade chat
    router.push({ pathname: '/(protected)/(features)/trade-chat' as any, params: { tradeId: transId, cardName: category || 'Gift Card', cardCategory: category || '', type: 'existing' } });
  }

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
            {tradeStatus === "pending" && <icons.pending />}
            {tradeStatus === "success" && <icons.success />}
            {tradeStatus === "failed" && <icons.rejected />}

            <ThemedText className="text-h7 pt-4 " weight="bold">
              Trade{" "}
              {tradeStatus === "success"
                ? "Successful"
                : tradeStatus === "pending"
                  ? "Pending"
                  : "Rejected"}
            </ThemedText>
            <ThemedText className="text-b2  pt-2" weight="medium">
              Your Gift card status{" "}
              {tradeStatus === "success"
                ? "is successfull"
                : tradeStatus === "pending"
                  ? "is pending"
                  : "was rejected"}
            </ThemedText>
          </View>

          {/* divided */}
          <View className="border-b p-2 border-light-200 dark:border-dark-600 mt-2" />

          {/* first section */}
          <View className="pt-3 px-2">
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

            <View className="flex-row pt-4 items-center justify-between">
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
            </View>

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
                Type
              </ThemedText>
              <ThemedText
                className="text-b2 text-text-primary-light dark:text-text-primary-dark"
                weight="medium"
                variant="primary"
              >
                {data?.giftcard?.physical_ecode}
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

            {tradeStatus === "success" && (
              <>
                <View className="flex-row pt-8 items-center justify-between">
                  <ThemedText
                    className="text-b3  text-text-primary-light dark:text-text-primary-dark"
                    weight="medium"
                    variant="secondary"
                  >
                    {" "}
                    Trade ID
                  </ThemedText>
                  <ThemedText
                    className="text-b2 text-text-primary-light dark:text-text-primary-dark"
                    weight="medium"
                    variant="primary"
                  >
                    ₦{data?.giftcard?.transid}
                  </ThemedText>
                </View>

                <View className="flex-row pt-4 items-center justify-between">
                  <ThemedText
                    className="text-b3  text-text-primary-light dark:text-text-primary-dark"
                    weight="medium"
                    variant="secondary"
                  >
                    {" "}
                    Date & Time
                  </ThemedText>
                  <ThemedText
                    className="text-b2 text-text-primary-light dark:text-text-primary-dark"
                    weight="medium"
                    variant="primary"
                  >
                    {data?.giftcard?.created_at.split(" ")[0]}{" "}
                  </ThemedText>
                </View>
              </>
            )}
          </View>

          {/* divided */}
          <View className="border-b p-2 border-light-200 dark:border-dark-600 my-4" />

          {/* second section */}
          <View className=" px-2 items-center justify-between flex-row ">
            <ThemedText
              className="text-b2 text-center "
              weight="medium"
              variant="secondary"
            >
              Trade status
            </ThemedText>

            <ThemedText
              className={`text-b1 text-center py-1 rounded-full px-4 bg-[#F0A206] ${tradeStatus === "pending" ? "bg-[#F0A206]" : tradeStatus === "success" ? "bg-[#006E53]" : "bg-[#FF3A3A]"} `}
              weight="bold"
              variant="primary"
            >
              {tradeStatus.charAt(0).toUpperCase() + tradeStatus.slice(1)}
            </ThemedText>
          </View>

          {/* divided */}
          <View className="border-b p-2 border-light-200 dark:border-dark-600 my-4" />

          {/* third section */}
          <View className=" px-2 items-start justify-start pt-3 flex-col  ">
            {tradeStatus === "pending" && (
              <>
                <ThemedText
                  className="text-b2 text-center "
                  weight="medium"
                  variant="secondary"
                >
                  Trade note
                </ThemedText>

                <ThemedText
                  className="text-b2 text-start pt-2 "
                  weight="bold"
                  variant="primary"
                >
                  {data?.giftcard?.comment_ecode ||
                    "Your gift card is being reviewed"}
                </ThemedText>
              </>
            )}

            {tradeStatus === "success" && (
              <>
                <ThemedText
                  className="text-b2 text-center "
                  weight="medium"
                  variant="secondary"
                >
                  From AT_Exchange
                </ThemedText>

                <ThemedText
                  className="text-b2 text-start pt-2 "
                  weight="bold"
                  variant="primary"
                >
                  Thank for trading. Your gift card equivalent amount has been
                  added to your wallet balance
                </ThemedText>
              </>
            )}

            {tradeStatus === "failed" && (
              <>
                <ThemedText
                  className="text-b2 text-center "
                  weight="medium"
                  variant="secondary"
                >
                  From AT_Exchange
                </ThemedText>

                <ThemedText
                  className="text-b2 text-start pt-2 "
                  weight="bold"
                  variant="primary"
                >
                  {data?.giftcard?.reject_reason ||
                    "Your gift card trade was rejected. Contact support for more info"}
                </ThemedText>
              </>
            )}
          </View>

          {/* uploaded images */}

          <View>
            {data?.images && data?.images.length > 0 && (
              <>
                <ThemedText
                  className="text-b2 text-left pt-4 "
                  weight="medium"
                  variant="secondary"
                >
                  Uploaded images ({data?.images.length})
                </ThemedText>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="pt-4 px-2"
                  contentContainerStyle={{
                    gap: 10,
                  }}
                >
                  {data?.images.map((img: any, index: number) => (
                    <View
                      key={index}
                      className="w-32 h-20 rounded-lg overflow-hidden"
                    >
                      <Image
                        source={{ uri: img?.image }}
                        alt={`Uploaded ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </ScrollView>

        {/*  */}
        <View className="flex-row w-full items-center justify-center gap-4 mt-6">
          <Button
            variant="primary"
            className="bg-primary-500 flex-1  rounded-2xl py-4 mt-1"
            onPress={() => {
              handleSupportPress(params?.transId as string, "giftcard");
            }}
          >
            <ThemedText
              className="text-white text-center text-b1"
              weight="bold"
            >
              Contact Support
            </ThemedText>
          </Button>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};

export default SellGiftCardsStatus;
