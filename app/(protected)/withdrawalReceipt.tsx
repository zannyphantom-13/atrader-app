import { ThemedText } from "@/components/theme/themeText";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { icons } from "@/constant/icon";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useGetAllTypeDetailTransactionMutation } from "@/redux/transaction/transaction_history";
import { app_config } from "@/utils/config";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
// import * as IntentLauncher from "expo-intent-launcher";
import { colorThemes } from "@/styles/theme";
import { formatNumber } from "@/utils/formatamount";
import { TokenManager } from "@/utils/secure-store-adapter";
import { Asset } from "expo-asset";
import * as Clipboard from "expo-clipboard";
import { Copy } from "lucide-react-native";

export interface ReceiptData {
  // Amount
  amount: string | number;
  status: string;

  // Recipient Details
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  recipientName?: string;
  recipientPhone?: string;
  countryFlag?: string;

  // Transaction Details
  transactionNo?: string;
  sessionId?: string;
  paymentFrom?: string;
  dateTime?: string;

  // Optional fields
  [key: string]: any;
}

interface ReceiptProps {
  data: ReceiptData;
  onClose?: () => void;
}

const WithdrawalReceipt: React.FC<ReceiptProps> = ({ data, onClose }) => {
  const { isDark } = useTheme();
  const viewShotRef = useRef<ViewShot | any>(null);
  const [logoBase64, setLogoBase64] = React.useState<string | null>(null);

  const LogoLight = icons.logoLight;
  const LogoDark = icons.logoDark;

  useEffect(() => {
    const fetchLogoBase64 = async () => {
      const base64 = await getLogoBase64(
        isDark ? app_config.LogoDark : app_config.LogoLight,
      );
      setLogoBase64(base64);
    };
    fetchLogoBase64();
  }, [isDark]);

  const html = generateReceiptHTML(
    data,
    logoBase64 || (isDark ? icons.logoLight : icons.logoDark),
  );

  // Share as image (opens share dialog)
  const handleShareImage = async () => {
    try {
      if (viewShotRef.current) {
        // Capture the view as image
        const uri = await viewShotRef?.current.capture();

        // Share the image
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "Share Receipt",
          });
        }
      }
    } catch (error) {
      console.error("Error sharing receipt:", error);
      Alert.alert("Error", "Failed to share receipt. Please try again.");
    }
  };

  // Download as PDF
  const handleDownloadPDF = async () => {
    try {

      // Generate HTML for PDF
      // const html = generateReceiptHTML(
      //   data,
      //   isDark ? icons.logoLight : icons.logoDark
      // );

      // Create PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Save PDF to device
      const pdfName = `${app_config.name}_receipt_${Date.now()}.pdf`;
      const pdfUri = `${FileSystem.documentDirectory}${pdfName}`;
      await FileSystem.moveAsync({
        from: uri,
        to: pdfUri,
      });

      // Save to media library doesnt work for pdf on iOS
      // const asset = await MediaLibrary.createAssetAsync(pdfUri);
      // await MediaLibrary.createAlbumAsync("Receipts", asset, false);

      // ✅ For Android: Save to Downloads folder
      if (Platform.OS === "android") {
        const downloadPath = `${FileSystem.documentDirectory}${pdfName}`;

        // Share or open the PDF
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(pdfUri, {
            mimeType: "application/pdf",
            dialogTitle: "Save or Share Receipt",
            UTI: "com.adobe.pdf",
          });
        }
      } else {
        // ✅ For iOS: Share the PDF
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(pdfUri, {
            mimeType: "application/pdf",
            dialogTitle: "Save or Share Receipt",
            UTI: "com.adobe.pdf",
          });
        }
      }

      Alert.alert("Success", "Receipt downloaded as PDF to your device!", [
        { text: "OK", style: "default" },
        // {
        //   text: "Open",
        //   onPress: () => openPDF(pdfUri),
        // },
      ]);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      Alert.alert("Error", "Failed to download PDF. Please try again.");
    }
  };

  // Open PDF file
  const openPDF = async (uri: string) => {
    try {
      if (Platform.OS === "android") {
        const contentUri = await FileSystem.getContentUriAsync(uri);
        // await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        //   data: contentUri,
        //   flags: 1,
        //   type: "application/pdf",
        // });
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error("Error opening PDF:", error);
    }
  };

  const getLogoBase64 = async (logoSource: any): Promise<string | null> => {
    try {
      const asset = Asset.fromModule(logoSource);
      await asset.downloadAsync();
      const base64 = await FileSystem.readAsStringAsync(
        asset.localUri || asset.uri,
        { encoding: FileSystem.EncodingType.Base64 },
      );
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };

  return (
    <ThemedView className="flex-1 pb-[40px]">
      <SafeAreaView
        edges={["top"]}
        className="flex-1 bg-background-light dark:bg-background-dark"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          className=" bg-background-light dark:bg-background-dark"
        >
          {/* Header */}
          <View className="w-full flex-row items-center justify-between py-[16px] px-[24px]">
            {isDark ? (
              <LogoLight width={32} height={32} />
            ) : (
              <LogoDark width={32} height={32} />
            )}
            {/* )} */}
            <ThemedText
              variant="primary"
              family="primary"
              weight="bold"
              className="text-b1"
            >
              Receipt
            </ThemedText>
          </View>

          {/* Receipt Content - This will be captured */}
          <ViewShot
            ref={viewShotRef}
            options={{
              format: "png",
              quality: 1,
            }}
            style={{
              flexGrow: 1,
              marginHorizontal: 20,
              marginTop: 20,
              borderRadius: 16,
              padding: 20,
              backgroundColor: isDark ? "#0F0F0F" : "#F5F5F5",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background Logo Watermark */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
                opacity: 0.05,
                zIndex: 0,
              }}
            >
              {isDark ? (
                <LogoLight width={250} height={250} />
              ) : (
                <LogoDark width={250} height={250} />
              )}
            </View>

            {/* Amount Section */}
            <View style={styles.amountSection}>
              <ThemedText
                className="text-h5"
                variant="primary"
                family="primary"
                weight="bold"
              >
                ₦{data?.amount || "0.00"}
              </ThemedText>
              <ThemedText variant="primary" family="primary" weight="medium">
                {data?.status}
              </ThemedText>
            </View>

            {/* Recipient Details */}
            {(data?.bankName || data?.accountNumber || data?.accountName) && (
              <View style={styles.section}>
                <ThemedText
                  variant="secondary"
                  family="primary"
                  weight="medium"
                  style={styles.sectionTitle}
                >
                  Recipient details
                </ThemedText>

                {data.bankName && (
                  <DetailRow label="Bank name" value={data?.bankName} />
                )}
                {data?.accountNumber && (
                  <DetailRow
                    label="Account number"
                    value={data?.accountNumber}
                  />
                )}
                {data?.accountName && (
                  <DetailRow label="Account name" value={data?.accountName} />
                )}
              </View>
            )}

            {/* Transaction Details */}
            <View style={styles.section}>
              <ThemedText
                variant="secondary"
                family="primary"
                weight="medium"
                style={styles.sectionTitle}
              >
                Transaction Details
              </ThemedText>

              {data?.transactionNo && (
                <DetailRow
                  label="Transaction No"
                  value={data?.transactionNo}
                  isCopy={true}
                />
              )}
              {data?.dateTime && (
                <DetailRow label="Date & Time" value={data?.dateTime} />
              )}


              {(() => {
                const numericAmount = Number(data?.amount || 0);
                const platformFee = 50;
                const feePercentage = (platformFee / numericAmount) * 100;
                return (
                  <DetailRow label="Fee Ratio" value={`${feePercentage.toFixed(1)}%`} />
                );
              })()}


              {((data?.breakdowns as any[]) || [
                { title: "Network Charge", val: "₦15.00" },
                { title: "Stamp Duty", val: "₦35.00" },
              ]).map((item, index) => (
                <DetailRow key={index} label={item.title} value={item.val} />
              ))}
            </View>
          </ViewShot>
        </ScrollView>

        {/* Action Buttons */}
        <View className="w-full px-[24px] mt-8 pt-[32px] gap-3">
          <Button
            className="w-full py-4 rounded-[12px] items-center justify-center border"
            onPress={handleShareImage}
            variant="outline"
          >
            <Text className="text-primary-500">Share as Image</Text>
          </Button>

          <Button onPress={handleDownloadPDF}>Download</Button>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};

// Detail Row Component
interface DetailRowProps {
  label: string;
  value: string;
  flag?: string;
  isCopy?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  flag,
  isCopy,
}) => {
  const { isDark } = useTheme();
  const toast = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      toast.showToast(`${label} copied to clipboard`, "success");
    } catch (error: any) {
      toast.showToast("Failed to copy", "error");
    }
  };
  return (
    <View style={styles.detailRow}>
      <ThemedText
        variant="secondary"
        family="primary"
        style={styles.detailLabel}
      >
        {label}
      </ThemedText>
      <View style={styles.detailValueContainer}>
        {flag && <CountryFlag flag={flag} size={16} style={{ marginRight: 6 }} />}
        <ThemedText
          className={`text-wrap  ${value.length > 25 ? "max-w-[74%]" : ""}`}
          variant="primary"
          family="primary"
          weight="medium"
        >
          {value}
        </ThemedText>
        {isCopy && (
          <Pressable
            onPress={() => copyToClipboard(value, "ID")}
            className="p-1"
          >
            <Copy size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

// Generate HTML for PDF
const generateReceiptHTML = (data: ReceiptData, logo?: any) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 40px 20px;
            background: #fff;
          }
          .receipt {
            max-width: 600px;
            margin: 0 auto;
            background: #F5F5F5;
            border-radius: 16px;
            padding: 32px;
            position: relative;
            overflow: hidden;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.05;
            width: 100%;
            height: 100%;
          }
          .amount-section {
            text-align: center;
            margin-bottom: 32px;
            position: relative;
            z-index: 1;
          }
          .amount {
            font-size: 36px;
            font-weight: bold;
            color: #000;
            margin-bottom: 8px;
          }
          .status {
            font-size: 16px;
            color: #333;
          }
          .section {
            margin-bottom: 24px;
            position: relative;
            z-index: 1;
          }
          .section-title {
            font-size: 14px;
            color: #666;
            margin-bottom: 16px;
            font-weight: 500;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          .detail-label {
            font-size: 14px;
            color: #666;
          }
          .detail-value {
            font-size: 14px;
            color: #000;
            font-weight: 500;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          ${logo ? `<img src="${logo}" class="watermark" />` : ""}
          
          <div class="amount-section">
            <div class="amount">₦${data.amount}</div>
            <div class="status">${data.status}</div>
          </div>

          ${data.bankName || data.accountNumber || data.accountName
      ? `
          <div class="section">
            <div class="section-title">Recipient details</div>
            ${data.bankName ? `<div class="detail-row"><span class="detail-label">Bank name</span><span class="detail-value"> ${data.bankName}</span></div>` : ""}
            ${data.accountNumber ? `<div class="detail-row"><span class="detail-label">Account number</span><span class="detail-value">${data.accountNumber}</span></div>` : ""}
            ${data.accountName ? `<div class="detail-row"><span class="detail-label">Account name</span><span class="detail-value">${data.accountName}</span></div>` : ""}
          </div>
          `
      : ""
    }

          <div class="section">
            <div class="section-title">Transaction Details</div>
            ${data.transactionNo ? `<div class="detail-row"><span class="detail-label">Transaction No</span><span class="detail-value">${data.transactionNo}</span></div>` : ""}
            ${data.dateTime ? `<div class="detail-row"><span class="detail-label">Date & Time</span><span class="detail-value">${data.dateTime}</span></div>` : ""}
          </div>
        </div>
      </body>
    </html>
  `;
};

const styles = StyleSheet.create({
  watermarkLogo: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: "50%",
    left: "50%",
    marginLeft: -150,
    marginTop: -150,
    opacity: 0.05,
  },
  amountSection: {
    alignItems: "center",
    marginBottom: 32,
    zIndex: 1,
  },
  amount: {
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 4,
    color: "#000000",
  },
  statusText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
  },
  section: {
    marginBottom: 24,
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    color: "#666666",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666666",
    minWidth: 100,
  },
  detailValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  flag: {
    fontSize: 16,
    fontFamily: 'Poppins'

  },
});

const TheReceiptData = () => {
  const params = useLocalSearchParams();
  const [datas, setData] = React.useState<any>(null);
  const [getAllTypeDetailTransaction, { isLoading }] =
    useGetAllTypeDetailTransactionMutation();
  const toast = useToast();
  const { type, transId } = params;
  // const { atex } = useAppSelector((state) => state.session);
  // const { atex } = useAuthToken();

  const handleGetDetailTransaction = async () => {
    const atex = await TokenManager.getToken();

    try {
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

  // console.log("The Receipt Data", datas);

  useEffect(() => {
    if (transId) {
      handleGetDetailTransaction();
    }
  }, [transId, type]);

  return (
    <>
      {isLoading ? (
        <>
          <ThemedView className="flex-1 flex-col items-center justify-center">
            <ActivityIndicator
              size="large"
              color={colorThemes[app_config.theme][500]}
            />
            <ThemedText
              variant="primary"
              family="primary"
              weight="bold"
              className="text-b1 text-center mt-10"
            >
              Loading receipt...
            </ThemedText>
          </ThemedView>
        </>
      ) : (
        <WithdrawalReceipt
          data={{
            amount: formatNumber(Number(datas?.amount)) || "0.00",
            status: "Bank Transfer successful",
            bankName: datas?.bank_name || "",
            accountNumber: datas?.account_number || "",
            accountName: datas?.account_name || "",
            transactionNo: datas?.transid || "",
            dateTime: datas?.date || "",
          }}
        />
      )}
    </>
  );
};

export default TheReceiptData;
