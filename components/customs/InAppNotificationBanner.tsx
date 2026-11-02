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
  type ChatDocument,
} from "@/lib/firebase-chat-service";

// Active chat ID tracker across the entire app
let currentActiveChatId: string | null = null;

export const setGlobalActiveChatId = (id: string | null) => {
  currentActiveChatId = id;
};

export const getGlobalActiveChatId = () => currentActiveChatId;

interface BannerPayload {
  name: string;
  text: string;
  chat: ChatDocument;
}

export const InAppNotificationBanner = () => {
  const router = useRouter();
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
    (name: string, text: string, chat: ChatDocument) => {
      if (notifTimer.current) clearTimeout(notifTimer.current);
      setInAppNotif({ name, text, chat });
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

  const handlePressBanner = useCallback(() => {
    if (!inAppNotif?.chat) return;
    const chat = inAppNotif.chat;
    dismissBanner();

    const isSupport =
      chat.type === "support" ||
      chat.chatId?.startsWith("support_") ||
      !chat.tradeId;

    router.push({
      pathname: "/(protected)/(features)/trade-chat" as any,
      params: {
        chatId: chat.chatId,
        tradeId: chat.tradeId || "",
        cardName: chat.cardName || (isSupport ? "App Support" : "Gift Card"),
        cardCategory: isSupport ? "Support" : (chat.cardCategory || ""),
        type: "existing",
        isSupport: isSupport ? "true" : "false",
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

        const getTs = (ts: any) => {
          if (!ts) return 0;
          if (typeof ts.toMillis === "function") return ts.toMillis();
          if (ts.seconds) return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6;
          if (typeof ts === "string") return new Date(ts).getTime();
          return 0;
        };

        const currentTs = getTs(chatData.lastMessageAt);
        const prevTs = lastTimestampsRef.current[chatId] ?? 0;

        // Condition to show in-app banner:
        // 1. Not the very first load (seed initial state)
        // 2. Either unread count increased OR newer message timestamp arrived from an agent
        // 3. Last message is from an agent (not the user's own sent message)
        // 4. User is NOT currently viewing this exact chat
        const isFromAgent = chatData.lastMessageSender !== "user";
        const hasNewActivity = newCount > prevCount || (currentTs > prevTs && currentTs > 0);

        if (
          !isInitialLoadRef.current &&
          hasNewActivity &&
          isFromAgent &&
          currentActiveChatId !== chatId
        ) {
          const isSupport =
            chatData.type === "support" ||
            chatData.chatId?.startsWith("support_") ||
            !chatData.tradeId;

          const title = isSupport
            ? "App Support"
            : `Trade Support ~ ${chatData.cardName || "Gift Card"}`;

          const preview = chatData.lastMessage || "New message received";
          showBanner(title, preview, chatData);
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
          <Text style={styles.inAppBannerMsg} numberOfLines={1}>
            {inAppNotif.text}
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={dismissBanner} hitSlop={12} style={styles.closeButton}>
        <X size={18} color="rgba(255,255,255,0.7)" />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  inAppBanner: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 99999,
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inAppBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#28A712",
    alignItems: "center",
    justifyContent: "center",
  },
  inAppBannerText: {
    flex: 1,
  },
  inAppBannerName: {
    fontFamily: "MonaSans-Bold",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  inAppBannerMsg: {
    fontFamily: "MonaSans-Regular",
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  closeButton: {
    padding: 4,
  },
});
