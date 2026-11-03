import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { MessageCircle, X } from "lucide-react-native";
import { useAppSelector } from "@/redux/store";
import {
  subscribeToUserChats,
  getChatUnreadCount,
  updateChatPushToken,
  type ChatDocument,
} from "@/lib/firebase-chat-service";
import { useNotifications } from "@/context/NotificationsProvider";
import {
  setGlobalActiveChatId,
  getGlobalActiveChatId,
  isViewingChat,
  dismissChatNotification,
} from "@/lib/chat-state";

// Re-export for convenience across the app
export { setGlobalActiveChatId, getGlobalActiveChatId, isViewingChat };

export interface BannerPayload {
  name: string;
  text: string;
  chat?: ChatDocument | null;
  chatId?: string;
  tradeId?: string | null;
  cardName?: string;
  cardCategory?: string;
  isSupport?: boolean;
}

// Global programmatic banner trigger for notification listener
let globalShowBanner: ((payload: BannerPayload) => void) | null = null;

export const showInAppNotification = (payload: BannerPayload) => {
  if (globalShowBanner) {
    globalShowBanner(payload);
  }
};

export const InAppNotificationBanner = () => {
  const router = useRouter();
  const { expoPushToken } = useNotifications();
  const insets = useSafeAreaInsets();
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};

  const [inAppNotif, setInAppNotif] = useState<BannerPayload | null>(null);
  const notifAnim = useRef(new Animated.Value(-140)).current;
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCountsRef = useRef<Record<string, number>>({});
  const lastTimestampsRef = useRef<Record<string, number>>({});
  const isInitialLoadRef = useRef(true);

  const dismissBanner = useCallback(() => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    Animated.timing(notifAnim, {
      toValue: -140,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setInAppNotif(null));
  }, [notifAnim]);

  const showBanner = useCallback(
    (payload: BannerPayload) => {
      // Do not display if user is actively viewing this conversation
      const targetChatId = payload.chat?.chatId || payload.chatId;
      if (isViewingChat(targetChatId)) {
        return;
      }

      if (notifTimer.current) clearTimeout(notifTimer.current);
      setInAppNotif(payload);
      Animated.spring(notifAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      notifTimer.current = setTimeout(() => {
        Animated.timing(notifAnim, {
          toValue: -140,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setInAppNotif(null));
      }, 4000);
    },
    [notifAnim]
  );

  // Register global programmatic banner trigger
  useEffect(() => {
    globalShowBanner = showBanner;
    return () => {
      globalShowBanner = null;
    };
  }, [showBanner]);

  const handlePressBanner = useCallback(() => {
    if (!inAppNotif) return;
    const { chat, chatId, tradeId, cardName, cardCategory, isSupport } = inAppNotif;
    dismissBanner();

    const targetChatId = chat?.chatId || chatId;
    if (!targetChatId) return;

    const resolvedIsSupport =
      isSupport ??
      (chat?.type === "support" ||
        targetChatId.startsWith("support_") ||
        !chat?.tradeId);

    const resolvedCardName =
      cardName || chat?.cardName || (resolvedIsSupport ? "App Support" : "Gift Card");

    router.push({
      pathname: "/(protected)/(features)/trade-chat" as any,
      params: {
        chatId: targetChatId,
        tradeId: (tradeId ?? chat?.tradeId) || "",
        cardName: resolvedCardName,
        cardCategory: (cardCategory ?? chat?.cardCategory) || (resolvedIsSupport ? "Support" : ""),
        type: "existing",
        isSupport: resolvedIsSupport ? "true" : "false",
      },
    });
  }, [inAppNotif, dismissBanner, router]);

  // Subscribe to all chats for the logged in user
  useEffect(() => {
    const authUid = getAuth().currentUser?.uid;
    const candidateIds = Array.from(
      new Set(
        [authUid, userInfo?.email, userInfo?.id]
          .filter((id): id is string => Boolean(id) && typeof id === "string" && id.trim().length > 0)
      )
    );

    if (candidateIds.length === 0) return;

    isInitialLoadRef.current = true;

    const unsubscribe = subscribeToUserChats(candidateIds, (chats) => {
      chats.forEach((chatData) => {
        const chatId = chatData.chatId;
        const newCount = getChatUnreadCount(chatData);
        const prevCount = unreadCountsRef.current[chatId] ?? 0;

        // Dismiss tray notification if conversation was read (e.g. read synced from another device)
        if (newCount === 0 && prevCount > 0) {
          dismissChatNotification(chatId);
        }

        const getTs = (ts: any) => {
          if (!ts) return 0;
          if (typeof ts.toMillis === "function") return ts.toMillis();
          if (ts.seconds) return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6;
          if (typeof ts === "string") return new Date(ts).getTime();
          return 0;
        };

        // Auto-sync push token to Firestore if available and out-of-date
        if (expoPushToken && chatData.userExpoPushToken !== expoPushToken) {
          updateChatPushToken(chatId, expoPushToken).catch(() => {});
        }

        const currentTs = getTs(chatData.lastMessageAt || chatData.updatedAt);
        const prevTs = lastTimestampsRef.current[chatId] ?? 0;

        // Condition to show in-app banner:
        // 1. Not the very first load (seed initial state)
        // 2. Either unread count increased OR newer message timestamp arrived
        // 3. Activity is from an agent/support (not sent by user or closed system notification)
        // 4. User is NOT currently viewing this exact chat
        const isFromAgent = chatData.lastMessageSender === "agent" || (chatData as any).senderType === "agent";
        const unreadIncreased = newCount > prevCount;
        const hasNewActivity = unreadIncreased || (currentTs > prevTs && currentTs > 0);
        const isClosedSystemMessage =
          chatData.chatStatus === "closed" &&
          (chatData.lastMessage?.toLowerCase().includes("closed") || chatData.lastMessageSender === "system");

        const isAgentActivity =
          isFromAgent || (unreadIncreased && chatData.lastMessageSender !== "user");

        if (
          !isInitialLoadRef.current &&
          hasNewActivity &&
          isAgentActivity &&
          !isClosedSystemMessage &&
          !isViewingChat(chatId)
        ) {
          const isSupport =
            chatData.type === "support" ||
            chatData.chatId?.startsWith("support_") ||
            !chatData.tradeId;

          const title = isSupport
            ? "App Support"
            : `Trade Support ~ ${chatData.cardName || "Gift Card"}`;

          const preview = chatData.lastMessage || "New message awaiting you";
          showBanner({
            name: title,
            text: preview,
            chat: chatData,
            chatId: chatData.chatId,
            tradeId: chatData.tradeId,
            cardName: chatData.cardName,
            cardCategory: chatData.cardCategory,
            isSupport,
          });
        }

        unreadCountsRef.current[chatId] = newCount;
        lastTimestampsRef.current[chatId] = currentTs;
      });

      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userInfo, showBanner]);

  if (!inAppNotif) return null;

  const topOffset = insets.top > 0 ? insets.top + 8 : (Platform.OS === "android" ? 40 : 50);

  return (
    <Animated.View
      style={[
        styles.inAppBanner,
        {
          marginTop: topOffset,
          transform: [{ translateY: notifAnim }],
        },
      ]}
    >
      <Pressable
        style={styles.contentRow}
        onPress={handlePressBanner}
      >
        <View style={styles.inAppBannerIcon}>
          <MessageCircle size={22} color="#ffffff" />
        </View>
        <View style={styles.inAppBannerText}>
          <Text style={styles.inAppBannerName} numberOfLines={1}>
            {inAppNotif.name}
          </Text>
          <Text style={styles.inAppBannerPreview} numberOfLines={1}>
            {inAppNotif.text}
          </Text>
        </View>
        <Pressable
          hitSlop={12}
          onPress={(e) => {
            e.stopPropagation();
            dismissBanner();
          }}
          style={styles.closeButton}
        >
          <X size={18} color="rgba(255, 255, 255, 0.7)" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  inAppBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 99999,
    backgroundColor: "#1a1a2e",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  inAppBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#28A712",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  inAppBannerText: {
    flex: 1,
  },
  inAppBannerName: {
    color: "#ffffff",
    fontFamily: "MonaSans-Bold",
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 2,
  },
  inAppBannerPreview: {
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "MonaSans-Regular",
    fontSize: 13,
    lineHeight: 17,
  },
  closeButton: {
    padding: 6,
    marginLeft: 8,
  },
});
