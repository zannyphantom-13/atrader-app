import ChatTypeModal from "@/components/modals/ChatTypeModal";
import { ChatListSkeleton } from "@/components/skeletons/chatskeleton";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { img } from "@/constant/image";
import { useNotifications } from "@/context/NotificationsProvider";
import { useTheme } from "@/context/ThemeProvider";
import { useChatList } from "@/hooks/useChatList";
import { createTradeChat, markChatReadByUser } from "@/lib/firebase-chat-service";
import { openChat } from "@/lib/zoho-service";
import { useAppSelector } from "@/redux/store";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { MessageSquare } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatTimestamp = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return "";
  try {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const SupportChatScreen = () => {
  const { isDark } = useTheme();
  const { expoPushToken } = useNotifications();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};
  const userId = getAuth().currentUser?.uid || userInfo?.email || userInfo?.id || "";

  const { chats, isLoading } = useChatList(userId);
  const [showChatTypeModal, setShowChatTypeModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Navigate to trade or support chat
  const handleOpenChat = useCallback(
    (chatId: string, cardName: string, tradeId: string | null) => {
      // Optimistic mark read
      markChatReadByUser(chatId).catch((err) =>
        console.warn("[SupportChat] markChatReadByUser failed:", err)
      );

      const isSupport = !tradeId || chatId.startsWith("support_");

      router.push({
        pathname: "/(protected)/(features)/trade-chat" as any,
        params: {
          chatId: chatId,
          tradeId: tradeId || "",
          cardName,
          cardCategory: isSupport ? "Support" : "",
          type: "existing",
          isSupport: isSupport ? "true" : "false",
        },
      });
    },
    [router]
  );

  // Open General App Support (always open)
  const handleOpenAppSupport = useCallback(async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const chatId = await createTradeChat({
        tradeId: "",
        userId: getAuth().currentUser?.uid || user.id || "",
        userName: userInfo?.name || userInfo?.username || "User",
        userAvatar: userInfo?.profile_picture || null,
        userExpoPushToken: expoPushToken,
        cardName: "App Support",
        cardCategory: "Support",
        cardAmount: "",
        settlementAmount: "",
        chatType: "support",
      });

      handleOpenChat(chatId, "App Support", null);
    } catch (error) {
      console.error("Failed to open App Support chat:", error);
    } finally {
      setIsCreating(false);
    }
  }, [user, expoPushToken, handleOpenChat, userInfo]);

  // Handle Gift Card Issues from modal
  const handleGiftCardIssue = useCallback(async () => {
    setShowChatTypeModal(false);
    await handleOpenAppSupport();
  }, [handleOpenAppSupport]);

  // Handle App Support from modal
  const handleAppSupport = useCallback(async () => {
    setShowChatTypeModal(false);
    await handleOpenAppSupport();
  }, [handleOpenAppSupport]);

  const renderChatItem = ({ item }: { item: any }) => {
    const isAppSupport = item.type === "support" && !item.tradeId;
    const title = isAppSupport
      ? "Gift Card Support"
      : `Trade Support ~ ${item.cardName || "Gift Card"}`;

    const isUnread = (item.unreadByUser || 0) > 0;
    const unreadCount = item.unreadByUser || 0;
    const formattedCount = unreadCount > 99 ? "99+" : `${unreadCount}`;

    return (
      <Pressable
        onPress={() => handleOpenChat(item.chatId, item.cardName, item.tradeId)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 66,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#232323" : "#EFEFEF",
        }}
      >
        {/* Avatar (36x36px circle) */}
        <View style={{ width: 36, height: 36, marginRight: 12, position: "relative" }}>
          {isAppSupport ? (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderWidth: 0.5,
                borderColor: isDark ? "#333333" : "#E5E7EB",
                backgroundColor: isDark ? "#111111" : "#FFFFFF",
              }}
            >
              <Image
                source={isDark ? img.logoDarkPng : img.logolightPng}
                style={{ width: 24, height: 26 }}
                resizeMode="contain"
              />
            </View>
          ) : item.cardImage ? (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDark ? "#232323" : "#E5E7EB",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <Image
                key={item.cardImage}
                source={
                  typeof item.cardImage === "string" && item.cardImage.startsWith("http")
                    ? { uri: item.cardImage }
                    : undefined
                }
                style={{ width: 36, height: 36 }}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#111111" : "#F3F4F6",
              }}
            >
              <Image source={img.logoGreen} style={{ width: 24, height: 26 }} resizeMode="contain" />
            </View>
          )}

          {/* Online indicator */}
          {item.chatStatus === "open" && item.assignedAgent && (
            <View
              style={{
                position: "absolute",
                bottom: -1,
                right: -1,
                width: 10,
                height: 10,
                borderRadius: 5,
                borderWidth: 1.5,
                backgroundColor: "#28A712",
                borderColor: isDark ? "#0C0C0C" : "#FFFFFF",
              }}
            />
          )}
        </View>

        {/* Content Column */}
        <View style={{ flex: 1 }}>
          {/* Header row: Title + Timestamp */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <ThemedText
              family="primary"
              weight={isUnread ? "bold" : "semibold"}
              style={{
                fontSize: 14,
                lineHeight: 19.2,
                color: isDark ? "#FFFFFF" : "#0C0C0C",
                flex: 1,
                marginRight: 8,
              }}
              numberOfLines={1}
            >
              {title}
            </ThemedText>
            <ThemedText
              family="primary"
              weight={isUnread ? "medium" : "regular"}
              style={{
                fontSize: 12,
                lineHeight: 14.4,
                letterSpacing: -0.165,
                color: isUnread
                  ? "#28A712"
                  : (isDark ? "#B5B5B5" : "#71717A"),
              }}
            >
              {formatTimestamp(item.lastMessageAt)}
            </ThemedText>
          </View>

          {/* Bottom row: Preview + Unread Badge */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
            <ThemedText
              family="primary"
              weight={isUnread ? "medium" : "regular"}
              style={{
                fontSize: 12,
                lineHeight: 14.4,
                letterSpacing: -0.165,
                color: isUnread
                  ? (isDark ? "#F1F3F4" : "#1F2326")
                  : (isDark ? "#B5B5B5" : "#71717A"),
                flex: 1,
                marginRight: 8,
              }}
              numberOfLines={1}
            >
              {item.lastMessage || "No messages yet"}
            </ThemedText>

            {isUnread && (
              <View
                style={{
                  minWidth: 20,
                  height: 20,
                  paddingHorizontal: 6,
                  borderRadius: 10,
                  backgroundColor: "#28A712",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ThemedText
                  family="primary"
                  weight="bold"
                  style={{
                    fontSize: 12,
                    lineHeight: 16,
                    color: "#FFFFFF",
                    textAlign: "center",
                  }}
                >
                  {formattedCount}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const supportChat = chats.find(
    (c: any) => c.type === "support" || c.chatId?.startsWith("support_")
  );
  const tradeChats = chats.filter(
    (c: any) => c.type !== "support" && !c.chatId?.startsWith("support_")
  );

  const isSupportUnread = (supportChat?.unreadByUser || 0) > 0;
  const supportUnreadCount = supportChat?.unreadByUser || 0;
  const formattedSupportCount = supportUnreadCount > 99 ? "99+" : `${supportUnreadCount}`;

  // Static App Support item at the top (Figma Frame 167 Row 0) - Always Open
  const renderHeader = () => (
    <Pressable
      onPress={handleOpenAppSupport}
      style={{
        flexDirection: "row",
        alignItems: "center",
        minHeight: 66,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#232323" : "#EFEFEF",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          overflow: "hidden",
          borderWidth: 0.5,
          borderColor: isDark ? "#333333" : "#E5E7EB",
          backgroundColor: isDark ? "#111111" : "#FFFFFF",
        }}
      >
        <Image
          source={isDark ? img.logoDarkPng : img.logolightPng}
          style={{ width: 24, height: 26 }}
          resizeMode="contain"
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <ThemedText
            family="primary"
            weight={isSupportUnread ? "bold" : "semibold"}
            style={{
              fontSize: 14,
              lineHeight: 19.2,
              color: isDark ? "#FFFFFF" : "#0C0C0C",
            }}
          >
            App Support
          </ThemedText>
          {supportChat?.lastMessageAt && (
            <ThemedText
              family="primary"
              weight={isSupportUnread ? "medium" : "regular"}
              style={{
                fontSize: 12,
                lineHeight: 14.4,
                letterSpacing: -0.165,
                color: isSupportUnread
                  ? "#28A712"
                  : (isDark ? "#B5B5B5" : "#71717A"),
              }}
            >
              {formatTimestamp(supportChat.lastMessageAt)}
            </ThemedText>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <ThemedText
            family="primary"
            weight={isSupportUnread ? "medium" : "regular"}
            style={{
              fontSize: 12,
              lineHeight: 14.4,
              letterSpacing: -0.165,
              color: isSupportUnread
                ? (isDark ? "#F1F3F4" : "#1F2326")
                : (isDark ? "#B5B5B5" : "#71717A"),
              flex: 1,
              marginRight: 8,
            }}
            numberOfLines={1}
          >
            {supportChat?.lastMessage || "Chat with us for general help"}
          </ThemedText>

          {isSupportUnread && (
            <View
              style={{
                minWidth: 20,
                height: 20,
                paddingHorizontal: 6,
                borderRadius: 10,
                backgroundColor: "#28A712",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ThemedText
                family="primary"
                weight="bold"
                style={{
                  fontSize: 12,
                  lineHeight: 16,
                  color: "#FFFFFF",
                  textAlign: "center",
                }}
              >
                {formattedSupportCount}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <ThemedView className="flex-1">
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: isDark ? "#0C0C0C" : "#FFFFFF" }}>
        {/* Title: 22px Mona Sans SemiBold per Figma Frame 167 */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
          <ThemedText
            family="primary"
            weight="semibold"
            style={{
              fontSize: 22,
              lineHeight: 26.4,
              letterSpacing: -0.165,
              color: isDark ? "#FFFFFF" : "#0C0C0C",
            }}
          >
            Support Chat
          </ThemedText>
        </View>

        {/* Chats List */}
        {isLoading || isCreating ? (
          <View className="flex-1 pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ChatListSkeleton key={i} />
            ))}
          </View>
        ) : (
          <FlatList
            data={tradeChats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.chatId}
            ListHeaderComponent={renderHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <View className="items-center justify-center py-20">
                <MessageSquare size={48} color={isDark ? "#333" : "#D1D5DB"} />
                <ThemedText
                  family="primary"
                  style={{
                    fontSize: 14,
                    lineHeight: 19.6,
                    color: isDark ? "#B5B5B5" : "#71717A",
                    marginTop: 16,
                    textAlign: "center",
                  }}
                >
                  No trade chats yet.{"\n"}Start a trade to begin chatting!
                </ThemedText>
              </View>
            )}
          />
        )}

        {/* FAB - Chat us here (Figma: width 131, height 40, radius 10, bg #28A712, gap 6, font 14 medium) */}
        <Pressable
          onPress={() => setShowChatTypeModal(true)}
          style={{
            position: "absolute",
            right: 20,
            bottom: 24,
            width: 131,
            height: 40,
            borderRadius: 10,
            backgroundColor: "#28A712",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 9,
            paddingVertical: 8,
            shadowColor: "#28A712",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <img.chatr width={20} height={20} />
          <ThemedText
            family="primary"
            weight="medium"
            style={{
              fontSize: 14,
              lineHeight: 16.8,
              letterSpacing: -0.165,
              color: "#FFFFFF",
              marginLeft: 6,
            }}
          >
            Chat us here
          </ThemedText>
        </Pressable>

        {/* Chat Type Modal */}
        <ChatTypeModal
          visible={showChatTypeModal}
          onClose={() => setShowChatTypeModal(false)}
          onSelectGiftCard={handleGiftCardIssue}
          onSelectAppSupport={handleAppSupport}
        />
      </SafeAreaView>
    </ThemedView>
  );
};

export default SupportChatScreen;
