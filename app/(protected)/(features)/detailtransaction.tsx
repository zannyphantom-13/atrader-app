import { ServiceIcon } from "@/components/customs/serviceIcon";
import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { parseFlagAndName } from "@/utils/helper";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { icons } from "@/constant/icon";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { openChat } from "@/lib/zoho-service";
import { useGetAllTypeDetailTransactionMutation } from "@/redux/transaction/transaction_history";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";
import { formatNumber, getCurrencySymbol } from "@/utils/formatamount";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, Copy, } from "lucide-react-native";
import React from "react";
import { Alert, Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View, Platform, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SkeletonLoader = () => {
  return (
    <View className="flex-1 pt-5">
      <View className="items-center justify-center">
        <View className="w-20 h-20 rounded-full bg-light-200 dark:bg-dark-600" />
        <View className="w-32 h-8 mt-4 rounded-lg bg-light-200 dark:bg-dark-600" />
        <View className="w-48 h-6 mt-2 rounded-lg bg-light-200 dark:bg-dark-600" />
      </View>
      <View className="py-4 px-2 mt-6 rounded-lg bg-light-150 dark:bg-dark-700">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <View key={item} className="flex-row pt-4 items-center justify-between">
            <View className="w-24 h-4 rounded bg-light-200 dark:bg-dark-600" />
            <View className="w-32 h-4 rounded bg-light-200 dark:bg-dark-600" />
          </View>
        ))}
      </View>
      <View className="flex-row w-full items-center justify-center gap-4 mt-6">
        <View className="flex-1 h-14 rounded-2xl bg-light-200 dark:bg-dark-600" />
      </View>
    </View>
  );
};

interface InfoRowProps {
  label: string;
  value: any;
  secondaryValue?: string;
  isCopyable?: boolean;
  isImage?: boolean;
  isLast?: boolean;
  onCopy?: (text: string, label: string) => void;
  isDark: boolean;
  fullWidthValue?: boolean;
}

const InfoRow = ({ label, value, secondaryValue, isCopyable, isImage, isLast, onCopy, isDark, fullWidthValue }: InfoRowProps) => {
  if (value === undefined || value === null || value === "" || value === "N/A") return null;

  const isCountry = label === "Country" || label === "Sub Category";
  const { flag, name: parsedName } = isCountry ? parseFlagAndName(value) : { flag: "", name: "" };
  const displayValue = isCountry ? parsedName : (secondaryValue || value);

  return (
    <View className={`flex-row pt-4 ${fullWidthValue ? 'flex-col gap-3' : 'items-center justify-between'} ${isLast ? 'pb-4' : ''}`}>
      <ThemedText className="text-b3 text-text-primary-light dark:text-text-primary-dark" weight="medium" variant="secondary">
        {label}
      </ThemedText>

      {fullWidthValue ? (
        <ThemedText className="text-b2 text-text-primary-light dark:text-text-primary-dark" weight="medium" variant="primary">
          {value}
        </ThemedText>
      ) : (
        <View className="flex-row items-center gap-2">
          {isImage && <Image source={{ uri: value }} style={{ width: 40, height: 40 }} className="rounded-md" />}
          {flag ? <CountryFlag flag={flag} size={16} /> : null}
          {(secondaryValue || !isImage) && (
            <ThemedText className="text-b2 text-text-primary-light dark:text-text-primary-dark" weight="medium" variant="primary">
              {typeof displayValue === 'string' && displayValue.length > 20
                ? displayValue.slice(0, 10) + "..." + displayValue.slice(-8)
                : displayValue}
            </ThemedText>
          )}
          {isCopyable && (
            <Pressable onPress={() => onCopy && onCopy(value, label)} className="p-1">
              <Copy size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const AllDetailTransaction = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [tradeStatus, setTradeStatus] = React.useState("success");
  const [data, setData] = React.useState<any>(null);
  const [images, setImages] = React.useState<string[]>([]);
  const [adminImages, setAdminImages] = React.useState<string[]>([]);
  const [visibleImage, setVisibleImage] = React.useState(false);
  const [adminVisibleImage, setAdminVisibleImage] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [currentAdminImageIndex, setcurrentAdminImageIndex] = React.useState(0);
  const toast = useToast();
  const [getAllTypeDetailTransaction, { isLoading }] = useGetAllTypeDetailTransactionMutation();
  const { type, transId } = params as { type: string; transId: string };
  const { isDark } = useTheme();
  // console.log(type)
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.showToast(`${label} copied`, "success");
    } catch (error: any) {
      toast.showToast("Failed to copy", "error");
    }
  };

  console.log(data);

  const handleGetDetailTransaction = async () => {
    try {
      const atex = await TokenManager.getToken();
      const response: any = await getAllTypeDetailTransaction({
        data: {
          token: atex,
          transid: transId,
          role: type === "debit" || type === "credit" ? "deposit" : type,
        },
      }).unwrap();
      if (response.status === "success") {
        console.log(response);

        setData(response?.transaction);
        setImages(response?.images || []);
        setAdminImages(response?.admin_images || [])
        setTradeStatus(
          response?.transaction?.plan_status === 0
            ? "pending"
            : response?.transaction?.plan_status === 1
              ? "success"
              : "failed",
        );
      } else {
        Alert.alert("Error", "Failed to fetch transaction details");
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error);
    }
  };

  React.useEffect(() => {
    if (transId) handleGetDetailTransaction();
  }, [transId, type]);


  const navigateThem = async () => {
    if (tradeStatus === "success") {
      try {
        const nativeUrl = Platform.OS === "ios"
          ? `itms-apps://itunes.apple.com/app/id${app_config.appleAppId}?action=write-review`
          : `market://details?id=${app_config.androidPackageName}`;
        const webUrl = Platform.OS === "ios" ? app_config.appleReviewLink : app_config.playStoreReviewLink;

        try {
          const canOpen = await Linking.canOpenURL(nativeUrl);
          if (canOpen) {
            await Linking.openURL(nativeUrl);
          } else {
            await Linking.openURL(webUrl);
          }
        } catch {
          await Linking.openURL(webUrl);
        }
      } catch (err) {
        console.warn("Failed to open review url:", err);
      }
      router.push(paths.tabs.home);
    } else if (tradeStatus === "pending") {
      router.push(paths.tabs.home);
    } else {
      router.replace({ pathname: paths.more });
    }
  };


  // get network provider, giftcard category, cable provider, crypto network, 


  const renderTransType = () => {
    const bills = ["electricity", "cable", "data", "airtime", "betting", "bill"];
    const gift = ["giftcard", "Giftcard", "GIFTCARD"];
    const crypto = ["crypto", "Crypto", "CRYPTO"];
    const withdrawal = ["withdrawal", "Withdrawal", "WITHDRAWAL"];
    if (type === "debit" || type === "credit") {
      return "Deposit";
    }
    if (gift.includes(type)) {
      return data?.category;
    }
    if (bills.includes(type)) {
      return data?.network;
    }
    if (crypto.includes(type)) {
      return data?.crypto_network;
    }
    if (withdrawal.includes(type)) {
      return data?.withdrawal_type;
    }
    return type.toUpperCase();
  };

  const renderTypeIconOrImage = () => {
    return (
      <ServiceIcon
        role={type}
        name={data?.network || data?.category || data?.withdrawal_type || data?.disco_name}
        image={data?.image}
        size={30}
      />
    );
  };

  const getTransactionFields = () => {
    if (!data) return [];

    const commonBefore = [
      { label: "Date", value: data?.plan_date || data?.date },
    ];
    const commonAfter = [
      { label: "Transaction ID", value: data?.transid, isCopyable: true },
      { label: "Old Balance", value: `₦${formatNumber(data?.oldbal || data?.old_bal)}` },
      { label: "New Balance", value: `₦${formatNumber(data?.newbal || data?.new_bal)}` },
    ];

    switch (type) {
      case "bill":
        return [
          { label: "Disco name", value: data?.disco_name },
          ...(data?.plan_status === 1 ? [{ label: "Token", value: data?.token, isCopyable: true }] : []),
          { label: "Meter type", value: data?.meter_type },
          { label: "Meter Number", value: data?.meter_number, isCopyable: true },
          { label: "Customer Name", value: data?.customer_name },
          ...commonBefore,
          ...commonAfter,
          { label: "Bill Type", value: type.toUpperCase() },
        ];
      case "data":
        return [
          { label: "Network", value: data?.network },
          { label: "Plan", value: data?.plan_name },
          { label: "Phone", value: data?.plan_phone },
          ...commonBefore,
          ...commonAfter,
          { label: "Bill Type", value: type.toUpperCase() },
        ];
      case "cable":
        return [
          { label: "Network", value: data?.cable_name },
          { label: "Plan", value: data?.cable_plan },
          { label: "Customer ID", value: data?.customer_name },
          { label: "Cable Number", value: data?.iuc, isCopyable: true },
          ...commonBefore,
          ...commonAfter,
          { label: "Bill Type", value: type.toUpperCase() },
        ];
      case "airtime":
        return [
          { label: "Network", value: data?.network },
          { label: "Bill Type", value: type.toUpperCase() },
          { label: "Phone", value: data?.plan_phone },
          ...commonBefore,
          ...commonAfter,
        ];
      case "giftcard":
        return [
          { label: "Date", value: data?.plan_date || data?.date },
          { label: "Recipient Email", value: data?.recipient_email },
          { label: "Category", value: data?.image, secondaryValue: data?.category, isImage: true },
          { label: "Sub Category", value: data?.subcategory },
          { label: "Rate", value: `₦${formatNumber(data?.rate)}` },
          { label: "Giftcard Type", value: data?.physical_ecode },
          { label: "Country", value: data?.country },
          { label: "Quantity", value: data?.quantity },
          { label: "Total Amount", value: data?.total_amount ? `${getCurrencySymbol(type)}${formatNumber(data?.total_amount)}` : null },
          { label: "Amount to be Paid", value: data?.estimated ? `₦${formatNumber(data?.estimated)}` : null },
          ...commonAfter,
          { label: "Comment", value: data?.comment_ecode, fullWidthValue: true },
          { label: "Reject Reason", value: data?.reject_reason, fullWidthValue: true },
        ];
      case "debit":
      case "credit":
        return [...commonBefore, ...commonAfter];
      case "withdrawal":
        return [
          { label: "Date", value: data?.date },
          { label: "Account Name", value: data?.account_name },
          { label: "Account Number", value: data?.account_number },
          { label: "Amount", value: `₦${formatNumber(Number(data?.amount))}` },
          { label: "Bank Name", value: data?.bank_name },
          ...commonAfter,
        ];
      case "betting":
        return [
          ...commonBefore,
          { label: "Betting Platform", value: data?.billername },
          ...commonAfter,
        ];
      case "crypto":
        return [
          { label: "Date", value: data?.created_at || data?.date },
          { label: "Currency", value: data?.currency },
          { label: "Network", value: data?.network },
          { label: "Amount (Crypto)", value: data?.amount_with_network || data?.amount },
          { label: "Rate", value: `₦${formatNumber(data?.ngnx_rate || data?.rate)}` },
          { label: "Amount in Naira", value: `₦${formatNumber(data?.amount_credited_in_naira || data?.swapped_amount)}` },
          { label: "Wallet Address", value: data?.user_address, isCopyable: true },
          ...commonAfter,
        ];
      default:
        return [];
    }
  };

  const getStatusText = () => {
    const action = type === "giftcard" ? (data?.transaction_type === "sell" ? "Trade" : "Purchase") :
      type === "withdrawal" ? "Withdrawal Transaction" :
        type === "debit" ? "Debit Transaction" :
          type === "credit" ? "Credit Transaction" :
            type === "crypto" ? "Crypto Transaction" :
              type === "betting" ? "Transaction" : `${type.charAt(0).toUpperCase() + type.slice(1)} Purchase`;
    return `Your ${action} ${tradeStatus === "success" ? "is Successful" : tradeStatus === "pending" ? "is Pending" : "failed"}`;
  };

  const fields = getTransactionFields();
  const amount = type === "giftcard"
    ? data?.final_amount || data?.estimated
    : type === "crypto"
      ? data?.amount_credited_in_naira || data?.swapped_amount || data?.amount
      : data?.amount;
  const subcategory = data?.subcategory;


  const handleSupportPress = () => {
    const category = data?.category;
    const subcategory = data?.subcategory;
    let department = "App Support";
    const normalizedType = type?.toLowerCase();
    // console.log("category", category);
    // console.log("normalizedType", normalizedType);

    if (normalizedType === 'giftcard') {
      // Route to category-specific department (e.g. "Amazon Card Support")
      // Falls back to "Trade Support" if category is not available
      department = category ? `${category} Card Support` : "App Support";
      //   } else if (normalizedType === 'crypto') {
      //   department = "Crypto Support";
      // } else if (['airtime', 'data', 'cable', 'bill', 'betting'].includes(normalizedType)) {
      //   department = "Bill Payment Support";
    }

    if (normalizedType === 'giftcard') {
      // Navigate to Firebase trade chat (will be connected in Phase 4)
      router.push({ pathname: '/(protected)/(features)/trade-chat' as any, params: { tradeId: transId, cardName: category || 'Gift Card', cardCategory: category || '', type: 'new' } });
    } else {
      openChat(department, transId, normalizedType);
    }
  }



  return (
    <>
      <SettingsHeader
        title="Transaction Details"
        rightAction={
          <Pressable
            onPress={() => {
              handleSupportPress();
            }}
            className="p-2"
          >
            {isDark ? (
              <img.headSupportLight width={24} height={24} />
            ) : (
              <img.headSupportLight width={24} height={24} />
            )}
          </Pressable>
        }
      />
      <ThemedView className="flex-1 pt-5 px-[20px]">
        <SafeAreaView className="flex-1" edges={["bottom"]} style={{ paddingBottom: 20 }}>
          {isLoading ? (
            <SkeletonLoader />
          ) : !data ? (
            <View className="flex-col items-center justify-center pt-16 px-4">
              {isDark ? <img.noTransDark width={80} height={80} /> : <img.noTransLight width={80} height={80} />}
              <ThemedText className="text-h7 text-center pt-10" weight="medium" variant="secondary">
                No transaction details available.
              </ThemedText>
            </View>
          ) : (
            <>
              <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30, }} showsVerticalScrollIndicator={false}>
                <View
                  className="bg-white dark:bg-[#111111] rounded-[30px] flex-1 pb-10 pt-5 relative overflow-hidden"
                  style={styles.receiptContainer}
                >
                  <ImageBackground
                    source={isDark ? img.receiptBgDark : img.receiptBgLight}
                    className="w-full h-full flex-1"
                    imageStyle={{ borderRadius: 30 }}
                  >
                    <View className="items-center justify-center relative bg-primary-500 rounded-[20px] py-4 mx-3 mt-3">
                      <View
                        className="absolute -top-4 left-0 right-0 justify-center items-center flex  "
                      >
                        {tradeStatus === "success" && <Image source={img.successTick} style={{ width: 40, height: 40 }} resizeMode="contain" />}
                        {tradeStatus === "pending" && <icons.pending width={40} height={40} />}
                        {tradeStatus === "failed" && (
                          <View className="bg-white rounded-full items-center justify-center" style={{ width: 40, height: 40 }}>
                            <icons.delete width={28} height={28} />
                          </View>
                        )}
                      </View>

                      <View className=" px-4 pt-6 rounded-full flex-row items-center justify-center mx-auto gap-2">
                        {renderTypeIconOrImage()}
                        <ThemedText className="text-b2 !text-white " weight="medium">
                          {renderTransType()}
                        </ThemedText>
                      </View>


                      <ThemedText
                        className="text-b2 !text-white  pt-3" weight="medium">
                        {getStatusText()}
                      </ThemedText>
                      <ThemedText className="text-h4 !text-white  pt-1" weight="bold">
                        ₦{formatNumber(Number(amount))}
                      </ThemedText>
                    </View>


                    <View className="py-4 px-3 mt-6 ">

                      {type === "giftcard" && adminImages?.length > 0 && (
                        <View className="pb-4">
                          <ThemedText className="text-b3 text-text-primary-light dark:text-text-primary-dark " weight="medium" variant="secondary">
                            Remark ({adminImages?.length})
                          </ThemedText>
                          <ThemedText className="text-b3 !text-primary-500 pb-4" weight="medium" variant="secondary">
                            Invalid giftcard receipts
                          </ThemedText>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                            {adminImages?.map((imgItem: any, idx: number) => (
                              <Pressable key={idx} onPress={() => { setcurrentAdminImageIndex(idx); setAdminVisibleImage(true); }}>
                                <Image source={{ uri: typeof imgItem === 'string' ? imgItem : imgItem?.image }} className="w-[220px] h-20 rounded-lg" resizeMode="cover" />
                              </Pressable>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      {fields.map((field, index) => (
                        <InfoRow
                          key={index}
                          {...field}
                          isDark={isDark}
                          onCopy={copyToClipboard}
                          isLast={index === fields.length - 1}
                        />
                      ))}




                      {type === "giftcard" && images?.length > 0 && (
                        <View className="py-10 pb-4">
                          <ThemedText className="text-b3 text-text-primary-light dark:text-text-primary-dark pb-4" weight="medium" variant="secondary">
                            Gift Card Preview (Click to enlarge) ({images?.length})
                          </ThemedText>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                            {images?.map((imgItem: any, idx: number) => (
                              <Pressable key={idx} onPress={() => { setCurrentImageIndex(idx); setVisibleImage(true); }}>
                                <Image source={{ uri: typeof imgItem === 'string' ? imgItem : imgItem?.image }} className="w-[100px] h-20 rounded-lg" resizeMode="cover" />
                              </Pressable>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                    </View>

                    {/* Perforation Line (Dashed) */}
                    {/* <View className="mt-auto mb-2 px-6">
                      <View
                        style={{
                          borderStyle: 'dashed',
                          borderWidth: 1,
                          borderColor: isDark ? '#333' : '#E5E5E5',
                        }}
                      />
                    </View> */}
                  </ImageBackground>

                  {/* Scalloped Edge Cutouts (Matching the image frequency exactly) */}
                  <View
                    className="flex-row absolute -bottom-[12px] left-0 right-0 overflow-hidden h-[24px] justify-between px-[-12px]"
                  >
                    {Array.from({ length: 16 }).map((_, i) => (
                      <View
                        key={i}
                        className="w-[24px] h-[24px] rounded-full bg-background-light dark:bg-black"
                      />
                    ))}
                  </View>
                </View>

                {/* More Action Section */}
                <View
                  className="flex-col justify-between rounded-[30px] mt-4 border-[1px] border-border-light dark:border-border-dark bg-white dark:bg-[#111111] p-4 px-5"
                >
                  <ThemedText className="text-b1 pb-2 opacity-60" variant="secondary">
                    More Action
                  </ThemedText>
                  <Pressable
                    className="flex-row items-center justify-between "
                    onPress={() => {
                      // Navigate back to the relevant feature screen
                      const pathMap: any = {
                        airtime: paths.bills.airtime,
                        data: paths.bills.data,
                        cable: paths.bills.cable,
                        bill: paths.bills.electricity,
                        betting: paths.bills.betting,
                        withdrawal: paths.withdraw,
                        debit: paths.deposit,
                        credit: paths.deposit,
                        giftcard: paths.giftcards.sellGiftCards,
                        crypto: paths.crypto.sellCrypto,
                      };
                      const target = pathMap[type] || paths.tabs.home;
                      router.push(target);
                    }}
                  >
                    <ThemedText className="text-b1 !text-primary-500" weight="medium">
                      {type === "withdrawal" ? "Withdraw again" :
                        type === "debit" || type === "credit" ? "Deposit again" :
                          type === "airtime" ? "Buy airtime again" :
                            type === "data" ? "Buy data again" :
                              type === "cable" ? "Pay cable again" :
                                type === "bill" ? "Pay bill again" :
                                  type === "betting" ? "Pay betting again" :
                                    type === "giftcard" ? "Sell giftcard again" :
                                      type === "crypto" ? "Sell crypto again" : "Pay again"}
                    </ThemedText>
                    <ChevronRight size={20} color={colorThemes[app_config.theme][500]} />
                  </Pressable>

                  {/* Divider */}
                  <View className="h-[1px] bg-border-light dark:bg-border-dark my-3" />

                  <Pressable
                    className="flex-row items-center justify-between"
                    onPress={handleSupportPress}
                  >
                    <ThemedText className="text-b1 !text-primary-500" weight="medium">
                      Contact support
                    </ThemedText>
                    <ChevronRight size={20} color={colorThemes[app_config.theme][500]} />
                  </Pressable>
                </View>
              </ScrollView>

              <View className="flex-row w-full items-center justify-center gap-4 mt-6">
                <Button variant="primary" className="bg-primary-500 flex-1 rounded-2xl py-4 mt-6" onPress={navigateThem}>
                  <ThemedText className="text-white text-center text-b1" weight="regular">
                    {tradeStatus === "success" ? "Leave Review" : tradeStatus === "pending" ? "Ok, Thanks" : "Try Again"}
                  </ThemedText>
                </Button>
              </View>
            </>
          )}
        </SafeAreaView>
      </ThemedView>

      {/* Image Viewing Modal */}
      <Modal
        visible={visibleImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisibleImage(false)}
      >
        <SafeAreaView className="flex-1 bg-black justify-center items-center">
          <TouchableOpacity
            onPress={() => setVisibleImage(false)}
            className="absolute top-10 right-6 z-10 p-2 bg-black/50 rounded-full"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          {images[currentImageIndex] && (
            <Image
              source={{ uri: typeof images[currentImageIndex] === 'string' ? images[currentImageIndex] : (images[currentImageIndex] as any)?.image }}
              className="w-full h-full"
              resizeMode="contain"
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={adminVisibleImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAdminVisibleImage(false)}
      >
        <SafeAreaView className="flex-1 bg-black justify-center items-center">
          <TouchableOpacity
            onPress={() => setAdminVisibleImage(false)}
            className="absolute top-10 right-6 z-10 p-2 bg-black/50 rounded-full"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          {adminImages[currentAdminImageIndex] && (
            <Image
              source={{ uri: typeof adminImages[currentAdminImageIndex] === 'string' ? adminImages[currentAdminImageIndex] : (adminImages[currentAdminImageIndex] as any)?.image }}
              className="w-full h-full"
              resizeMode="contain"
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
};


const styles = StyleSheet.create({
  receiptContainer: {
    width: "100%",
    minHeight: 450,
    // elevation: 8,
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 10,
    borderRadius: 30,
  },
});

export default AllDetailTransaction;
