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
import app_colors from "@/styles/color";
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

  // Navigate to trade chat
  const handleOpenChat = useCallback(
    (chatId: string, cardName: string, tradeId: string | null) => {
      // Optimistic mark-read for instant feedback
      markChatReadByUser(chatId).catch((err) =>
        console.warn("[SupportChat] markChatReadByUser failed:", err)
      );

      router.push({
        pathname: "/(protected)/(features)/trade-chat" as any,
        params: {
          chatId: chatId,
          tradeId: tradeId || "",
          cardName,
          cardCategory: "",
          type: "existing",
        },
      });
    },
    [router]
  );

  // Handle Gift Card Issues from modal
  const handleGiftCardIssue = useCallback(async () => {
    if (!user) return;
    setShowChatTypeModal(false);
    setIsCreating(true);

    try {
      const chatId = await createTradeChat({
        tradeId: "",
        userId: getAuth().currentUser?.uid || user.id || "",
        userName: userInfo?.name || userInfo?.username || "User",
        userAvatar: userInfo?.profile_picture || null,
        userExpoPushToken: expoPushToken,
        cardName: "",
        cardCategory: "Support",
        cardAmount: "",
        settlementAmount: "",
        chatType: "support",
      });

      handleOpenChat(chatId, "General Support", null);
    } catch (error) {
      console.error("Failed to create support chat:", error);
    } finally {
      setIsCreating(false);
    }
  }, [user, expoPushToken, handleOpenChat, userInfo]);

  // Handle App Support from modal -> open Zoho
  const handleAppSupport = useCallback(() => {
    openChat("App Support");
  }, []);

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
        accessibilityLabel={`${title}, ${isUnread ? `${formattedCount} unread messages` : "no unread messages"}, ${formatTimestamp(item.lastMessageAt)}`}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 14,
          backgroundColor: pressed
            ? (isDark ? "#16191B" : "#F2F4F5")
            : (isDark ? "#0B0D0E" : "#FFFFFF"),
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1F2326" : "#E6E8EA",
        })}
      >
        {/* Avatar */}
        <View className="relative mr-3">
          {isAppSupport ? (
            <View
              className="w-11 h-11 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#333333] overflow-hidden bg-white dark:bg-[#111111]"
            >
              <Image
                source={isDark ? img.logoDarkPng : img.logolightPng}
                style={{
                  width: 32,
                  height: 32,
                }}
                resizeMode="contain"
              />
            </View>
          ) : item.cardImage ? (
            <View className="w-11 h-11 rounded-full bg-[#E5E7EB] dark:bg-[#232323] items-center justify-center overflow-hidden">
              <Image
                key={item.cardImage}
                source={
                  typeof item.cardImage === "string" && item.cardImage.startsWith("http")
                    ? { uri: item.cardImage }
                    : undefined
                }
                style={{ width: 44, height: 44 }}
              />
            </View>
          ) : (
            <View className="w-11 h-11 rounded-full items-center justify-center">
              <Image source={img.logoGreen} style={{ width: 32, height: 32 }} resizeMode="contain" />
            </View>
          )}

          {/* Online indicator */}
          {item.chatStatus === "open" && item.assignedAgent && (
            <View
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{
                backgroundColor: isDark ? "#2BD14F" : "#1E9E3A",
                borderColor: isDark ? "#0B0D0E" : "#FFFFFF",
              }}
            />
          )}
        </View>

        {/* Chat Info (Title + Preview) */}
        <View className="flex-1 mr-2">
          <ThemedText
            family="primary"
            weight={isUnread ? "bold" : "semibold"}
            style={{
              fontSize: 14,
              lineHeight: 18.2,
              color: isUnread
                ? (isDark ? "#FFFFFF" : "#0B0D0E")
                : (isDark ? "#E4E7E9" : "#1F2326"),
            }}
            numberOfLines={1}
          >
            {title}
          </ThemedText>
          <ThemedText
            family="secondary"
            weight={isUnread ? "medium" : "regular"}
            style={{
              fontSize: 13,
              lineHeight: 16.9,
              marginTop: 4,
              color: isUnread
                ? (isDark ? "#F1F3F4" : "#1F2326")
                : (isDark ? "#8A9196" : "#6B7378"),
            }}
            numberOfLines={1}
          >
            {item.lastMessage || "No messages yet"}
          </ThemedText>
        </View>

        {/* Timestamp + Unread Badge Column */}
        <View style={{ alignItems: "flex-end", justifyContent: "center", marginLeft: 8, flexShrink: 0 }}>
          <ThemedText
            family="secondary"
            style={{
              fontSize: 11,
              lineHeight: 14.3,
              color: isUnread
                ? (isDark ? "#2BD14F" : "#1E9E3A")
                : (isDark ? "#6B7378" : "#8A9196"),
              fontWeight: isUnread ? "600" : "400",
            }}
          >
            {formatTimestamp(item.lastMessageAt)}
          </ThemedText>

          {isUnread && (
            <View
              style={{
                marginTop: 6,
                minWidth: 20,
                height: 20,
                paddingHorizontal: 6,
                borderRadius: 10,
                backgroundColor: isDark ? "#2BD14F" : "#1E9E3A",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "flex-end",
              }}
            >
              <ThemedText
                family="primary"
                weight="bold"
                style={{
                  fontSize: 12,
                  lineHeight: 16,
                  color: isDark ? "#04210D" : "#FFFFFF",
                  textAlign: "center",
                }}
              >
                {formattedCount}
              </ThemedText>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  // Static App Support item at the top
  const renderHeader = () => (
    <Pressable
      onPress={() => openChat("App Support")}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: pressed
          ? (isDark ? "#16191B" : "#F2F4F5")
          : (isDark ? "#0B0D0E" : "#FFFFFF"),
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#1F2326" : "#E6E8EA",
      })}
    >
      <View
        className="w-11 h-11 items-center justify-center mr-3 rounded-full border border-[#E5E7EB] dark:border-[#333333] overflow-hidden bg-white dark:bg-[#111111]"
      >
        <Image
          source={isDark ? img.logoDarkPng : img.logolightPng}
          style={{
            width: 32,
            height: 32,
          }}
          resizeMode="contain"
        />
      </View>
      <View className="flex-1">
        <ThemedText
          family="primary"
          weight="semibold"
          style={{
            fontSize: 14,
            lineHeight: 18.2,
            color: isDark ? "#E4E7E9" : "#1F2326",
          }}
        >
          App Support
        </ThemedText>
        <ThemedText
          family="secondary"
          weight="regular"
          style={{
            fontSize: 12,
            lineHeight: 15.6,
            marginTop: 4,
            color: isDark ? "#8A9196" : "#6B7378",
          }}
          numberOfLines={1}
        >
          Chat with us for general help
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <ThemedView className="flex-1">
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: isDark ? "#0B0D0E" : "#FFFFFF" }}>
        {/* Title */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <ThemedText
            family="primary"
            weight="bold"
            style={{
              fontSize: 18,
              lineHeight: 23.4,
              color: isDark ? "#FFFFFF" : "#0B0D0E",
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
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.chatId}
            ListHeaderComponent={renderHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <View className="items-center justify-center py-20">
                <MessageSquare size={48} color={isDark ? "#3A4146" : "#D1D5DB"} />
                <ThemedText
                  family="secondary"
                  style={{
                    fontSize: 14,
                    lineHeight: 19.6,
                    color: isDark ? "#8A9196" : "#6B7378",
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

        {/* FAB - Chat us here */}
        <Pressable
          onPress={() => setShowChatTypeModal(true)}
          className="absolute right-5 flex-row items-center px-3 py-2.5 rounded-[12px] shadow-lg"
          style={{
            bottom: 20,
            backgroundColor: isDark ? "#2BD14F" : "#1E9E3A",
            shadowColor: isDark ? "#2BD14F" : "#1E9E3A",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <img.chatr width={20} height={20} />
          <ThemedText
            family="primary"
            weight="bold"
            style={{
              fontSize: 14,
              color: isDark ? "#04210D" : "#FFFFFF",
              marginLeft: 8,
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
