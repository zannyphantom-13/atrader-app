import { setGlobalActiveChatId, dismissChatNotification } from "@/lib/chat-state";
import { markChatReadByUser } from "@/lib/firebase-chat-service";
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
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { ArrowLeft, ChevronDown, ImagePlus, X } from "lucide-react-native";
import TradeRejectedIcon from "@/assets/images/trade-rejected.svg";
import Svg, { Path } from "react-native-svg";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const isKeyboardControllerLinked = Boolean(
  NativeModules?.KeyboardController ||
  (global as any)?.__turboModuleProxy?.('KeyboardController')
);

let KeyboardController: any = {
  setInputMode: () => { },
};
let AndroidSoftInputModes: any = {
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

const isSystemMessage = (m: { senderType?: string; type?: string; text?: string }) => {
  if (m.senderType === "user") return false;
  if (m.senderType === "system" || m.type === "status_update") return true;
  const text = m.text?.toLowerCase().trim() || "";
  if (!text) return false;
  return (
    text.includes("trade has been approved") ||
    text.includes("funds would be sent soon") ||
    text.includes("chat has been closed") ||
    text.includes("trade has been rejected") ||
    text.includes("trade approved") ||
    text.includes("trade rejected") ||
    text.includes("chat closed") ||
    text.startsWith("reason:")
  );
};

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
    params.type === "new"
      ? null
      : params.chatId ||
        (params.tradeId
          ? params.tradeId.startsWith("trade_") || params.tradeId.startsWith("support_")
            ? params.tradeId
            : `trade_${params.tradeId}`
          : null);

  const [chatId, setChatId] = useState<string | null>(resolvedChatId);
  useFocusEffect(
    useCallback(() => {
      if (chatId) {
        setGlobalActiveChatId(chatId);
        dismissChatNotification(chatId);
        markChatReadByUser(chatId).catch(() => {});
      }
      return () => {
        setGlobalActiveChatId(null);
      };
    }, [chatId])
  );

  useEffect(() => {
    hasInitialScrolledRef.current = false;
  }, [chatId]);

  const [inputText, setInputText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showEndChatModal, setShowEndChatModal] = useState(false);
  // Snapshot of how many agent messages were unread when the chat was opened
  const [openUnreadCount, setOpenUnreadCount] = useState<number>(0);
  const isUnreadSeededRef = useRef<boolean>(false);
  const hasInitialScrolledRef = useRef<boolean>(false);
  // Scroll-position tracking for unread counter behaviour (Section 3)
  const BOTTOM_THRESHOLD = 150; // px from bottom to be considered "near bottom"
  const isNearBottomRef = useRef<boolean>(true); // inverted list starts at bottom
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [floatingUnreadCount, setFloatingUnreadCount] = useState<number>(0);
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

  const { messages, chatInfo, isLoading, isSending, isUploading, sendText, sendImage, endChat, markAllAsRead } =
    useFirebaseChat(chatId, userId, userName, userAvatar || "");

  // Continuously ensure active chat document has customer's current push token
  useEffect(() => {
    if (chatId && expoPushToken) {
      updateChatPushToken(chatId, expoPushToken).catch((err) => {
        console.warn("[TradeChat] Failed to sync push token:", err);
      });
    }
  }, [chatId, expoPushToken]);

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

  // Handle Android Soft Input Mode (ADJUST_NOTHING prevents window resizing, avoiding double-spacing)
  useEffect(() => {
    if (Platform.OS === "android") {
      try {
        KeyboardController.setInputMode(AndroidSoftInputModes.SOFT_INPUT_ADJUST_NOTHING);
      } catch (e) {}
      return () => {
        // Restore default on unmount
        try {
          KeyboardController.setInputMode(AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE);
        } catch (e) {}
      };
    }
  }, []);

  const keyboardHeight = useSharedValue(0);

  // Synchronized frame-by-frame 60/120fps keyboard animation (moves simultaneously with keyboard)
  useKeyboardHandler(
    {
      onStart: (e: any) => {
        "worklet";
        keyboardHeight.value = e.height;
      },
      onMove: (e: any) => {
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
    },
    []
  );

  // Fallback for environments without native KeyboardController
  useEffect(() => {
    if (!isKeyboardControllerLinked) {
      const showSub = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
        (e) => {
          keyboardHeight.value = withTiming(e.endCoordinates.height, { duration: 250 });
        }
      );
      const hideSub = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
        () => {
          keyboardHeight.value = withTiming(0, { duration: 200 });
        }
      );
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(0, Math.abs(keyboardHeight.value) - (Platform.OS === "android" ? insets.bottom - 10 : insets.bottom - 10)),
  }));

  const isSupportChat =
    Boolean(chatId?.startsWith("support_")) ||
    params.isSupport === "true" ||
    params.cardCategory === "Support" ||
    chatInfo?.type === "support" ||
    (!params.tradeId && !chatInfo?.tradeId);
  const agentDisplayName = chatInfo?.assignedAgentName || "Atrader customer support";

  // Normalize trade and chat status from real-time Firestore chatInfo and backend REST tradeData
  const rawTradeStatus = (
    chatInfo?.tradeStatus ||
    (chatInfo as any)?.status ||
    (tradeData?.plan_status === 1 ? "approved" : tradeData?.plan_status === 2 ? "rejected" : null) ||
    "pending"
  ).toLowerCase();

  // If the Firestore document says the chat is currently open/active/pending,
  // the chat was reopened — treat it as pending regardless of message history.
  const isCurrentlyReopened =
    chatInfo?.chatStatus === "open" ||
    chatInfo?.tradeStatus === "pending" ||
    (chatInfo as any)?.status === "active";

  // Check system messages for approval or rejection in case document state lagged.
  // Sort messages by timestamp so we know the LAST status event.
  const sortedMessages = [...(messages || [])].sort((a, b) => {
    const aT = a.createdAt?.seconds ?? 0;
    const bT = b.createdAt?.seconds ?? 0;
    return aT - bT;
  });

  const hasApprovedMessage = sortedMessages.some(
    (m) =>
      isSystemMessage(m) &&
      (m.text?.toLowerCase().includes("trade has been approved") ||
        m.text?.toLowerCase().includes("funds would be sent soon") ||
        m.text?.toLowerCase().includes("trade approved"))
  );

  const hasRejectedMessage = sortedMessages.some(
    (m) =>
      isSystemMessage(m) &&
      (m.text?.toLowerCase().includes("trade has been rejected") ||
        m.text?.toLowerCase().includes("trade rejected"))
  );

  // "Chat has been reopened" appearing AFTER the rejection cancels the rejected state.
  const lastReopenIdx = sortedMessages.findLastIndex(
    (m) => isSystemMessage(m) && m.text?.toLowerCase().includes("chat has been reopened")
  );
  const lastRejectIdx = sortedMessages.findLastIndex(
    (m) =>
      isSystemMessage(m) &&
      (m.text?.toLowerCase().includes("trade has been rejected") ||
        m.text?.toLowerCase().includes("trade rejected"))
  );
  // If a reopen event happened after the most recent rejection, cancel the rejected state.
  const wasReopenedAfterRejection = lastReopenIdx !== -1 && lastReopenIdx > lastRejectIdx;

  const messageRejectReason = sortedMessages
    .filter((m) => isSystemMessage(m) && m.text?.toLowerCase().includes("reason:"))
    .slice(-1)[0]
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
    // Chat was explicitly reopened (Firestore or message history) — not rejected anymore
    !isCurrentlyReopened &&
    !wasReopenedAfterRejection &&
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

  // A chat is considered closed when marked closed/reject in Firestore, or when trade is resolved.
  // General app support should ALWAYS remain open!
  // If the chat was reopened (Firestore chatStatus: "open" or a "Chat has been reopened" system
  // message appears AFTER the last "Chat has been closed" message), treat it as open.
  const lastClosedMsgIdx = sortedMessages.findLastIndex(
    (m) => isSystemMessage(m) && m.text?.toLowerCase().includes("chat has been closed")
  );
  const lastReopenMsgIdx = sortedMessages.findLastIndex(
    (m) => isSystemMessage(m) && m.text?.toLowerCase().includes("chat has been reopened")
  );
  const hasBeenReopened =
    isCurrentlyReopened ||
    (lastReopenMsgIdx !== -1 && lastReopenMsgIdx > lastClosedMsgIdx);

  const isChatClosed =
    !isSupportChat &&
    !hasBeenReopened &&
    (chatInfo?.chatStatus === "closed" ||
      (chatInfo as any)?.status === "closed" ||
      (chatInfo as any)?.status === "reject" ||
      chatInfo?.tradeStatus === "rejected" ||
      isTradeRejected ||
      (lastClosedMsgIdx !== -1 && lastReopenMsgIdx <= lastClosedMsgIdx));

  const rejectionReason =
    chatInfo?.rejectReason ||
    (chatInfo as any)?.reject_reason ||
    tradeData?.reject_reason ||
    messageRejectReason ||
    "";

  // Scroll to bottom when new messages arrive - REMOVED for inverted list
  // Inverted lists are anchored to the bottom by default.

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setShowScrollButton(false);
    setFloatingUnreadCount(0);
    setOpenUnreadCount(0);
    if (chatId) {
      markChatReadByUser(chatId).catch(() => {});
    }
  }, [chatId]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isChatClosed) return;
    const text = inputText;
    setInputText("");
    // Instantly reset unread counters in local state & clear unread divider
    setOpenUnreadCount(0);
    setFloatingUnreadCount(0);
    scrollToBottom();
    try {
      await sendText(text);
      if (chatId) {
        markChatReadByUser(chatId).catch(() => {});
      }
    } catch (error) {
      setInputText(text); // restore on error
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  }, [inputText, sendText, isChatClosed, scrollToBottom, chatId]);

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
      setOpenUnreadCount(0);
      setFloatingUnreadCount(0);
      scrollToBottom();
      try {
        for (const asset of result.assets) {
          await sendImage(asset.uri, asset.fileName || undefined);
        }
        if (chatId) {
          markChatReadByUser(chatId).catch(() => {});
        }
      } catch (error) {
        Alert.alert("Error", "Failed to send one or more images. Please try again.");
      }
    }
  }, [sendImage, isChatClosed, scrollToBottom, chatId]);

  const handleEndChat = useCallback(async () => {
    if (isSupportChat) return; // General app support cannot be ended
    setShowEndChatModal(true);
  }, [isSupportChat]);

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


  // Seed the openUnreadCount from chatInfo on first valid read
  useEffect(() => {
    if (!isUnreadSeededRef.current && chatInfo !== null) {
      isUnreadSeededRef.current = true;
      const raw =
        (chatInfo as any).unreadByCustomer ||
        (chatInfo as any).unreadByUser ||
        (chatInfo as any).unreadCount ||
        0;
      setOpenUnreadCount(Math.max(0, Number(raw) || 0));
    }
  }, [chatInfo]);

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
  // Index in chronologicalMessages (inverted: 0 is newest, length-1 is oldest) where unread agent messages start
  const firstUnreadIndex = React.useMemo(() => {
    if (!chronologicalMessages.length) return -1;

    // Check individual message readByUser status: the first unread in the stream is the oldest unread (highest index in inverted list)
    let maxUnreadIdx = -1;
    for (let i = 0; i < chronologicalMessages.length; i++) {
      const m = chronologicalMessages[i];
      if (m.senderType !== "user" && !isSystemMessage(m) && m.readByUser === false) {
        maxUnreadIdx = i;
      }
    }
    if (maxUnreadIdx !== -1) return maxUnreadIdx;

    // Fallback to openUnreadCount
    if (openUnreadCount > 0) {
      let agentCount = 0;
      let targetIdx = -1;
      for (let i = 0; i < chronologicalMessages.length; i++) {
        const m = chronologicalMessages[i];
        if (m.senderType !== "user" && !isSystemMessage(m)) {
          agentCount++;
          targetIdx = i;
          if (agentCount >= openUnreadCount) break;
        }
      }
      return targetIdx;
    }

    return -1;
  }, [chronologicalMessages, openUnreadCount]);

  // Initial scroll-into-view handler: triggers on component mount or data fetch completion
  useEffect(() => {
    if (isLoading || isCreating || chronologicalMessages.length === 0) return;
    if (hasInitialScrolledRef.current) return;

    hasInitialScrolledRef.current = true;

    const timer = setTimeout(() => {
      if (firstUnreadIndex > 0 && firstUnreadIndex < chronologicalMessages.length) {
        try {
          flatListRef.current?.scrollToIndex({
            index: firstUnreadIndex,
            animated: false,
            viewPosition: 0.5,
          });
        } catch {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }
      } else {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [isLoading, isCreating, chronologicalMessages.length, firstUnreadIndex]);

  const imageMessages = React.useMemo(() => {
    return chronologicalMessages.filter(msg => msg.type === "image" && msg.imageUrl);
  }, [chronologicalMessages]);

  // Track when new messages arrive while scrolled away from bottom
  const prevMessageCountRef = useRef<number>(0);
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const currentCount = chronologicalMessages.length;
    if (currentCount > prevCount && prevCount > 0) {
      const newAgentMessages = chronologicalMessages
        .slice(0, currentCount - prevCount)
        .filter(m => m.senderType !== "user" && !isSystemMessage(m));
      if (newAgentMessages.length > 0) {
        if (isNearBottomRef.current) {
          // User is at bottom: auto-scroll and mark read
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          if (chatId) markChatReadByUser(chatId).catch(() => {});
        } else {
          // User is scrolled up: increment floating counter
          setFloatingUnreadCount(prev => prev + newAgentMessages.length);
        }
      }
    }
    prevMessageCountRef.current = currentCount;
  }, [chronologicalMessages.length]);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const nearBottom = offsetY <= BOTTOM_THRESHOLD;
    const wasNearBottom = isNearBottomRef.current;
    isNearBottomRef.current = nearBottom;

    if (nearBottom) {
      // Arrived at bottom: clear everything and mark read
      if (!wasNearBottom) {
        setShowScrollButton(false);
        setFloatingUnreadCount(0);
        setOpenUnreadCount(0);
        if (chatId) markChatReadByUser(chatId).catch(() => {});
      }
    } else {
      // Scrolled away from bottom
      setShowScrollButton(true);
    }
  }, [chatId]);

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

  const renderMessage = ({ item, index }: { item: MessageDocument; index: number }) => {
    const isSystem = isSystemMessage(item);
    const isUser = item.senderType === "user";

    // Unread divider: appears above the first unread agent message in the stream
    const showDivider = firstUnreadIndex >= 0 && index === firstUnreadIndex;
    const isUnreadMessage =
      firstUnreadIndex >= 0 &&
      index <= firstUnreadIndex &&
      item.senderType !== "user" &&
      !isSystemMessage(item);

    const unreadCountDisplay =
      openUnreadCount > 0
        ? openUnreadCount
        : firstUnreadIndex >= 0
          ? firstUnreadIndex + 1
          : 0;

    const dividerEl = showDivider ? (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginVertical: 12,
          marginHorizontal: 4,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: "#28A712", opacity: 0.4 }} />
        <ThemedText
          family="primary"
          weight="bold"
          style={{
            color: "#28A712",
            fontSize: 11,
            marginHorizontal: 10,
            backgroundColor: isDark ? "#0C0C0C" : "#FFFFFF",
            paddingHorizontal: 6,
          }}
        >
          {unreadCountDisplay} unread {unreadCountDisplay === 1 ? "message" : "messages"}
        </ThemedText>
        <View style={{ flex: 1, height: 1, backgroundColor: "#28A712", opacity: 0.4 }} />
      </View>
    ) : null;

    if (isSystem) {
      // System Message (centered notification)
      return (
        <View style={{ width: "100%", marginBottom: 8, paddingHorizontal: 20, alignItems: "center" }}>
          <View
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 6,
              maxWidth: 335,
            }}
          >
            <ThemedText
              family="primary"
              weight="medium"
              style={{
                fontSize: 12,
                lineHeight: 15.6,
                letterSpacing: -0.17,
                textAlign: "center",
                color: isDark ? "#B5B5B5" : "#71717A",
              }}
            >
              {item.text}
            </ThemedText>
          </View>
        </View>
      );
    }

    if (!isUser) {
      // Support / Agent Message (aligned to LEFT)
      return (
        <>
          {dividerEl}
          <View style={{ width: "100%", marginBottom: 8, paddingLeft: 20, paddingRight: 80 }}>
          <View style={{ alignItems: "flex-start" }}>
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
                  backgroundColor: isUnreadMessage
                    ? (isDark ? "#0d1f0a" : "#EEF9EC")
                    : (isDark ? "#111111" : "#F8F8F8"),
                  borderWidth: isUnreadMessage ? 1 : (isDark ? 0.5 : 0),
                  borderColor: isUnreadMessage ? "#28A712" : "#232323",
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
                    textAlign: "left",
                  }}
                >
                  {formatTime(item.createdAt)}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
        </>
      );
    }

    // User Message (aligned to RIGHT)
    return (
      <View style={{ width: "100%", marginBottom: 8, paddingLeft: 80, paddingRight: 20 }}>
        <View style={{ alignItems: "flex-end" }}>
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
                backgroundColor: isDark ? "#0B2E02" : "#E8FFE4",
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
                  textAlign: "right",
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
      </View>
    );
  };

  // ============================================
  // Main Layout
  // ============================================
  return (
    <BottomSheetModalProvider>
      <ThemedView className="flex-1">
        <Animated.View style={[{ flex: 1 }, animatedContainerStyle]}>
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
                          ? `â‚¦${formatNumber(tradeData.estimated)}`
                          : `â‚¦${formatNumber(chatInfo?.settlementAmount || params.settlementAmount || "0")}`}
                      {tradeData?.rate ? ` (@ â‚¦${tradeData.rate})` : ""}
                    </ThemedText>
                  </View>
                </View>

                {/* Status Badge */}
                <View
                  style={{
                    height: 35,
                    borderRadius: 100,
                    paddingVertical: 6,
                    paddingHorizontal: 16,
                    backgroundColor: statusBgColor,
                    borderWidth: 1,
                    borderColor: statusBorderColor,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ThemedText
                    family="primary"
                    weight="medium"
                    style={{
                      fontSize: 14,
                      lineHeight: 22.4,
                      color: statusColor,
                      flexShrink: 0,
                      paddingRight: 2,
                    }}
                  >
                    {`${displayStatusText} `}
                  </ThemedText>
                </View>
              </View>
            </Pressable>
          )}

          {/* Encryption Notice */}
          <View style={{ width: 335, alignSelf: "center", marginTop: 12, marginBottom: 12 }}>
            <ThemedText
              family="primary"
              weight="medium"
              style={{
                fontSize: 12,
                lineHeight: 15.6,
                letterSpacing: -0.17,
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
                paddingBottom: 10,
                paddingTop: 10, // Added for inverted list top (which is visual bottom)
                flexGrow: 1
              }}
              initialNumToRender={Math.max(20, (firstUnreadIndex >= 0 ? firstUnreadIndex + 5 : 20))}
              maxToRenderPerBatch={20}
              windowSize={11}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={100}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  try {
                    flatListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: false,
                      viewPosition: 0.5,
                    });
                  } catch {
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
                  }
                }, 100);
              }}
            />
          )}

          {/* Trade Status Bar (appears when trade is resolved) - HIDE FOR SUPPORT CHATS */}
          {!isSupportChat && !isChatClosed && (isTradeApproved || isTradeRejected) && (
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
                      style={{ width: 65, height: 66 }}
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
                      marginLeft: isTradeApproved ? -5 : 10,
                      color: isDark ? "#FFFFFF" : "#111111",
                      flexShrink: 0,
                      paddingRight: 2,
                    }}
                  >
                    {isTradeApproved ? "Trade successful " : "Trade rejected "}
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

          {/* Floating scroll-to-latest button */}
          {showScrollButton && (
            <Pressable
              onPress={scrollToBottom}
              style={{
                position: "absolute",
                bottom: 80,
                alignSelf: "center",
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                shadowColor: "#000",
                shadowOpacity: 0.18,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 5,
                borderWidth: 1,
                borderColor: isDark ? "#333" : "#EFEFEF",
                gap: 6,
              }}
            >
              {floatingUnreadCount > 0 && (
                <View
                  style={{
                    backgroundColor: "#28A712",
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 5,
                  }}
                >
                  <ThemedText
                    family="primary"
                    weight="bold"
                    style={{ fontSize: 11, color: "#FFFFFF", lineHeight: 14 }}
                  >
                    {floatingUnreadCount}
                  </ThemedText>
                </View>
              )}
              <ThemedText
                family="primary"
                weight="medium"
                style={{ fontSize: 13, color: isDark ? "#E7E7E7" : "#333" }}
              >
                â†“ {floatingUnreadCount > 0 ? "New messages" : "Scroll to latest"}
              </ThemedText>
            </Pressable>
          )}

          {/* Input Bar or Closed Trade Banner */}
          {isChatClosed ? (
            <View
              className="pt-3 border-t bg-white dark:bg-[#111111]"
              style={{
                borderTopColor: isDark ? "#232323" : "#EFEFEF",
                paddingBottom: Math.max(insets.bottom, 16),
              }}
            >
              <View className="px-5">
                <View
                  style={{
                    borderRadius: 18,
                    backgroundColor: isDark ? "#231715" : "#FFF7F4",
                    borderWidth: 1,
                    borderColor: isDark ? "#38221D" : "#FDE6DE",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <ThemedText
                      family="primary"
                      weight="bold"
                      style={{
                        fontSize: 15,
                        lineHeight: 20,
                        color: isDark ? "#FFFFFF" : "#1A1A1A",
                      }}
                    >
                      {isTradeApproved ? "Trade Successful" : "Trade Cancelled"}
                    </ThemedText>
                    <ThemedText
                      family="secondary"
                      weight="regular"
                      style={{
                        fontSize: 13,
                        lineHeight: 18,
                        marginTop: 2,
                        color: isDark ? "#9CA3AF" : "#555555",
                      }}
                    >
                      {isTradeApproved
                        ? "Your gift card trade has been completed."
                        : "Your gift card trade has been cancelled."}
                    </ThemedText>
                  </View>
                  {!isTradeApproved && (
                    <Svg width={38} height={34} viewBox="0 0 24 22" fill="none">
                      <Path
                        d="M10.268 1.488C11.037.156 12.963.156 13.732 1.488l9.08 15.728C23.58 18.547 22.617 20.25 21.08 20.25H2.92C1.383 20.25.42 18.547 1.188 17.216l9.08-15.728z"
                        fill="#EF4444"
                      />
                      <Path
                        d="M12 6.5v6"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                      <Path
                        d="M12 16.25v.01"
                        stroke="#FFFFFF"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                      />
                    </Svg>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <View
              className="pt-3 border-t bg-white dark:bg-[#111111]"
              style={{
                borderTopColor: isDark ? "#232323" : "#EFEFEF",
                paddingBottom: Math.max(insets.bottom, 12),
              }}
            >
              <View className="px-5">
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
                      borderWidth: 0,
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
              </View>
            </View>
          )}
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
