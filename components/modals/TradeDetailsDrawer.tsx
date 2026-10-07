import { ThemedText } from "@/components/theme/themeText";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useGetAllTypeDetailTransactionMutation } from "@/redux/transaction/transaction_history";
import { formatNumber } from "@/utils/formatamount";
import { TokenManager } from "@/utils/secure-store-adapter";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Copy, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, View, Modal, TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface TradeDetailsDrawerProps {
  bottomSheetRef: React.RefObject<any>;
  data: any;
  images: any[];
  isLoading: boolean;
}

const InfoRow = ({ label, value, secondaryValue, isCopyable, isImage, isDark, onCopy, fullWidthValue }: any) => {
  if (value === undefined || value === null || value === "" || value === "N/A") return null;
  return (
    <View className={`flex-row pt-4 border-b border-gray-100 dark:border-[#202020] pb-3 ${fullWidthValue ? 'flex-col gap-2 border-b-0' : 'items-center justify-between'}`}>
      <ThemedText className="text-b3 text-text-primary-light dark:text-text-primary-dark" weight="medium" variant="secondary">
        {label}
      </ThemedText>
      {fullWidthValue ? (
        <ThemedText className="text-b2 text-text-primary-light dark:text-text-primary-dark" weight="medium" variant="primary">
          {value}
        </ThemedText>
      ) : (
        <View className="flex-row items-center gap-2">
          {isImage && <Image source={{ uri: value }} style={{ width: 30, height: 30, borderRadius: 6 }} />}
          <ThemedText className="text-b2 text-text-primary-light dark:text-text-primary-dark" weight="bold" variant="primary">
            {typeof (secondaryValue || value) === 'string' && (secondaryValue || value).length > 20
              ? (secondaryValue || value).slice(0, 10) + "..." + (secondaryValue || value).slice(-8)
              : (secondaryValue || value)}
          </ThemedText>
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

export const TradeDetailsDrawer = ({ bottomSheetRef, data, images, isLoading }: TradeDetailsDrawerProps) => {
  const { isDark } = useTheme();
  const toast = useToast();

  const [visibleImage, setVisibleImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.showToast(`${label} copied`, "success");
    } catch (error: any) {
      toast.showToast("Failed to copy", "error");
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />,
    []
  );

  return (
    <>
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["60%", "90%"]}
      index={0}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: isDark ? "#111111" : "#FFFFFF" }}
      handleIndicatorStyle={{ backgroundColor: isDark ? "#444" : "#DDD" }}
    >
      <View className="px-5 pb-3 pt-2 flex-row justify-between items-center border-b border-gray-100 dark:border-[#202020]">
        <ThemedText className="text-h6" weight="bold">Trade Details</ThemedText>
        <Pressable onPress={() => bottomSheetRef.current?.dismiss()} className="p-2 bg-gray-100 dark:bg-[#202020] rounded-full">
          <X size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
        </Pressable>
      </View>

      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}>
        {isLoading && !data ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color="#22C55E" />
            <ThemedText variant="secondary" className="mt-4">Loading details...</ThemedText>
          </View>
        ) : !data ? (
          <View className="py-10 items-center justify-center">
            <ThemedText variant="secondary">No specific details found for this trade.</ThemedText>
          </View>
        ) : (
          <View>
            <InfoRow label="Date" value={data?.plan_date || data?.date} isDark={isDark} />
            <InfoRow label="Transaction ID" value={data?.transid} isCopyable isDark={isDark} onCopy={copyToClipboard} />
            <InfoRow label="Category" value={data?.image} secondaryValue={data?.category} isImage isDark={isDark} />
            <InfoRow label="Sub Category" value={data?.subcategory} isDark={isDark} />
            <InfoRow label="Giftcard Type" value={data?.physical_ecode} isDark={isDark} />
            <InfoRow label="Country" value={data?.country} isDark={isDark} />
            <InfoRow label="Total Value" value={data?.total_amount ? `$${formatNumber(data?.total_amount)}` : null} isDark={isDark} />
            <InfoRow label="Amount Paid" value={data?.estimated ? `₦${formatNumber(data?.estimated)}` : null} isDark={isDark} />
            {(data?.comment_ecode || data?.comment) && (
              <InfoRow label="Comment" value={data?.comment_ecode || data?.comment} fullWidthValue isDark={isDark} />
            )}
            {data?.reject_reason && (
              <InfoRow label="Reject Reason" value={data?.reject_reason} fullWidthValue isDark={isDark} />
            )}

            {images?.length > 0 && (
              <View className="py-6 border-t border-gray-100 dark:border-[#202020] mt-4">
                <ThemedText className="text-b3 text-text-primary-light dark:text-text-primary-dark pb-4" weight="medium" variant="secondary">
                  Gift Card Preview (Click to enlarge) ({images.length})
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                  {images.map((imgItem: any, idx: number) => (
                    <Pressable key={idx} onPress={() => { setCurrentImageIndex(idx); setVisibleImage(true); }}>
                      <Image source={{ uri: typeof imgItem === 'string' ? imgItem : imgItem?.image }} className="w-20 h-20 rounded-lg" resizeMode="cover" />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>

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
    </>
  );
};
