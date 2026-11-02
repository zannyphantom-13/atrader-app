import EndChatModal from "@/components/modals/EndChatModal";
import { TradeDetailsDrawer } from "@/components/modals/TradeDetailsDrawer";
import { MessageBubbleSkeleton } from "@/components/skeletons/chatskeleton";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { img } from "@/constant/image";
import { useNotifications } from "@/context/NotificationsProvider";
import { useTheme } from "@/context/ThemeProvider";
import { useFirebaseChat } from "@/hooks/useFirebaseChat";
import { createTradeChat, updateChatPushToken, type MessageDocument } from "@/lib/firebase-chat-service";
import { useAppSelector } from "@/redux/store";
import { useGetAllTypeDetailTransactionMutation } from "@/redux/transaction/transaction_history";
import app_colors from "@/styles/color";
import { formatNumber } from "@/utils/formatamount";
import { TokenManager } from "@/utils/secure-store-adapter";
import { openChat } from "@/lib/zoho-service";
import { BottomSheetModal, BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { ArrowLeft, ChevronDown, ImagePlus, X } from "lucide-react-native";
import TradeRejectedIcon from "@/assets/images/trade-rejected.svg";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Keyboard,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const isKeyboardControllerLinked = Boolean(
  NativeModules?.KeyboardController ||
  (global as any)?.__turboModuleProxy?.('KeyboardController')
);

let KeyboardController: any = {
  setInputMode: () => { },
};
let AndroidSoftInputModes: any = {
  SOFT_INPUT_ADJUST_NOTHING: 0,
  SOFT_INPUT_ADJUST_RESIZE: 0,
};
let useKeyboardHandler: any = (callbacks: any) => { };

if (isKeyboardControllerLinked) {
  try {
    const kc = require("react-native-keyboard-controller");
    KeyboardController = kc.KeyboardController;
    AndroidSoftInputModes = kc.AndroidSoftInputModes;
    useKeyboardHandler = kc.useKeyboardHandler;
  } catch (e) {
    // Fallback when native module is missing
  }
}

const TradeChat = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const { expoPushToken } = useNotifications();
  const insets = useSafeAreaInsets();
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};
  const flatListRef = useRef<FlatList>(null);

  // Route params
  const params = useLocalSearchParams<{
    chatId?: string;
    tradeId?: string;
    cardName: string;
    cardCategory: string;
    cardImage: string;
    cardAmount: string;
    settlementAmount: string;
    type: string; // 'new' or 'existing'
    isSupport?: string;
  }>();

  const resolvedChatId =
    params.chatId ||
    (params.tradeId
      ? params.tradeId.startsWith("trade_") || params.tradeId.startsWith("support_")
        ? params.tradeId
        : `trade_${params.tradeId}`
      : null);

  const [chatId, setChatId] = useState<string | null>(resolvedChatId);
  const [inputText, setInputText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showEndChatModal, setShowEndChatModal] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [visibleImageIndex, setVisibleImageIndex] = useState(0);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [tradeData, setTradeData] = useState<any>(null);
  const [tradeImages, setTradeImages] = useState<any[]>([]);
  const [getAllTypeDetailTransaction, { isLoading: isFetchingTrade }] = useGetAllTypeDetailTransactionMutation();

  const userId = getAuth().currentUser?.uid || userInfo?.email || userInfo?.id || "";
  const userName = userInfo?.name || userInfo?.username || "User";
  const userType = userInfo?.type || "tier 1";
  const userAvatar = null; // using default avatar

  useEffect(() => {
    const fetchDetailedTransaction = async () => {
      const derivedTradeId = params.tradeId || (params.chatId as string)?.replace('trade_', '') || '';
      const isSupportChat = !!params.isSupport || !!(params.chatId && (params.chatId as string).includes('support_'));
      if (!derivedTradeId || isSupportChat) return;

      try {
        const atex = await TokenManager.getToken();
        const response: any = await getAllTypeDetailTransaction({
          data: { token: atex, transid: derivedTradeId, role: "giftcard" },
        }).unwrap();
        if (response?.status === "success") {
          setTradeData(response?.transaction);
          setTradeImages(response?.images || []);
        }
      } catch (error) {
        console.error("Failed to fetch trade details", error);
      }
    };
    fetchDetailedTransaction();
  }, [params.tradeId, params.chatId, params.isSupport]);

  const { messages, chatInfo, isLoading, isSending, isUploading, sendText, sendImage, endChat } =
    useFirebaseChat(chatId, userId, userName, userAvatar || "");

  // Create chat on mount if it's a new trade
  useEffect(() => {
    const initChat = async () => {
      if (params.type === "new" && !chatId) {
        setIsCreating(true);
        try {
          const newChatId = await createTradeChat({
            tradeId: params.tradeId || "",
            userId,
            userName,
            userExpoPushToken: expoPushToken,
            cardName: params.cardName,
            cardCategory: params.cardCategory,
            cardImage: params.cardImage,
            cardAmount: params.cardAmount || "0",
            settlementAmount: params.settlementAmount || "0",
          });
          setChatId(newChatId);
        } catch (error) {
          console.error("[TradeChat] Failed to create chat:", error);
          Alert.alert("Error", "Failed to start trade chat. Please try again.");
        } finally {
          setIsCreating(false);
        }
      } else if (params.type === "existing") {
        const id = chatId || params.chatId || `trade_${params.tradeId}`;
        if (!chatId) setChatId(id);
        if (expoPushToken) {
          updateChatPushToken(id, expoPushToken);
        }
      }
    };
    initChat();
  }, [params.tradeId, params.type]);

  // Handle Android Soft Input Mode
  useEffect(() => {
    if (Platform.OS === "android") {
      KeyboardController.setInputMode(AndroidSoftInputModes.SOFT_INPUT_ADJUST_NOTHING);
      return () => {
        // Restore default on unmount
        KeyboardController.setInputMode(AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE);
      };
    }
  }, []);

  // Manual Keyboard Height Tracking
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    if (!isKeyboardControllerLinked) {
      const showSub = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
        (e) => {
          keyboardHeight.value = e.endCoordinates.height;
        }
      );
      const hideSub = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
        () => {
          keyboardHeight.value = 0;
        }
      );
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }
  }, []);

  useKeyboardHandler({
    onStart: (e: any) => {
      "worklet";
      keyboardHeight.value = e.height;
    },
    onInteractive: (e: any) => {
      "worklet";
      keyboardHeight.value = e.height;
    },
    onEnd: (e: any) => {
      "worklet";
      keyboardHeight.value = e.height;
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    // Subtract insets.bottom on Android to avoid double-padding with the container's static padding
    paddingBottom: Math.max(0, Math.abs(keyboardHeight.get()) - (Platform.OS === "android" ? insets.bottom - 10 : insets.bottom - 10)),
  }));

  const isSupportChat = chatId?.startsWith("support_");
  const agentDisplayName = chatInfo?.assignedAgentName || "Atrader customer support";

  // Normalize trade and chat status from real-time Firestore chatInfo and backend REST tradeData
  const rawTradeStatus = (
    chatInfo?.tradeStatus ||
    (chatInfo as any)?.status ||
    (tradeData?.plan_status === 1 ? "approved" : tradeData?.plan_status === 2 ? "rejected" : null) ||
    "pending"
  ).toLowerCase();

  // Check system messages for approval or rejection in case document state lagged
  const hasApprovedMessage = messages?.some(
    (m) =>
      m.senderType === "system" &&
      (m.text?.toLowerCase().includes("trade has been approved") ||
        m.text?.toLowerCase().includes("funds would be sent soon"))
  );

  const hasRejectedMessage = messages?.some(
    (m) =>
      m.senderType === "system" &&
      m.text?.toLowerCase().includes("trade has been rejected")
  );

  const messageRejectReason = messages
    ?.filter((m) => m.senderType === "system" && m.text?.toLowerCase().includes("reason:"))
    ?.slice(-1)[0]
    ?.text?.split(/reason:\s*/i)[1]
    ?.trim();

  const isTradeApproved =
    rawTradeStatus === "approved" ||
    rawTradeStatus === "successful" ||
    rawTradeStatus === "success" ||
    tradeData?.plan_status === 1 ||
    Boolean(hasApprovedMessage && !hasRejectedMessage);

  const isTradeRejected =
    !isTradeApproved &&
    (rawTradeStatus === "rejected" ||
      rawTradeStatus === "reject" ||
      rawTradeStatus === "failed" ||
      tradeData?.plan_status === 2 ||
      Boolean(hasRejectedMessage));

  const isTradePending = !isTradeApproved && !isTradeRejected;

  const displayStatusText = isTradeApproved
    ? "Successful"
    : isTradeRejected
      ? "Rejected"
      : "Pending";

  const statusColor = isTradeApproved
    ? (isDark ? "#37C415" : "#28A712")
    : isTradeRejected
      ? (isDark ? "#EF4444" : "#E53935")
      : "#F59E0B";

  const statusBgColor = isTradeApproved
    ? (isDark ? "#0B2E02" : "#E8FFE4")
    : isTradeRejected
      ? (isDark ? "#300808" : "#FFE8E8")
      : (isDark ? "rgba(245, 158, 11, 0.18)" : "#FFFBEB");

  const statusBorderColor = isTradeApproved
    ? (isDark ? "#37C415" : "#28A712")
    : isTradeRejected
      ? (isDark ? "#EF4444" : "#E53935")
      : (isDark ? "rgba(245, 158, 11, 0.35)" : "#FDE68A");

  // A chat is considered closed when marked closed/reject in Firestore, or when trade is resolved
  const isChatClosed =
    chatInfo?.chatStatus === "closed" ||
    (chatInfo as any)?.status === "closed";

  const rejectionReason =
    chatInfo?.rejectReason ||
    (chatInfo as any)?.reject_reason ||
    tradeData?.reject_reason ||
    messageRejectReason ||
    "";

  // Scroll to bottom when new messages arrive - REMOVED for inverted list
  // Inverted lists are anchored to the bottom by default.

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isChatClosed) return;
    const text = inputText;
    setInputText("");
    try {
      await sendText(text);
    } catch (error) {
      setInputText(text); // restore on error
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  }, [inputText, sendText, isChatClosed]);

  const handlePickImage = useCallback(async () => {
    if (isChatClosed) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets?.length) {
      try {
        for (const asset of result.assets) {
          await sendImage(asset.uri, asset.fileName || undefined);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to send one or more images. Please try again.");
      }
    }
  }, [sendImage, isChatClosed]);

  const handleEndChat = useCallback(async () => {
    setShowEndChatModal(true);
  }, []);

  const confirmEndChat = useCallback(async () => {
    setIsEndingChat(true);
    try {
      await endChat();
      setShowEndChatModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to end chat. Please try again.");
    } finally {
      setIsEndingChat(false);
    }
  }, [endChat]);



  const handleContactSupport = useCallback(async () => {
    try {
      openChat("App Support");
    } catch (error) {
      console.error("[TradeChat] Failed to open Zoho support chat:", error);
      Alert.alert("Error", "Failed to contact support. Please try again.");
    }
  }, []);

  const formatTime = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // ============================================
  // Render Message Bubble
  // ============================================
  const chronologicalMessages = React.useMemo(() => [...messages].reverse(), [messages]);

  const imageMessages = React.useMemo(() => {
    return chronologicalMessages.filter(msg => msg.type === "image" && msg.imageUrl);
  }, [chronologicalMessages]);

  const handleImagePress = (messageId: string) => {
    const index = imageMessages.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      setSelectedImageIndex(index);
      setVisibleImageIndex(index);
    }
  };

  const onImageScrollEnd = (e: any) => {
    const offset = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offset / windowWidth);
    setVisibleImageIndex(currentIndex);
  };

  const renderMessage = ({ item }: { item: MessageDocument }) => {
    const isSystem = item.senderType === "system";
    const isUser = item.senderType === "user";

    if (isSystem || !isUser) {
      // Support / Agent Message (aligned to LEFT)
      return (
        <View style={{ marginBottom: 8, alignItems: "flex-start" }}>
          {/* Header with avatar + name */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
                borderWidth: 0.5,
                borderColor: isDark ? "#333333" : "#E6E6E6",
                backgroundColor: isDark ? "#111111" : "#FFFFFF",
              }}
            >
              <Image
                source={isDark ? img.logoDarkPng : img.logolightPng}
                style={{ width: 16, height: 16 }}
                resizeMode="contain"
              />
            </View>
            <ThemedText
              family="primary"
              weight="medium"
              style={{
                fontSize: 12,
                lineHeight: 15.6,
                color: isDark ? "#FFFFFF" : "#4A4A4A",
              }}
            >
              ATrader customer support
            </ThemedText>
          </View>

          {/* Bubble */}
          {item.type === "image" && item.imageUrl ? (
            <Pressable
              onPress={() => handleImagePress(item.id!)}
              style={{
                width: 295,
                height: 190,
                borderRadius: 12,
                borderTopLeftRadius: 0,
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 8,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <ThemedText
                  family="primary"
                  weight="medium"
                  style={{ fontSize: 10, lineHeight: 14, color: "#FFFFFF" }}
                >
                  {formatTime(item.createdAt)}
                </ThemedText>
              </View>
            </Pressable>
          ) : (
            <View
              style={{
                maxWidth: 295,
                paddingTop: 12,
                paddingHorizontal: 12,
                paddingBottom: 6,
                borderRadius: 12,
                borderTopLeftRadius: 0,
                backgroundColor: isDark ? "#111111" : "#F8F8F8",
                borderWidth: isDark ? 0.5 : 0,
                borderColor: "#232323",
              }}
            >
              <ThemedText
                family="primary"
                weight="medium"
                style={{
                  fontSize: 14,
                  lineHeight: 18.2,
                  color: isDark ? "#FFFFFF" : "#0D121C",
                }}
              >
                {item.text}
              </ThemedText>
              <ThemedText
                family="primary"
                weight="medium"
                style={{
                  fontSize: 10,
                  lineHeight: 19.2,
                  color: "#B5B5B5",
                  marginTop: 4,
                }}
              >
                {formatTime(item.createdAt)}
              </ThemedText>
            </View>
          )}
        </View>
      );
    }

    // User Message (aligned to RIGHT)
    return (
      <View style={{ marginBottom: 8, alignItems: "flex-end" }}>
        {/* Bubble */}
        {item.type === "image" && item.imageUrl ? (
          <Pressable
            onPress={() => handleImagePress(item.id!)}
            style={{
              width: 295,
              height: 190,
              borderRadius: 12,
              borderBottomRightRadius: 0,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            <View
              style={{
                position: "absolute",
                bottom: 6,
                right: 8,
                backgroundColor: "rgba(0,0,0,0.55)",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
              }}
            >
              <ThemedText
                family="primary"
                weight="medium"
                style={{ fontSize: 10, lineHeight: 14, color: "#FFFFFF" }}
              >
                {formatTime(item.createdAt)}
              </ThemedText>
            </View>
          </Pressable>
        ) : (
          <View
            style={{
              maxWidth: 295,
              paddingTop: 12,
              paddingHorizontal: 12,
              paddingBottom: 6,
              borderRadius: 12,
              borderBottomRightRadius: 0,
              backgroundColor: isDark ? "#0A2E02" : "#E8FFE4",
            }}
          >
            <ThemedText
              family="primary"
              weight="medium"
              style={{
                fontSize: 14,
                lineHeight: 18.2,
                color: isDark ? "#FFFFFF" : "#0D121C",
              }}
            >
              {item.text}
            </ThemedText>
            <ThemedText
              family="primary"
              weight="medium"
              style={{
                fontSize: 10,
                lineHeight: 19.2,
                color: isDark ? "#B5B5B5" : "#71717A",
                marginTop: 4,
              }}
            >
              {formatTime(item.createdAt)}
            </ThemedText>
          </View>
        )}

        {/* User name + avatar under the message */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
          <ThemedText
            family="primary"
            weight="medium"
            style={{
              fontSize: 12,
              lineHeight: 15.6,
              color: isDark ? "#FFFFFF" : "#4A4A4A",
              marginRight: 8,
            }}
          >
            {item.senderName}
          </ThemedText>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              overflow: "hidden",
              borderWidth: 0.5,
              borderColor: isDark ? "#333333" : "#E6E6E6",
              backgroundColor: "#E5E7EB",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.senderAvatar ? (
              <Image source={{ uri: item.senderAvatar }} style={{ width: 24, height: 24 }} />
            ) : (
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "#BFDBFE",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ThemedText style={{ fontSize: 10, fontWeight: "bold", color: "#1E40AF" }}>
                  {(item.senderName || "U").charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ============================================
  // Main Layout
  // ============================================
  return (
    <BottomSheetModalProvider>
      <ThemedView className="flex-1"
        style={{
          paddingBottom: Platform.OS === "ios"
            ? insets.bottom
            : insets.bottom,
        }}
      >
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          {/* Header */}
          <SafeAreaView edges={["top"]} className="bg-background-light dark:bg-background-dark">
            <View className="flex-row items-center px-5 py-3">
              <Pressable onPress={() => router.back()} className="mr-3" hitSlop={10}>
                <ArrowLeft size={24} color={isDark ? "#FFFFFF" : "#0C0C0C"} />
              </Pressable>
              <ThemedText
                family="primary"
                weight="medium"
                style={{
                  fontSize: 16,
                  lineHeight: 19.2,
                  color: isDark ? "#E7E7E7" : "#0C0C0C",
                }}
              >
                {isSupportChat ? "Gift Card Support" : "Trade support"}
              </ThemedText>
            </View>
          </SafeAreaView>

          {/* Trade Info Card - HIDE FOR SUPPORT CHATS */}
          {!isSupportChat && (
            <Pressable className="mx-5 mt-2 mb-2" onPress={() => bottomSheetRef.current?.present()}>
              <View
                style={{
                  height: 56,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: isDark ? "#232323" : "#EFEFEF",
                  backgroundColor: isDark ? "#111111" : "#FFFFFF",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 16,
                      overflow: "hidden",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                      backgroundColor: isDark ? "#232323" : "#F3F4F6",
                    }}
                  >
                    {chatInfo?.cardImage ? (
                      <Image source={{ uri: chatInfo.cardImage }} style={{ width: 36, height: 36 }} />
                    ) : params.cardImage ? (
                      <Image
                        source={
                          typeof params.cardImage === "string" && params.cardImage.startsWith("http")
                            ? { uri: params.cardImage }
                            : undefined
                        }
                        style={{ width: 36, height: 36 }}
                      />
                    ) : (
                      isDark ? (
                        <img.giftcardDark width={36} height={36} />
                      ) : (
                        <img.giftcardLight width={36} height={36} />
                      )
                    )}
                  </View>
                  <View style={{ flex: 1, justifyContent: "center" }}>
                    <ThemedText
                      family="primary"
                      weight="medium"
                      numberOfLines={1}
                      style={{
                        fontSize: 14,
                        lineHeight: 19.2,
                        color: isDark ? "#FFFFFF" : "#0C0C0C",
                      }}
                    >
                      {chatInfo?.cardName || params.cardName || "Gift Card"}
                    </ThemedText>
                    <ThemedText
                      family="primary"
                      weight="medium"
                      numberOfLines={1}
                      style={{
                        fontSize: 12,
                        lineHeight: 14.4,
                        color: isDark ? "#B5B5B5" : "#4A4A4A",
                        marginTop: 2,
                      }}
                    >
                      {tradeData?.total_amount
                        ? `$${formatNumber(tradeData.total_amount)}`
                        : `$${formatNumber(chatInfo?.cardAmount || params.cardAmount || "0")}`} ~ {tradeData?.estimated
                          ? `₦${formatNumber(tradeData.estimated)}`
                          : `₦${formatNumber(chatInfo?.settlementAmount || params.settlementAmount || "0")}`}
                      {tradeData?.rate ? ` (@ ₦${tradeData.rate})` : ""}
                    </ThemedText>
                  </View>
                </View>

                {/* Status Badge */}
                <View
                  style={{
                    width: isTradeApproved ? 96 : isTradeRejected ? 82 : 88,
                    height: 35,
                    borderRadius: 100,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    backgroundColor: statusBgColor,
                    borderWidth: 1,
                    borderColor: statusBorderColor,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ThemedText
                    family="primary"
                    weight="medium"
                    style={{
                      fontSize: 14,
                      lineHeight: 22.4,
                      color: statusColor,
                    }}
                  >
                    {displayStatusText}
                  </ThemedText>
                </View>
              </View>
            </Pressable>
          )}

          {/* Encryption Notice */}
          <View style={{ marginHorizontal: 20, marginTop: 12, marginBottom: 12 }}>
            <ThemedText
              family="primary"
              weight="medium"
              style={{
                fontSize: 12,
                lineHeight: 15.6,
                textAlign: "center",
                color: isDark ? "#B5B5B5" : "#4A4A4A",
              }}
            >
              {"This chat is encrypted between you and customer support\nand it has no data hisotry"}
            </ThemedText>
          </View>

          {/* Messages List */}
          {isLoading || isCreating ? (
            <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
              <MessageBubbleSkeleton isUser={false} />
              <MessageBubbleSkeleton isUser={true} />
              <MessageBubbleSkeleton isUser={false} />
              <MessageBubbleSkeleton isUser={true} />
            </ScrollView>
          ) : (
            <FlatList
              ref={flatListRef}
              data={chronologicalMessages}
              renderItem={renderMessage}
              inverted
              keyExtractor={(item) => item.id || String(Math.random())}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 10,
                paddingTop: 10, // Added for inverted list top (which is visual bottom)
                flexGrow: 1
              }}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Trade Status Bar (appears when trade is resolved) - HIDE FOR SUPPORT CHATS */}
          {!isSupportChat && (isTradeApproved || isTradeRejected) && (
            <View
              style={{
                minHeight: 56,
                height: (!rejectionReason || !isTradeRejected) ? 56 : undefined,
                marginHorizontal: 20,
                marginBottom: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isDark ? "#232323" : "#EFEFEF",
                backgroundColor: isDark ? "#111111" : "#FAFAFA",
                paddingHorizontal: 14,
                paddingVertical: (!rejectionReason || !isTradeRejected) ? 0 : 10,
                justifyContent: "center",
              }}
            >
              <View className="flex-row items-center justify-between">
                {/* Icon + Label */}
                <View className="flex-row items-center flex-1 mr-2">
                  {isTradeApproved ? (
                    <Image
                      source={img.tradeSuccessful}
                      style={{ width: 40, height: 41 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <TradeRejectedIcon width={40} height={41} />
                  )}
                  <ThemedText
                    family="primary"
                    weight="medium"
                    style={{
                      fontSize: 14,
                      lineHeight: 18.2, // 130% line-height (14 * 1.3)
                      letterSpacing: 0,
                      marginLeft: 12,
                      color: isDark ? "#FFFFFF" : "#111111",
                    }}
                  >
                    {isTradeApproved ? "Trade successful" : "Trade rejected"}
                  </ThemedText>
                </View>

                {/* End chat pill button */}
                <Pressable
                  onPress={handleEndChat}
                  style={{
                    width: 84,
                    height: 35,
                    borderRadius: 100,
                    paddingTop: 6,
                    paddingBottom: 6,
                    paddingLeft: 12,
                    paddingRight: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "rgba(35, 35, 35, 1)" : "#E5E5E5",
                  }}
                >
                  <ThemedText
                    family="primary"
                    weight="medium"
                    style={{
                      fontSize: 14,
                      lineHeight: 19.2,
                      color: isDark ? "#FFFFFF" : "#111111",
                    }}
                  >
                    End chat
                  </ThemedText>
                </Pressable>
              </View>

              {/* Rejection reason (if any) */}
              {isTradeRejected && !!rejectionReason && (
                <View className="mt-2 pt-2 border-t border-gray-100 dark:border-[#202020]">
                  <ThemedText family="secondary" variant="secondary" className="text-[12px]">
                    Reason:{" "}
                    <ThemedText family="primary" weight="medium" className="text-[12px] !text-red-500">
                      {rejectionReason}
                    </ThemedText>
                  </ThemedText>
                </View>
              )}
            </View>
          )}

          {/* Input Bar */}
          <View
            className="pt-3 border-t bg-white dark:bg-[#111111]"
            style={{
              borderTopColor: isDark ? "#232323" : "#EFEFEF",
              // paddingBottom: Platform.OS === "ios"
              //   ? insets.bottom
              //   : Math.max(insets.bottom, 12),
            }}
          >
            <View className="px-5">
              {isChatClosed ? (
                <View className="py-4 items-center">
                  <ThemedText family="secondary" variant="secondary" className="mb-3 text-center">
                    This chat has been closed.
                  </ThemedText>
                  {/* Commented out Reopen Chat button as requested */}
                  {/*
                  <Pressable
                    onPress={handleReopenChat}
                    disabled={isReopeningChat}
                    className="px-6 py-2.5 rounded-full items-center justify-center flex-row bg-green-500"
                  >
                    {isReopeningChat ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <ThemedText family="primary" weight="bold" className="text-white text-[14px]">
                        Reopen Chat
                      </ThemedText>
                    )}
                  </Pressable>
                  */}
                  <Pressable
                    onPress={handleContactSupport}
                    className="px-6 py-2.5 rounded-full items-center justify-center flex-row bg-primary-500"
                  >
                    <ThemedText family="primary" weight="bold" className="text-white text-[14px]">
                      Contact Support
                    </ThemedText>
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <View
                    style={{
                      flex: 1,
                      height: 46,
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDark ? "#0C0C0C" : "#FCFCFC",
                      borderWidth: 1,
                      borderColor: isDark ? "#232323" : "#EFEFEF",
                    }}
                  >
                    <TextInput
                      value={inputText}
                      onChangeText={setInputText}
                      placeholder="Describe your issues"
                      placeholderTextColor={isDark ? "#B5B5B5" : "#4A4A4A"}
                      editable={true}
                      className="flex-1 text-[14px] h-full"
                      style={{
                        color: isDark ? "#FFFFFF" : "#0C0C0C",
                        fontSize: 14,
                      }}
                      multiline={false}
                      returnKeyType="send"
                      onSubmitEditing={handleSend}
                    />
                    <Pressable
                      onPress={handlePickImage}
                      disabled={isUploading}
                      className="ml-2"
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color="#28A712" />
                      ) : (
                        <ImagePlus size={20} color={isDark ? "#B5B5B5" : "#4A4A4A"} />
                      )}
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={handleSend}
                    disabled={!inputText.trim() || isSending}
                    style={{
                      width: 68,
                      height: 46,
                      borderRadius: 20,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: !inputText.trim()
                        ? (isDark ? "#4A4A4A" : "#B5B5B5")
                        : (isDark ? "#28A712" : "#28A712"),
                    }}
                  >
                    <ThemedText
                      family="primary"
                      weight="medium"
                      style={{
                        fontSize: 14,
                        lineHeight: 16.8,
                        color: !inputText.trim()
                          ? (isDark ? "#CECECE" : "#FFFFFF")
                          : "#FFFFFF",
                      }}
                    >
                      Send
                    </ThemedText>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* End Chat Modal */}
        <EndChatModal
          visible={showEndChatModal}
          onClose={() => setShowEndChatModal(false)}
          onConfirm={confirmEndChat}
          isLoading={isEndingChat}
        />

        {/* Full Screen Swipeable Image Gallery Modal */}
        <Modal
          visible={selectedImageIndex !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedImageIndex(null)}
        >
          <View style={{ flex: 1, backgroundColor: "#000" }}>
            <FlatList
              data={imageMessages}
              horizontal
              pagingEnabled
              onMomentumScrollEnd={onImageScrollEnd}
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={selectedImageIndex === null ? undefined : selectedImageIndex}
              getItemLayout={(data, index) => ({
                length: windowWidth,
                offset: windowWidth * index,
                index
              })}
              keyExtractor={(item) => item.id || Math.random().toString()}
              renderItem={({ item }) => (
                <View style={{ width: windowWidth, height: windowHeight, justifyContent: 'center', alignItems: 'center' }}>
                  <Image
                    source={{ uri: item.imageUrl as string }}
                    style={{ width: windowWidth, height: windowHeight }}
                    resizeMode="contain"
                  />
                </View>
              )}
            />
            {/* Close Button UI */}
            <View style={{ position: "absolute", top: (insets.top || 40) + 10, right: 20, zIndex: 999 }}>
              <Pressable
                onPress={() => setSelectedImageIndex(null)}
                style={{
                  backgroundColor: 'rgba(50,50,50,0.7)',
                  borderRadius: 24,
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={24} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>

            {/* Pagination Indicator */}
            {imageMessages.length > 1 && (
              <View style={{ position: "absolute", bottom: Math.max(insets.bottom, 40), width: '100%', alignItems: 'center', zIndex: 999 }}>
                <View style={{ backgroundColor: 'rgba(50,50,50,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                  <ThemedText family="primary" weight="bold" style={{ color: "#FFFFFF", fontSize: 14 }}>
                    {visibleImageIndex + 1} / {imageMessages.length}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        </Modal>

        {/* Trade Details Drawer */}
        <TradeDetailsDrawer
          bottomSheetRef={bottomSheetRef}
          data={tradeData}
          images={tradeImages}
          isLoading={isFetchingTrade}
          rejectReason={rejectionReason}
          statusText={displayStatusText}
        />

      </ThemedView>
    </BottomSheetModalProvider>
  );
};

export default TradeChat;
